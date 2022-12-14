import { MopError, MopNotAJsonError, MopRequestError, MopResponseError } from './error'
import type { MopRequest, MopResponse, HookCallback, HttpMethod, Ky } from '../types'
import kyFactory, { HTTPError, Options as KyOptions } from 'ky-universal'
import { normalizeToReadableStream } from './stream'
import { deepMerge } from './merge'
import { isObject, isStrictlyObject } from './type'
import { KyRequestOptions } from '../types'

const DEFAULT_KY_CONFIG: KyOptions = {
  headers: {
    accept: 'application/json, text/plain, */*',
    'user-agent': `mop.js`,
  },
}

interface UndiciError {
  cause: Error
}

interface KyResponse<T> extends Response {
  data: T
}

function isHttpError(e: unknown): e is HTTPError {
  return isObject(e) && typeof e.response !== 'undefined'
}

function isHttpRequestError(e: unknown): e is Error {
  return isObject(e) && typeof e.request !== 'undefined'
}

function headersToObject(header: Headers) {
  return [...header.entries()].reduce<Record<string, string>>((obj, [key, val]) => {
    obj[key] = val

    return obj
  }, {})
}

function wrapRequest(request: Request): MopRequest {
  return {
    url: request.url,
    method: request.method.toUpperCase() as HttpMethod,
    headers: headersToObject(request.headers),
  }
}

export function wrapRequestClosure(cb: HookCallback<MopRequest>): (request: Request) => Promise<void> {
  return async (request: Request) => {
    await cb(wrapRequest(request))
  }
}

export function wrapResponseClosure(
  cb: HookCallback<MopResponse>,
): (request: Request, options: unknown, response: Response) => Promise<void> {
  return async (request: Request, options: unknown, response: Response) => {
    await cb({
      headers: headersToObject(response.headers),
      status: response.status,
      statusText: response.statusText,
      request: wrapRequest(request),
    })
  }
}

/**
 * Filters out entries that has undefined value from headers object.
 * Modifies the original object!
 *
 * @param obj
 */
// eslint-disable-next-line @typescript-eslint/ban-types
export function filterHeaders(obj?: object): Record<string, string> | undefined {
  if (obj === undefined) {
    return undefined
  }

  isStrictlyObject(obj)

  const typedObj = obj as Record<string, string>

  for (const key in typedObj) {
    if (typedObj[key] === undefined) {
      delete typedObj[key]
    }
  }

  if (Object.keys(typedObj).length === 0) {
    return undefined
  }

  return typedObj
}

/**
 * Main utility function to make HTTP requests.
 * @param ky
 * @param config
 */
export async function http<T>(ky: Ky, config: KyRequestOptions): Promise<KyResponse<T>> {
  try {
    const { path, responseType, ...kyConfig } = config

    const response = (await ky(path, {
      ...kyConfig,
      searchParams: filterHeaders(kyConfig.searchParams),
    })) as KyResponse<T>

    switch (responseType) {
      case 'stream':
        if (!response.body) {
          throw new MopError('Response was expected to get data but did not get any!')
        }

        response.data = normalizeToReadableStream(response.body) as unknown as T
        break
      case 'arraybuffer':
        response.data = (await response.arrayBuffer()) as unknown as T
        break
      case 'json':
        try {
          response.data = (await response.json()) as unknown as T
        } catch (e) {
          throw new MopNotAJsonError()
        }
        break
      default:
        break // If responseType is not set, then no data are expected
    }

    return response
  } catch (e) {
    // Passthrough thrown errors
    if (e instanceof MopNotAJsonError) {
      throw e
    }

    if (isHttpError(e)) {
      let message

      // We store the response body here as it can be read only once in Response's lifecycle so to make it exposed
      // to the user in the MopResponseError, for further analysis.
      const body = await e.response.text()

      try {
        // The response can be Mop's JSON with structure `{code, message}` lets try to parse it
        message = JSON.parse(body).message
      } catch (e) {}

      if (message) {
        throw new MopResponseError(e.response.status, e.response, body, config, `${e.response.statusText}: ${message}`)
      } else {
        throw new MopResponseError(e.response.status, e.response, body, config, e.response.statusText)
      }
    } else if (isHttpRequestError(e)) {
      throw new MopRequestError(e.message, config)
    } else {
      // Node 18 has native `fetch` implementation called Undici. Errors from this implementation have top level generic
      // message "fetch failed" with the more specific error placed into `cause` property. Instead of "fetch failed" we
      // expose the underlying problem.
      if ((e as UndiciError).cause) {
        throw new MopError((e as UndiciError).cause.message)
      }

      throw new MopError((e as Error).message)
    }
  }
}

export function makeDefaultKy(kyConfig: KyOptions): Ky {
  return kyFactory.create(deepMerge(DEFAULT_KY_CONFIG, kyConfig))
}
