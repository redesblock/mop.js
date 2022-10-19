import type { Identifier, SingleOwnerChunk } from '../chunk/soc'
import type { FeedUploadOptions } from '../feed'
import type { FeedType } from '../feed/type'
import type { FeedUpdateOptions, FetchFeedUpdateResponse } from '../modules/feed'
import type { Bytes } from '../utils/bytes'
import type { MopError } from '../utils/error'
import type { EthAddress, HexEthAddress } from '../utils/eth'
import type { HexString } from '../utils/hex'
import type ky from 'ky-universal'

import type { Readable as NativeReadable } from 'stream'
import type { Readable as CompatibilityReadable } from 'readable-stream'
import type { ReadableStream as ReadableStreamPonyfill } from 'web-streams-polyfill'
import { Options as KyOptions } from './ky-options'

export * from './debug'

export type Ky = typeof ky

export interface Dictionary<T> {
  [Key: string]: T
}

export const SPAN_SIZE = 8
export const SECTION_SIZE = 32
export const BRANCHES = 128
export const CHUNK_SIZE = SECTION_SIZE * BRANCHES

export const ADDRESS_HEX_LENGTH = 64
export const PSS_TARGET_HEX_LENGTH_MAX = 6
export const PUBKEY_HEX_LENGTH = 66
export const BATCH_ID_HEX_LENGTH = 64
export const REFERENCE_HEX_LENGTH = 64
export const ENCRYPTED_REFERENCE_HEX_LENGTH = 128
export const REFERENCE_BYTES_LENGTH = 32
export const ENCRYPTED_REFERENCE_BYTES_LENGTH = 64

/**
 * Minimal depth that can be used for creation of voucher batch
 */
export const STAMPS_DEPTH_MIN = 17

/**
 * Maximal depth that can be used for creation of voucher batch
 */
export const STAMPS_DEPTH_MAX = 255

export const TAGS_LIMIT_MIN = 1
export const TAGS_LIMIT_MAX = 1000

export const FEED_INDEX_HEX_LENGTH = 16

/**
 * Generic reference that can be either non-encrypted reference which is a hex string of length 64 or encrypted
 * reference which is a hex string of length 128.
 *
 * Encrypted reference consists of two parts. The reference address itself (like non-encrypted reference) and decryption key.
 *
 * @see [Mop docs - Store with Encryption](https://docs.bnbcluster.org/docs/access-the-cluster/store-with-encryption)
 */
export type Reference = HexString<typeof REFERENCE_HEX_LENGTH> | HexString<typeof ENCRYPTED_REFERENCE_HEX_LENGTH>

/**
 * Type that represents either Cluster's reference in hex string or ESN domain (something.eth).
 */
export type ReferenceOrEns = Reference | string

/**
 * Type that represents either Cluster's reference in hex string, ESN domain (something.eth) or CID using one of the Cluster's codecs.
 */
export type ReferenceCidOrEns = ReferenceOrEns | string

export type PlainBytesReference = Bytes<typeof REFERENCE_BYTES_LENGTH>
export type EncryptedBytesReference = Bytes<typeof ENCRYPTED_REFERENCE_BYTES_LENGTH>
export type BytesReference = PlainBytesReference | EncryptedBytesReference

export type PublicKey = HexString<typeof PUBKEY_HEX_LENGTH>

export type Address = HexString<typeof ADDRESS_HEX_LENGTH>

/**
 * Type representing Readable stream that abstracts away implementation especially the difference between
 * browser and NodeJS versions as both are supported.
 */
export type Readable = NativeReadable | CompatibilityReadable | ReadableStream | ReadableStreamPonyfill

/**
 * BatchId is result of keccak256 hash so 64 hex string without prefix.
 */
export type BatchId = HexString<typeof BATCH_ID_HEX_LENGTH>

/**
 * AddressPrefix is an HexString of length equal or smaller then ADDRESS_HEX_LENGTH.
 * It represents PSS Address Prefix that is used to define address neighborhood that will receive the PSS message.
 */
export type AddressPrefix = HexString

/**
 * Internal interface that represents configuration for creating a request with Ky
 */
export interface KyRequestOptions extends Omit<KyOptions, 'searchParams'> {
  path: string
  responseType?: 'json' | 'arraybuffer' | 'stream'

  /**
   * Overridden parameter that allows undefined as a value.
   */
  searchParams?: Record<string, string | number | boolean | undefined>
}

export interface RequestOptions {
  /**
   * Timeout of requests in milliseconds
   */
  timeout?: number

  /**
   * Configure backoff mechanism for requests retries.
   * Specifies how many retries will be performed before failing a request.
   * Retries are performed for GET, PUT, HEAD, DELETE, OPTIONS and TRACE requests.
   * Default is 2.
   */
  retry?: number

  /**
   * User defined Fetch compatible function
   */
  fetch?: Fetch
}

