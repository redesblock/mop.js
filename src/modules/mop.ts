import {
  BatchId,
  Collection,
  CollectionUploadOptions,
  Data,
  FileData,
  FileUploadOptions,
  Ky,
  Readable,
  Reference,
  ReferenceOrEns,
  UploadHeaders,
  UploadResult,
} from '../types'
import { extractUploadHeaders, readFileHeaders } from '../utils/headers'
import { http } from '../utils/http'
import { prepareData } from '../utils/data'
import { makeTar } from '../utils/tar'
import { assertCollection } from '../utils/collection'
import { wrapBytesWithHelpers } from '../utils/bytes'
import { isReadable } from '../utils/stream'
import { makeTagUid } from '../utils/type'

const mopEndpoint = 'mop'

interface FileUploadHeaders extends UploadHeaders {
  'content-length'?: string
  'content-type'?: string
}

function extractFileUploadHeaders(voucherBatchId: BatchId, options?: FileUploadOptions): FileUploadHeaders {
  const headers: FileUploadHeaders = extractUploadHeaders(voucherBatchId, options)

  if (options?.size) headers['content-length'] = String(options.size)

  if (options?.contentType) headers['content-type'] = options.contentType

  return headers
}

/**
 * Upload single file
 *
 * @param ky
 * @param data Files data
 * @param voucherBatchId  Voucher BatchId that will be assigned to uploaded data
 * @param name Name that will be attached to the uploaded file. Wraps the data into manifest with set index document.
 * @param options
 */
export async function uploadFile(
  ky: Ky,
  data: string | Uint8Array | Readable | ArrayBuffer,
  voucherBatchId: BatchId,
  name?: string,
  options?: FileUploadOptions,
): Promise<UploadResult> {
  if (isReadable(data) && !options?.contentType) {
    if (!options) options = {}

    options.contentType = 'application/octet-stream'
  }

  const response = await http<{ reference: Reference }>(ky, {
    method: 'post',
    path: mopEndpoint,
    body: await prepareData(data),
    headers: {
      ...extractFileUploadHeaders(voucherBatchId, options),
    },
    searchParams: { name },
    responseType: 'json',
  })

  return {
    reference: response.data.reference,
    tagUid: makeTagUid(response.headers.get('cluster-tag')),
  }
}

/**
 * Download single file as a buffer
 *
 * @param ky Ky instance for given Mop class instance
 * @param hash Mop file or collection hash
 * @param path If hash is collection then this defines path to a single file in the collection
 */
export async function downloadFile(ky: Ky, hash: ReferenceOrEns, path = ''): Promise<FileData<Data>> {
  const response = await http<ArrayBuffer>(ky, {
    method: 'GET',
    responseType: 'arraybuffer',
    path: `${mopEndpoint}/${hash}/${path}`,
  })
  const file = {
    ...readFileHeaders(response.headers),
    data: wrapBytesWithHelpers(new Uint8Array(response.data)),
  }

  return file
}

/**
 * Download single file as a readable stream
 *
 * @param ky Ky instance for given Mop class instance
 * @param hash Mop file or collection hash
 * @param path If hash is collection then this defines path to a single file in the collection
 */
export async function downloadFileReadable(
  ky: Ky,
  hash: ReferenceOrEns,
  path = '',
): Promise<FileData<ReadableStream<Uint8Array>>> {
  const response = await http<ReadableStream<Uint8Array>>(ky, {
    method: 'GET',
    responseType: 'stream',
    path: `${mopEndpoint}/${hash}/${path}`,
  })
  const file = {
    ...readFileHeaders(response.headers),
    data: response.data,
  }

  return file
}

/*******************************************************************************************************************/

// Collections

interface CollectionUploadHeaders extends UploadHeaders {
  'cluster-index-document'?: string
  'cluster-error-document'?: string
}

function extractCollectionUploadHeaders(
  voucherBatchId: BatchId,
  options?: CollectionUploadOptions,
): CollectionUploadHeaders {
  const headers: CollectionUploadHeaders = extractUploadHeaders(voucherBatchId, options)

  if (options?.indexDocument) headers['cluster-index-document'] = options.indexDocument

  if (options?.errorDocument) headers['cluster-error-document'] = options.errorDocument

  return headers
}

/**
 * Upload collection
 * @param ky Ky instance for given Mop class instance
 * @param collection Collection of Uint8Array buffers to upload
 * @param voucherBatchId  Voucher BatchId that will be assigned to uploaded data
 * @param options
 */
export async function uploadCollection(
  ky: Ky,
  collection: Collection<Uint8Array>,
  voucherBatchId: BatchId,
  options?: CollectionUploadOptions,
): Promise<UploadResult> {
  assertCollection(collection)
  const tarData = makeTar(collection)

  const response = await http<{ reference: Reference }>(ky, {
    method: 'post',
    path: mopEndpoint,
    body: tarData,
    responseType: 'json',
    headers: {
      'content-type': 'application/x-tar',
      'cluster-collection': 'true',
      ...extractCollectionUploadHeaders(voucherBatchId, options),
    },
  })

  return {
    reference: response.data.reference,
    tagUid: makeTagUid(response.headers.get('cluster-tag')),
  }
}
