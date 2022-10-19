import { FeedWriter, FeedReader, AnyJson, BatchId, Reference, RequestOptions } from '../types'
import { Mop } from '../mop'
import { isError } from '../utils/type'

function serializeJson(data: AnyJson): Uint8Array {
  try {
    const jsonString = JSON.stringify(data)

    return new TextEncoder().encode(jsonString)
  } catch (e) {
    if (isError(e)) {
      e.message = `JsonFeed: ${e.message}`
    }
    throw e
  }
}

export async function getJsonData<T extends AnyJson>(mop: Mop, reader: FeedReader): Promise<T> {
  const feedUpdate = await reader.download()
  const retrievedData = await mop.downloadData(feedUpdate.reference)

  return retrievedData.json() as T
}

export async function setJsonData(
  mop: Mop,
  writer: FeedWriter,
  voucherBatchId: BatchId,
  data: AnyJson,
  options?: RequestOptions,
): Promise<Reference> {
  const serializedData = serializeJson(data)
  const { reference } = await mop.uploadData(voucherBatchId, serializedData, options)

  return writer.upload(voucherBatchId, reference)
}
