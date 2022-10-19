import type { BatchId, VoucherBatch, Ky, NumberString, VoucherBatchBuckets, VoucherBatchOptions } from '../../types'
import { http } from '../../utils/http'

const STAMPS_ENDPOINT = 'stamps'

interface GetAllStampsResponse {
  stamps: VoucherBatch[]
}

interface StampResponse {
  batchID: BatchId
}

export async function getAllVoucherBatches(ky: Ky): Promise<VoucherBatch[]> {
  const response = await http<GetAllStampsResponse>(ky, {
    method: 'get',
    path: `${STAMPS_ENDPOINT}`,
    responseType: 'json',
  })

  return response.data.stamps
}

export async function getVoucherBatch(ky: Ky, voucherBatchId: BatchId): Promise<VoucherBatch> {
  const response = await http<VoucherBatch>(ky, {
    method: 'get',
    path: `${STAMPS_ENDPOINT}/${voucherBatchId}`,
    responseType: 'json',
  })

  return response.data
}

export async function getVoucherBatchBuckets(ky: Ky, voucherBatchId: BatchId): Promise<VoucherBatchBuckets> {
  const response = await http<VoucherBatchBuckets>(ky, {
    method: 'get',
    path: `${STAMPS_ENDPOINT}/${voucherBatchId}/buckets`,
    responseType: 'json',
  })

  return response.data
}

export async function createVoucherBatch(
  ky: Ky,
  amount: NumberString,
  depth: number,
  options?: VoucherBatchOptions,
): Promise<BatchId> {
  const headers: Record<string, string> = {}

  if (options?.gasPrice) {
    headers['gas-price'] = options.gasPrice.toString()
  }

  if (options?.immutableFlag !== undefined) {
    headers.immutable = String(options.immutableFlag)
  }

  const response = await http<StampResponse>(ky, {
    method: 'post',
    path: `${STAMPS_ENDPOINT}/${amount}/${depth}`,
    responseType: 'json',
    searchParams: { label: options?.label },
    headers,
  })

  return response.data.batchID
}

export async function topUpBatch(ky: Ky, id: string, amount: NumberString): Promise<BatchId> {
  const response = await http<StampResponse>(ky, {
    method: 'patch',
    path: `${STAMPS_ENDPOINT}/topup/${id}/${amount}`,
    responseType: 'json',
  })

  return response.data.batchID
}

export async function diluteBatch(ky: Ky, id: string, depth: number): Promise<BatchId> {
  const response = await http<StampResponse>(ky, {
    method: 'patch',
    path: `${STAMPS_ENDPOINT}/dilute/${id}/${depth}`,
    responseType: 'json',
  })

  return response.data.batchID
}
