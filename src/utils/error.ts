import { KyRequestOptions } from '../types'

export class MopError extends Error {
  public constructor(message: string) {
    super(message)
  }
}

export class MopArgumentError extends MopError {
  public constructor(message: string, readonly value: unknown) {
    super(message)
  }
}

export class MopRequestError extends MopError {
  /**
   * @param message
   * @param requestOptions KyOptions that were used to assemble the request. THIS MIGHT NOT BE COMPLETE! If custom Ky instance was used that has set defaults then these defaults are not visible in this object!
   */
  public constructor(message: string, readonly requestOptions: KyRequestOptions) {
    super(message)
  }
}

export class MopResponseError extends MopError {
  /**
   * @param status HTTP status code number
   * @param response Response returned from the server
   * @param responseBody Response body as string which is returned from response.text() call
   * @param requestOptions KyOptions that were used to assemble the request. THIS MIGHT NOT BE COMPLETE! If custom Ky instance was used that has set defaults then these defaults are not visible in this object!
   * @param message
   */
  public constructor(
    readonly status: number,
    readonly response: Response,
    readonly responseBody: string,
    readonly requestOptions: KyRequestOptions,
    message: string,
  ) {
    super(message)
  }
}

export class MopNotAJsonError extends MopError {
  public constructor() {
    super(`Received response is not valid JSON.`)
  }
}
