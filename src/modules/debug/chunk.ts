import type { MopGenericResponse, Ky } from '../../types'
import { http } from '../../utils/http'

const endpoint = 'chunks'

/**
 * Check if chunk at address exists locally
 *
 * @param ky Ky debug instance
 * @param address  Cluster address of chunk
 *
 * @returns MopGenericResponse if chunk is found or throws an exception
 */
export async function checkIfChunkExistsLocally(ky: Ky, address: string): Promise<MopGenericResponse> {
  const response = await http<MopGenericResponse>(ky, {
    path: endpoint + `/${address}`,
    responseType: 'json',
  })

  return response.data
}

/**
 * Delete a chunk from local storage
 *
 * @param ky Ky debug instance
 * @param address  Cluster address of chunk
 *
 * @returns MopGenericResponse if chunk was deleted or throws an exception
 */
export async function deleteChunkFromLocalStorage(ky: Ky, address: string): Promise<MopGenericResponse> {
  const response = await http<MopGenericResponse>(ky, {
    method: 'delete',
    path: endpoint + `/${address}`,
    responseType: 'json',
  })

  return response.data
}
