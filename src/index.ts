import { Mop } from './mop'
import { MopDebug } from './mop-debug'
import { ManifestJs } from './manifest'

export * as Utils from './utils/expose'
export * from './types'
export * from './utils/error'
export { SUPPORTED_MOP_VERSION, SUPPORTED_MOP_VERSION_EXACT } from './modules/debug/status'
export { Mop, MopDebug, ManifestJs }

// for requrie-like imports
declare global {
  interface Window {
    // binded as 'MopJs' via Webpack
    MopJs: {
      Mop: typeof import('./mop').Mop
      MopDebug: typeof import('./mop-debug').MopDebug
      Utils: typeof import('./utils/expose')
      MopError: typeof import('./utils/error').MopError
      MopRequestError: typeof import('./utils/error').MopRequestError
      MopResponseError: typeof import('./utils/error').MopResponseError
      MopArgumentError: typeof import('./utils/error').MopArgumentError
      ManifestJs: typeof import('./manifest').ManifestJs
    }
  }
}
