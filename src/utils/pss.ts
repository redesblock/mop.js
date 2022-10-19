import { AddressPrefix, PSS_TARGET_HEX_LENGTH_MAX } from '../types'

/**
 * Utility function that for given strings/reference takes the most specific
 * target that Mop node will except.
 *
 * @param target is a non-prefixed hex string Mop address
 * @see [Mop docs - PSS](https://docs.bnbcluster.org/docs/dapps-on-cluster/pss)
 */
export function makeMaxTarget(target: string): AddressPrefix {
  if (typeof target !== 'string') {
    throw new TypeError('target has to be an string!')
  }

  return target.slice(0, PSS_TARGET_HEX_LENGTH_MAX)
}
