import { CID } from 'multiformats'
import { create as createMultihashDigest } from 'multiformats/hashes/digest'

// https://github.com/multiformats/multicodec/blob/master/table.csv
export const KECCAK_256_CODEC = 0x1b
export const CLUSTER_NS_CODEC = 0xe4
export const CLUSTER_MANIFEST_CODEC = 0xfa
export const CLUSTER_FEED_CODEC = 0xfb
export const REFERENCE_HEX_LENGTH = 64

export type Reference = HexString<typeof REFERENCE_HEX_LENGTH>

export enum ReferenceType {
  FEED = 'feed',
  MANIFEST = 'manifest',
}

/**
 * Mapping for getting ReferenceType from given codec.
 */
const CODEC_TYPE_MAPPING: Record<number, ReferenceType> = {
  [CLUSTER_FEED_CODEC]: ReferenceType.FEED,
  [CLUSTER_MANIFEST_CODEC]: ReferenceType.MANIFEST,
}

export interface DecodeResult {
  /**
   * Hex encoded Reference
   */
  reference: Reference

  /**
   * If the CID had one of the Cluster related codecs than this specifies the type of content
   */
  type?: ReferenceType
}

/**
 * Encode Cluster hex-encoded Reference into CID that has appropriate codec set based on `type` parameter.
 *
 * @param ref
 * @param type
 */
export function encodeReference(ref: string | Reference, type: ReferenceType): CID {
  switch (type) {
    case ReferenceType.FEED:
      return _encodeReference(ref, CLUSTER_FEED_CODEC)
    case ReferenceType.MANIFEST:
      return _encodeReference(ref, CLUSTER_MANIFEST_CODEC)
    default:
      throw new Error('Unknown reference type.')
  }
}

/**
 * Encode Cluster hex-encoded Reference into CID and sets Feed codec.
 * @param ref
 */
export function encodeFeedReference(ref: string | Reference): CID {
  return _encodeReference(ref, CLUSTER_FEED_CODEC)
}

/**
 * Encode Cluster hex-encoded Reference into CID and sets Manifest codec.
 * @param ref
 */
export function encodeManifestReference(ref: string | Reference): CID {
  return _encodeReference(ref, CLUSTER_MANIFEST_CODEC)
}

/**
 * Function to decode Feed CID (both from string or CID instance) into hex encoded Cluster reference.
 *
 * @param cid
 * @throws Error if the decoded codec did not matched Cluster Feed codec
 */
export function decodeFeedCid(cid: CID | string): Reference {
  const result = _decodeReference(cid)

  if (result.type !== ReferenceType.FEED) {
    throw new Error('CID did not have Cluster Feed codec!')
  }

  return result.reference
}

/**
 * Function to decode Manifest CID (both from string or CID instance) into hex encoded Cluster reference.
 *
 * @param cid
 * @throws Error if the decoded codec did not matched Cluster Manifest codec
 */
export function decodeManifestCid(cid: CID | string): Reference {
  const result = _decodeReference(cid)

  if (result.type !== ReferenceType.MANIFEST) {
    throw new Error('CID did not have Cluster Manifest codec!')
  }

  return result.reference
}

/**
 * Decode CID or base encoded CID string into DecodeResult interface.
 * Does not throw exception if the codec was not Cluster related. In that case `type` is undefined.
 *
 * @see DecodeResult
 * @param cid
 */
export function decodeCid(cid: CID | string): DecodeResult {
  return _decodeReference(cid)
}

function _decodeReference(cid: CID | string): DecodeResult {
  if (typeof cid === 'string') {
    cid = CID.parse(cid)
  }

  return {
    reference: bytesToHex(cid.multihash.digest),
    type: CODEC_TYPE_MAPPING[cid.code],
  }
}

function _encodeReference(ref: string | Reference, codec: number): CID {
  assertReference(ref)

  const hashBytes = hexToBytes(ref)

  return CID.createV1(codec, createMultihashDigest(KECCAK_256_CODEC, hashBytes))
}

type FlavoredType<Type, Name> = Type & { __tag__?: Name }

/**
 * Nominal type to represent hex strings WITHOUT '0x' prefix.
 * For example for 32 bytes hex representation you have to use 64 length.
 */
type HexString<Length extends number = number> = FlavoredType<
  string & {
    readonly length: Length
  },
  'HexString'
>

interface Bytes<Length extends number> extends Uint8Array {
  readonly length: Length
}

/**
 * Converts a hex string to Uint8Array
 *
 * @param hex string input without 0x prefix!
 */
function hexToBytes<Length extends number, LengthHex extends number = number>(
  hex: HexString<LengthHex>,
): Bytes<Length> {
  assertHexString(hex)

  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    const hexByte = hex.substr(i * 2, 2)
    bytes[i] = parseInt(hexByte, 16)
  }

  return bytes as Bytes<Length>
}

/**
 * Converts array of number or Uint8Array to HexString without prefix.
 *
 * @param bytes   The input array
 * @param len     The length of the non prefixed HexString
 */
function bytesToHex<Length extends number = number>(bytes: Uint8Array, len?: Length): HexString<Length> {
  const hexByte = (n: number) => n.toString(16).padStart(2, '0')
  const hex = Array.from(bytes, hexByte).join('') as HexString<Length>

  if (len && hex.length !== len) {
    throw new TypeError(`Resulting HexString does not have expected length ${len}: ${hex}`)
  }

  return hex
}

/**
 * Type guard for HexStrings.
 * Requires no 0x prefix!
 *
 * @param s string input
 * @param len expected length of the HexString
 */
function isHexString<Length extends number = number>(s: unknown, len?: number): s is HexString<Length> {
  return typeof s === 'string' && /^[0-9a-f]+$/i.test(s) && (!len || s.length === len)
}

/**
 * Verifies if the provided input is a HexString.
 *
 * @param s string input
 * @param len expected length of the HexString
 * @param name optional name for the asserted value
 * @returns HexString or throws error
 */
function assertHexString<Length extends number = number>(
  s: unknown,
  len?: number,
  name = 'value',
): asserts s is HexString<Length> {
  if (!isHexString(s, len)) {
    // Don't display length error if no length specified in order not to confuse user
    const lengthMsg = len ? ` of length ${len}` : ''
    throw new TypeError(`${name} not valid hex string${lengthMsg}: ${s}`)
  }
}

function assertReference(ref: unknown): asserts ref is Reference {
  assertHexString(ref)

  if (ref.length !== REFERENCE_HEX_LENGTH) {
    throw new TypeError(
      `Reference does not have expected length 64 characters. Encrypted references are not supported.`,
    )
  }
}
