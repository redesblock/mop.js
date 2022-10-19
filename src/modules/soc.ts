import { BatchId, Ky, Reference, ReferenceResponse, UploadOptions } from '../types'
import { extractUploadHeaders } from '../utils/headers'
import { http } from '../utils/http'

const socEndpoint = 'soc'

/**
 * Upload single owner chunk (SOC) to a Mop node
 *
 * @param ky Ky instance
 * @param owner           Owner's BNB Smart Chain address in hex
 * @param identifier      Arbitrary identifier in hex
 * @param signature       Signature in hex
 * @param data            Content addressed chunk data to be uploaded
 * @param voucherBatchId  Voucher BatchId that will be assigned to uploaded data
 * @param options         Additional options like tag, encryption, pinning
 */
export async function upload(
  ky: Ky,
  owner: string,
  identifier: string,
  signature: string,
  data: Uint8Array,
  voucherBatchId: BatchId,
  options?: UploadOptions,
): Promise<Reference> {
  const response = await http<ReferenceResponse>(ky, {
    method: 'post',
    path: `${socEndpoint}/${owner}/${identifier}`,
    body: data,
    headers: {
      'content-type': 'application/octet-stream',
      ...extractUploadHeaders(voucherBatchId, options),
    },
    responseType: 'json',
    searchParams: { sig: signature },
  })

  return response.data.reference
}
