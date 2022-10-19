import { MopArgumentError } from './error'
import { isObject } from './type'

interface NodeJsError {
  code: string
}

function isNodeJsError(e: unknown): e is NodeJsError {
  return isObject(e) && typeof e.code === 'string'
}

/**
 * Validates that passed string is valid URL of Mop.
 * We support only HTTP and HTTPS protocols.
 *
 * @param url
 */
export function isValidMopUrl(url: unknown): url is URL {
  try {
    if (typeof url !== 'string') {
      return false
    }

    const urlObject = new URL(url)

    // There can be wide range of protocols passed.
    return urlObject.protocol === 'http:' || urlObject.protocol === 'https:'
  } catch (e) {
    // URL constructor throws TypeError if not valid URL
    if (e instanceof TypeError || (isNodeJsError(e) && e.code === 'ERR_INVALID_URL')) {
      return false
    }

    throw e
  }
}

/**
 * Validates that passed string is valid URL of Mop, if not it throws MopArgumentError.
 * We support only HTTP and HTTPS protocols.
 * @param url
 * @throws MopArgumentError if non valid URL
 */
export function assertMopUrl(url: unknown): asserts url is URL {
  if (!isValidMopUrl(url)) {
    throw new MopArgumentError('URL is not valid!', url)
  }
}

/**
 * Removes trailing slash out of the given string.
 * @param url
 */
export function stripLastSlash(url: string): string {
  if (url.endsWith('/')) {
    return url.slice(0, -1)
  }

  return url
}