export interface MopOptions extends RequestOptions {
  /**
   * Signer object or private key of the Signer in form of either hex string or Uint8Array that will be default signer for the instance.
   */
  signer?: Signer | Uint8Array | string

  /**
   * Object that contains default headers that will be present
   * in all outgoing mop.js requests for instance of Mop class.
   */
  defaultHeaders?: Record<string, string>

  /**
   * Function that registers listener callback for all outgoing HTTP requests that Mop instance makes.
   */
  onRequest?: HookCallback<MopRequest>

  /**
   * Function that registers listener callback for all incoming HTTP responses that Mop instance made.
   */
  onResponse?: HookCallback<MopResponse>
}

export interface UploadResultWithCid extends UploadResult {
  /**
   * Function that converts the reference into Cluster CIDs
   *
   * @throws TypeError if the reference is encrypted reference (eq. 128 chars long) which is not supported in CID
   */
  cid: () => string
}

/**
 * Result of upload calls.
 */
export interface UploadResult {
  /**
   * Reference of the uploaded data
   */
  reference: Reference

  /**
   * Automatically created tag's UID.
   */
  tagUid: number
}

export interface UploadOptions extends RequestOptions {
  /**
   * Will pin the data locally in the Mop node as well.
   *
   * Locally pinned data is possible to reupload to network if it disappear.
   *
   * **Warning! Not allowed when node is in Gateway mode!**
   *
   * @see [Mop docs - Pinning](https://docs.bnbcluster.org/docs/access-the-cluster/pinning)
   * @see [Mop API reference - `POST /mop`](https://docs.bnbcluster.org/api/#tag/Collection/paths/~1mop/post)
   */
  pin?: boolean

  /**
   * Will encrypt the uploaded data and return longer hash which also includes the decryption key.
   *
   * **Warning! Not allowed when node is in Gateway mode!**
   *
   * @see [Mop docs - Store with Encryption](https://docs.bnbcluster.org/docs/access-the-cluster/store-with-encryption)
   * @see [Mop API reference - `POST /mop`](https://docs.bnbcluster.org/api/#tag/Collection/paths/~1mop/post)
   * @see Reference
   */
  encrypt?: boolean

  /**
   * Tags keep track of syncing the data with network. This option allows attach existing Tag UUID to the uploaded data.
   *
   * @see [Mop API reference - `POST /mop`](https://docs.bnbcluster.org/api/#tag/Collection/paths/~1mop/post)
   * @see [Mop docs - Syncing / Tags](https://docs.bnbcluster.org/docs/access-the-cluster/syncing)
   * @link Tag
   */
  tag?: number

  /**
   * Determines if the uploaded data should be sent to the network immediately (eq. deferred=false) or in a deferred fashion (eq. deferred=true).
   *
   * With deferred style client uploads all the data to Mop node first and only then Mop node starts push the data to network itself. The progress of this upload can be tracked with tags.
   * With non-deferred style client uploads the data to Mop which immediately starts pushing the data to network. The request is only finished once all the data was pushed through the Mop node to the network.
   *
   * In future there will be move to the non-deferred style and even the support for deferred upload will be removed from Mop itself.
   *
   * @default true
   */
  deferred?: boolean
}

export interface FileUploadOptions extends UploadOptions {
  /**
   * Specifies Content-Length for the given data. It is required when uploading with Readable.
   *
   * @see [Mop API reference - `POST /mop`](https://docs.bnbcluster.org/api/#tag/File)
   */
  size?: number

  /**
   * Specifies given Content-Type so when loaded in browser the file is correctly represented.
   *
   * @see [Mop API reference - `POST /mop`](https://docs.bnbcluster.org/api/#tag/File)
   */
  contentType?: string
}

export interface CollectionUploadOptions extends UploadOptions {
  /**
   * Default file to be returned when the root hash of collection is accessed.
   *
   * @see [Mop docs - Upload a directory](https://docs.bnbcluster.org/docs/access-the-cluster/upload-a-directory)
   * @see [Mop API reference - `POST /mop`](https://docs.bnbcluster.org/api/#tag/File)
   */
  indexDocument?: string

  /**
   * Configure custom error document to be returned when a specified path can not be found in collection.
   *
   * @see [Mop docs - Upload a directory](https://docs.bnbcluster.org/docs/access-the-cluster/upload-a-directory)
   * @see [Mop API reference - `POST /mop`](https://docs.bnbcluster.org/api/#tag/File)
   */
  errorDocument?: string
}

export interface UploadHeaders {
  'cluster-pin'?: string
  'cluster-encrypt'?: string
  'cluster-tag'?: string
  'cluster-voucher-batch-id'?: string
}

/**
 * Object that contains infromation about progress of upload of data to network.
 *
 * @see [Mop docs - Syncing / Tags](https://docs.bnbcluster.org/docs/access-the-cluster/syncing)
 */
