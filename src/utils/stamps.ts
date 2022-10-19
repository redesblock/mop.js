import { VoucherBatch } from '../types'

/**
 * Utility function that calculates usage of voucher batch based on its utilization, depth and bucket depth.
 *
 * Be aware for small depths (17, 18) this does not provide that much information as the provided set of distinct values
 * is small.
 *
 * @param utilization
 * @param depth
 * @param bucketDepth
 */
export function getStampUsage({ utilization, depth, bucketDepth }: VoucherBatch): number {
  return utilization / Math.pow(2, depth - bucketDepth)
}
