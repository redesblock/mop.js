import WebSocket from 'isomorphic-ws'

import type { BatchId, MopGenericResponse, Ky, PublicKey } from '../types'
import { prepareData } from '../utils/data'
import { http } from '../utils/http'
import { extractUploadHeaders } from '../utils/headers'

const endpoint = 'pss'

/**
 * Send to recipient or target with Postal Service for Cluster
 *
 * @param ky Ky instance for given Mop class instance
 * @param topic Topic name
 * @param target Target message address prefix
 * @param data
 * @param voucherBatchId Voucher BatchId that will be assigned to sent message
 * @param recipient Recipient public key
 *
 */
export async function send(
  ky: Ky,
  topic: string,
  target: string,
  data: string | Uint8Array,
  voucherBatchId: BatchId,
  recipient?: PublicKey,
): Promise<void> {
  await http<MopGenericResponse>(ky, {
    method: 'post',
    path: `${endpoint}/send/${topic}/${target}`,
    body: await prepareData(data),
    responseType: 'json',
    searchParams: { recipient },
    headers: extractUploadHeaders(voucherBatchId),
  })
}

/**
 * Subscribe for messages on the given topic
 *
 * @param url Mop node URL
 * @param topic Topic name
 */
export function subscribe(url: string, topic: string): WebSocket {
  const wsUrl = url.replace(/^http/i, 'ws')

  return new WebSocket(`${wsUrl}/${endpoint}/subscribe/${topic}`)
}