export interface Tag {
  /**
   * Number of all chunks that the data will be split into.
   */
  total: number

  /**
   * Number of chunks that is locally stored in the Mop node.
   */
  processed: number

  /**
   * Number of chunks that arrived to their designated destination in the network
   */
  synced: number

  /**
   * Unique identifier
   */
  uid: number

  /**
   * When the upload process started
   */
  startedAt: string
}

export interface AllTagsOptions extends RequestOptions {
  limit?: number
  offset?: number
}

export interface FileHeaders {
  name?: string
  tagUid?: number
  contentType?: string
}

export interface FileData<T> extends FileHeaders {
  data: T
}

export interface Pin {
  reference: string
}

/**
 * Helper interface that adds utility functions
 * to work more conveniently with bytes in normal
 * user scenarios.
 *
 * Concretely: text(), hex(), json()
 */
export interface Data extends Uint8Array {
  /**
   * Converts the binary data using UTF-8 decoding into string.
   */
  text(): string

  /**
   * Converts the binary data into hex-string.
   */
  hex(): HexString

  /**
   * Converts the binary data into string which is then parsed into JSON.
   */
  json(): Record<string, unknown>
}

/**
 * Object represents a file and some of its metadata in [[Directory]] object.
 */
export interface CollectionEntry<T> {
  data: T

  /**
   *
   */
  path: string
}

/**
 * Represents Collections
 */
export type Collection<T> = Array<CollectionEntry<T>>

export interface PssSubscription {
  readonly topic: string
  cancel: () => void
}

export interface PssMessageHandler {
  onMessage: (message: Data, subscription: PssSubscription) => void
  onError: (error: MopError, subscription: PssSubscription) => void
}

export interface MopGenericResponse {
  message: string
  code: number
}

export interface ReferenceResponse {
  reference: Reference
}

export type HttpMethod = 'GET' | 'DELETE' | 'POST' | 'PATCH' | 'PUT'

export type HookCallback<V> = (value: V) => void | Promise<void>

export interface MopRequest {
  url: string
  method: HttpMethod
  headers?: Record<string, string>
  params?: Record<string, unknown>
}

export interface MopResponse {
  headers: Record<string, string>
  status: number
  statusText?: string
  request: MopRequest
}

/*********************************************************
 * Writers and Readers interfaces
 */

export const TOPIC_BYTES_LENGTH = 32
export const TOPIC_HEX_LENGTH = 64

/**
 * Hex string of length 64 chars without prefix that specifies topics for feed.
 */
export type Topic = HexString<typeof TOPIC_HEX_LENGTH>

/**
 * Result of upload calls.
 */
export interface FeedManifestResult {
  /**
   * Reference of the uploaded data
   */
  reference: Reference

  /**
   * Function that converts the reference into Cluster Feed CID.
   *
   */
  cid: () => string
}

/**
 * FeedReader is an interface for downloading feed updates
 */
export interface FeedReader {
  readonly type: FeedType
  readonly owner: HexEthAddress
  readonly topic: Topic
  /**
   * Download the latest feed update
   */
  download(options?: FeedUpdateOptions): Promise<FetchFeedUpdateResponse>
}

export interface JsonFeedOptions extends RequestOptions {
  /**
   * Valid only for `get` action, where either this `address` or `signer` has
   * to be specified.
   */
  address?: EthAddress | Uint8Array | string

  /**
   * Custom Signer object or private key in either binary or hex form.
   * This required for `set` action, and optional for `get` although
   * if not specified for `get` then `address` option has to be specified.
   */
  signer?: Signer | Uint8Array | string
  type?: FeedType
}

/**
 * FeedWriter is an interface for updating feeds
 */
export interface FeedWriter extends FeedReader {
  /**
   * Upload a new feed update
   *
   * @param voucherBatchId Voucher BatchId to be used to upload the data with
   * @param reference The reference to be stored in the new update
   * @param options   Additional options like `at`
   *
   * @returns Reference that points at Single Owner Chunk that contains the new update and pointer to the updated chunk reference.
   */
  upload(
    voucherBatchId: string | BatchId,
    reference: BytesReference | Reference,
    options?: FeedUploadOptions,
  ): Promise<Reference>
}

/**
 * Interface for downloading single owner chunks
 */
export interface SOCReader {
  readonly owner: HexEthAddress
  /**
   * Downloads a single owner chunk
   *
   * @param identifier  The identifier of the chunk
   */
  download: (identifier: Identifier) => Promise<SingleOwnerChunk>
}

/**
 * Interface for downloading and uploading single owner chunks
 */
