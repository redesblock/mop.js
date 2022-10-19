import { Mop } from '../mop'
import { EthAddress } from '../utils/eth'
import { Reference, RequestOptions, Topic } from '../types'
import { getFeedUpdateChunkReference, Index } from './index'
import { readUint64BigEndian } from '../utils/uint64'
import { bytesToHex } from '../utils/hex'
import { MopResponseError } from '../utils/error'

function makeNumericIndex(index: Index): number {
  if (index instanceof Uint8Array) {
    return readUint64BigEndian(index)
  }

  if (typeof index === 'string') {
    return parseInt(index)
  }

  if (typeof index === 'number') {
    return index
  }

  throw new TypeError('Unknown type of index!')
}

/**
 * Function that checks if a chunk is retrievable by actually downloading it.
 * The /stewardship/{reference} endpoint does not support verification of chunks, but only manifest's references.
 *
 * @param mop
 * @param ref
 * @param options
 */
async function isChunkRetrievable(mop: Mop, ref: Reference, options?: RequestOptions): Promise<boolean> {
  try {
    await mop.downloadChunk(ref, options)

    return true
  } catch (e) {
    const err = e as MopResponseError

    if (err.status === 404) {
      return false
    }

    throw e
  }
}

/**
 * Creates array of references for all sequence updates chunk up to the given index.
 *
 * @param owner
 * @param topic
 * @param index
 */
function getAllSequenceUpdateReferences(owner: EthAddress, topic: Topic, index: Index): Reference[] {
  const numIndex = makeNumericIndex(index)
  const updateReferences: Reference[] = new Array(numIndex + 1)

  for (let i = 0; i <= numIndex; i++) {
    updateReferences[i] = bytesToHex(getFeedUpdateChunkReference(owner, topic, i))
  }

  return updateReferences
}

export async function areAllSequentialFeedsUpdateRetrievable(
  mop: Mop,
  owner: EthAddress,
  topic: Topic,
  index: Index,
  options?: RequestOptions,
): Promise<boolean> {
  const chunkRetrievablePromises = getAllSequenceUpdateReferences(owner, topic, index).map(async ref =>
    isChunkRetrievable(mop, ref, options),
  )

  return (await Promise.all(chunkRetrievablePromises)).every(result => result)
}
