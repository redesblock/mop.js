import { BatchId, FileHeaders, UploadOptions } from '../types'
import { MopError } from './error'

/**
 * Read the filename from the content-disposition header
 * See https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Disposition
 *
 * @param header the content-disposition header value
 *
 * @returns the filename
 */
function readContentDispositionFilename(header: string | null): string {
  if (!header) {
    throw new MopError('missing content-disposition header')
  }

  // Regex was found here
  // https://stackoverflow.com/questions/23054475/javascript-regex-for-extracting-filename-from-content-disposition-header
  const dispositionMatch = header.match(/filename\*?=['"]?(?:UTF-\d['"]*)?([^;\r\n"']*)['"]?;?/i)

  if (dispositionMatch && dispositionMatch.length > 0) {
    return dispositionMatch[1]
  }
  throw new MopError('invalid content-disposition header')
}

function readTagUid(header: string | null): number | undefined {
  if (!header) {
    return undefined
  }

  return parseInt(header, 10)
}

export function readFileHeaders(headers: Headers): FileHeaders {
  const name = readContentDispositionFilename(headers.get('content-disposition'))
  const tagUid = readTagUid(headers.get('cluster-tag-uid'))
  const contentType = headers.get('content-type') || undefined

  return {
    name,
    tagUid,
    contentType,
  }
}

export function extractUploadHeaders(voucherBatchId: BatchId, options?: UploadOptions): Record<string, string> {
  if (!voucherBatchId) {
    throw new MopError('Voucher BatchID has to be specified!')
  }

  const headers: Record<string, string> = {
    'cluster-voucher-batch-id': voucherBatchId,
  }

  if (options?.pin) headers['cluster-pin'] = String(options.pin)

  if (options?.encrypt) headers['cluster-encrypt'] = String(options.encrypt)

  if (options?.tag) headers['cluster-tag'] = String(options.tag)

  if (typeof options?.deferred === 'boolean') headers['cluster-deferred-upload'] = options.deferred.toString()

  return headers
}