export interface SOCWriter extends SOCReader {
  /**
   * Uploads a single owner chunk
   *
   * @param identifier  The identifier of the chunk
   * @param data        The chunk payload data
   * @param options     Upload options
   */
  upload: (
    voucherBatchId: string | BatchId,
    identifier: Identifier,
    data: Uint8Array,
    options?: UploadOptions,
  ) => Promise<Reference>
}

/**
 * Interface representing Voucher stamp batch.
 */
export interface VoucherBatch {
  batchID: BatchId
  utilization: number
  usable: boolean
  label: '' | string
  depth: number
  amount: string
  bucketDepth: number
  blockNumber: number
  immutableFlag: boolean
  /**
   * The time (in seconds) remaining until the batch expires; -1 signals that the batch never expires; 0 signals that the batch has already expired.
   */
  batchTTL: number

  exists: boolean
}

export interface BatchBucket {
  bucketID: number
  collisions: number
}

export interface VoucherBatchBuckets {
  depth: number
  bucketDepth: number
  bucketUpperBound: number
  buckets?: BatchBucket[]
}

export type TransactionHash = BrandedString<'TransactionHash'>

export interface TransactionInfo {
  transactionHash: TransactionHash
  to: HexEthAddress
  nonce: number
  gasPrice: NumberString
  gasLimit: number
  data: string
  created: string
  description: string
  value: string
}

/**
 * Options for creation of voucher batch
 */
export interface VoucherBatchOptions extends RequestOptions {
  /**
   * Sets label for the voucher batch
   */
  label?: string

  /**
   * Sets gas price in Wei for the transaction that creates the voucher batch
   */
  gasPrice?: NumberString
  immutableFlag?: boolean

  /**
   * The returned Promise will await until the purchased Voucher Batch is usable.
   * In other word, it has to have enough block confirmations that Mop pronounce it usable.
   * When turned on, this significantly prolongs the creation of voucher batch!
   *
   * If you plan to use the stamp right away for some action with Mop (like uploading using this stamp) it is
   * highly recommended to use this option, otherwise you might get errors "stamp not usable" from Mop.
   *
   * @default true
   */
  waitForUsable?: boolean

  /**
   * When waiting for the voucher stamp to become usable, this specify the timeout for the waiting.
   * Default: 120s
   */
  waitForUsableTimeout?: number
}

/**
 * With this type a number should be represented in a string
 */
export type NumberString = FlavoredType<string, 'NumberString'>

/*********************************************************
 * Ethereum compatible signing interfaces and definitions
 */

export const SIGNATURE_HEX_LENGTH = 130
export const SIGNATURE_BYTES_LENGTH = 65

export type Signature = Bytes<typeof SIGNATURE_BYTES_LENGTH>
export type PrivateKeyBytes = Bytes<32>

/**
 * Signing function that takes digest in Uint8Array  to be signed that has helpers to convert it
 * conveniently into other types like hex-string (non prefix).
 * Result of the signing can be returned either in Uint8Array or hex string form.
 *
 * @see Data
 */
type SyncSigner = (digest: Data) => Signature | HexString<typeof SIGNATURE_HEX_LENGTH> | string
type AsyncSigner = (digest: Data) => Promise<Signature | HexString<typeof SIGNATURE_HEX_LENGTH> | string>

/**
 * Interface for implementing Ethereum compatible signing.
 *
 * In order to be compatible with Ethereum and its signing method `personal_sign`, the data
 * that are passed to sign() function should be prefixed with: `\x19Ethereum Signed Message:\n${data.length}`, hashed
 * and only then signed.
 * If you are wrapping another signer tool/library (like Metamask or some other Ethereum wallet), you might not have
 * to do this prefixing manually if you use the `personal_sign` method. Check documentation of the tool!
 * If you are writing your own storage for keys, then you have to prefix the data manually otherwise the Mop node
 * will reject the chunks signed by you!
 *
 * For example see the hashWithEthereumPrefix() function.
 *
 * @property sign     The sign function that can be sync or async. This function takes non-prefixed data. See above.
 * @property address  The BNB Smart Chain address of the signer in bytes.
 * @see hashWithEthereumPrefix
 */
export type Signer = {
  sign: SyncSigner | AsyncSigner
  address: EthAddress
}

/**
 * These type are used to create new nominal types
 *
 * See https://spin.atomicobject.com/2018/01/15/typescript-flexible-nominal-typing/
 */
export type BrandedType<Type, Name> = Type & { __tag__: Name }

export type BrandedString<Name> = BrandedType<string, Name>

export type FlavoredType<Type, Name> = Type & { __tag__?: Name }

// JSON typings
// by @indiescripter at https://github.com/microsoft/TypeScript/issues/1897#issuecomment-338650717
export type AnyJson = boolean | number | string | null | JsonArray | JsonMap
interface JsonMap {
  [key: string]: AnyJson
}
type JsonArray = Array<AnyJson>

type Fetch = (input: RequestInfo, init?: RequestInit) => Promise<Response>