import { http } from '../utils/http'
import { Ky } from '../types'

/**
 * Ping the base mop URL. If connection was not successful throw error
 *
 * @param ky Ky instance for given Mop class instance
 */
export async function checkConnection(ky: Ky): Promise<void> | never {
  await http<string>(ky, {
    path: '',
  })
}
