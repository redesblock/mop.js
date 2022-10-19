import * as connectivity from './modules/debug/connectivity'
import * as balance from './modules/debug/balance'
import * as chequebook from './modules/debug/chequebook'
import * as settlements from './modules/debug/settlements'
import * as status from './modules/debug/status'
import * as transactions from './modules/debug/transactions'
import * as states from './modules/debug/states'
import type {
  Address,
  Peer,
  BalanceResponse,
  PeerBalance,
  ChequebookAddressResponse,
  ChequebookBalanceResponse,
  LastChequesResponse,
  LastChequesForPeerResponse,
  LastCashoutActionResponse,
  Settlements,
  AllSettlements,
  RemovePeerResponse,
  Topology,
  PingResponse,
  Health,
  NodeAddresses,
  ReserveState,
  ChainState,
  NumberString,
  ExtendedTag,
  VoucherBatchBuckets,
  VoucherBatch,
  Ky,
  TransactionInfo,
  TransactionHash,
  NodeInfo,
  MopVersions,
  WalletBalance,
} from './types'
import { MopArgumentError, MopError } from './utils/error'
import { assertMopUrl, stripLastSlash } from './utils/url'
import {
  assertAddress,
  assertBatchId,
  assertCashoutOptions,
  assertNonNegativeInteger,
  assertPositiveInteger,
  assertVoucherBatchOptions,
  assertRequestOptions,
  assertTransactionHash,
  isTag,
} from './utils/type'
import {
  BatchId,
  MopOptions,
  CashoutOptions,
  VoucherBatchOptions,
  RequestOptions,
  STAMPS_DEPTH_MAX,
  STAMPS_DEPTH_MIN,
  Tag,
} from './types'
import * as tag from './modules/debug/tag'
import * as stamps from './modules/debug/stamps'
import type { Options as KyOptions } from 'ky-universal'
import { makeDefaultKy, wrapRequestClosure, wrapResponseClosure } from './utils/http'
import { sleep } from './utils/sleep'

export class MopDebug {
  /**
   * URL on which is the Debug API of Mop node exposed
   */
  public readonly url: string

  /**
   * Ky instance that defines connection to Mop node
   * @private
   */
  private readonly ky: Ky

  constructor(url: string, options?: MopOptions) {
    assertMopUrl(url)

    // Remove last slash if present, as our endpoint strings starts with `/...`
    // which could lead to double slash in URL to which Mop responds with
    // unnecessary redirects.
    this.url = stripLastSlash(url)

    const kyOptions: KyOptions = {
      prefixUrl: this.url,
      timeout: options?.timeout ?? false,
      retry: options?.retry,
      fetch: options?.fetch,
      hooks: {
        beforeRequest: [],
        afterResponse: [],
      },
    }

    if (options?.defaultHeaders) {
      kyOptions.headers = options.defaultHeaders
    }

    if (options?.onRequest) {
      kyOptions.hooks!.beforeRequest!.push(wrapRequestClosure(options.onRequest))
    }

    if (options?.onResponse) {
      kyOptions.hooks!.afterResponse!.push(wrapResponseClosure(options.onResponse))
    }

    this.ky = makeDefaultKy(kyOptions)
  }

  async getNodeAddresses(options?: RequestOptions): Promise<NodeAddresses> {
    assertRequestOptions(options)

    return connectivity.getNodeAddresses(this.getKy(options))
  }

  async getBlocklist(options?: RequestOptions): Promise<Peer[]> {
    assertRequestOptions(options)

    return connectivity.getBlocklist(this.getKy(options))
  }

  /**
   * Retrieve tag extended information from Mop node
   *
   * @param tagUid UID or tag object to be retrieved
   * @throws TypeError if tagUid is in not correct format
   *
   * @see [Mop docs - Syncing / Tags](https://docs.bnbcluster.org/docs/access-the-cluster/syncing)
   * @see [Mop API reference - `GET /tags/{uid}`](https://docs.bnbcluster.org/debug-api/#tag/Tag)
   *
   */
  async retrieveExtendedTag(tagUid: number | Tag, options?: RequestOptions): Promise<ExtendedTag> {
    assertRequestOptions(options)

    if (isTag(tagUid)) {
      tagUid = tagUid.uid
    } else if (typeof tagUid === 'number') {
      assertNonNegativeInteger(tagUid, 'UID')
    } else {
      throw new TypeError('tagUid has to be either Tag or a number (UID)!')
    }

    return tag.retrieveExtendedTag(this.getKy(options), tagUid)
  }

  /**
   * Get list of peers for this node
   */
  async getPeers(options?: RequestOptions): Promise<Peer[]> {
    assertRequestOptions(options)

    return connectivity.getPeers(this.getKy(options))
  }

  async removePeer(peer: string | Address, options?: RequestOptions): Promise<RemovePeerResponse> {
    assertRequestOptions(options)
    assertAddress(peer)

    return connectivity.removePeer(this.getKy(options), peer)
  }

  async getTopology(options?: RequestOptions): Promise<Topology> {
    assertRequestOptions(options)

    return connectivity.getTopology(this.getKy(options))
  }

  async pingPeer(peer: string | Address, options?: RequestOptions): Promise<PingResponse> {
    assertRequestOptions(options)
    assertAddress(peer)

    return connectivity.pingPeer(this.getKy(options), peer)
  }

  /*
   * Balance endpoints
   */

  /**
   * Get the balances with all known peers including prepaid services
   */
  async getAllBalances(options?: RequestOptions): Promise<BalanceResponse> {
    assertRequestOptions(options)

    return balance.getAllBalances(this.getKy(options))
  }

  /**
   * Get the balances with a specific peer including prepaid services
   *
   * @param address Cluster address of peer
   */
  async getPeerBalance(address: Address | string, options?: RequestOptions): Promise<PeerBalance> {
    assertRequestOptions(options)
    assertAddress(address)

    return balance.getPeerBalance(this.getKy(options), address)
  }

  /**
   * Get the past due consumption balances with all known peers
   */
  async getPastDueConsumptionBalances(options?: RequestOptions): Promise<BalanceResponse> {
    assertRequestOptions(options)

    return balance.getPastDueConsumptionBalances(this.getKy(options))
  }

  /**
   * Get the past due consumption balance with a specific peer
   *
   * @param address Cluster address of peer
   */
  async getPastDueConsumptionPeerBalance(address: Address | string, options?: RequestOptions): Promise<PeerBalance> {
    assertRequestOptions(options)
    assertAddress(address)

    return balance.getPastDueConsumptionPeerBalance(this.getKy(options), address)
  }

  /*
   * Chequebook endpoints
   */

  /**
   * Get the address of the chequebook contract used.
   *
   * **Warning:** The address is returned with 0x prefix unlike all other calls.
   */
  async getChequebookAddress(options?: RequestOptions): Promise<ChequebookAddressResponse> {
    assertRequestOptions(options)

    return chequebook.getChequebookAddress(this.getKy(options))
  }

  /**
   * Get the balance of the chequebook
   */
  async getChequebookBalance(options?: RequestOptions): Promise<ChequebookBalanceResponse> {
    assertRequestOptions(options)

    return chequebook.getChequebookBalance(this.getKy(options))
  }

  /**
   * Get last cheques for all peers
   */
  async getLastCheques(options?: RequestOptions): Promise<LastChequesResponse> {
    assertRequestOptions(options)

    return chequebook.getLastCheques(this.getKy(options))
  }

  /**
   * Get last cheques for the peer
   *
   * @param address  Cluster address of peer
   */
  async getLastChequesForPeer(
    address: Address | string,
    options?: RequestOptions,
  ): Promise<LastChequesForPeerResponse> {
    assertRequestOptions(options)
    assertAddress(address)

    return chequebook.getLastChequesForPeer(this.getKy(options), address)
  }

  /**
   * Get last cashout action for the peer
   *
   * @param address  Cluster address of peer
   */
  async getLastCashoutAction(address: Address | string, options?: RequestOptions): Promise<LastCashoutActionResponse> {
    assertRequestOptions(options)
    assertAddress(address)

    return chequebook.getLastCashoutAction(this.getKy(options), address)
  }

  /**
   * Cashout the last cheque for the peer
   *
   * @param address  Cluster address of peer
   * @param options
   * @param options.gasPrice Gas price for the cashout transaction in WEI
   * @param options.gasLimit Gas limit for the cashout transaction in WEI
   */
  async cashoutLastCheque(address: string | Address, options?: CashoutOptions): Promise<string> {
    assertCashoutOptions(options)
    assertAddress(address)

    return chequebook.cashoutLastCheque(this.getKy(options), address, options)
  }

  /**
   * Deposit tokens from overlay address into chequebook
   *
   * @param amount  Amount of tokens to deposit (must be positive integer)
   * @param gasPrice Gas Price in WEI for the transaction call
   * @return string  Hash of the transaction
   */
  async depositTokens(
    amount: number | NumberString,
    gasPrice?: NumberString,
    options?: RequestOptions,
  ): Promise<string> {
    assertRequestOptions(options)
    assertNonNegativeInteger(amount)

    if (gasPrice) {
      assertNonNegativeInteger(gasPrice)
    }

    return chequebook.depositTokens(this.getKy(options), amount, gasPrice)
  }

  /**
   * Withdraw tokens from the chequebook to the overlay address
   *
   * @param amount  Amount of tokens to withdraw (must be positive integer)
   * @param gasPrice Gas Price in WEI for the transaction call
   * @return string  Hash of the transaction
   */
  async withdrawTokens(
    amount: number | NumberString,
    gasPrice?: NumberString,
    options?: RequestOptions,
  ): Promise<string> {
    assertRequestOptions(options)
    assertNonNegativeInteger(amount)

    if (gasPrice) {
      assertNonNegativeInteger(gasPrice)
    }

    return chequebook.withdrawTokens(this.getKy(options), amount, gasPrice)
  }

  /*
   * Settlements endpoint
   */

  /**
   * Get amount of sent and received from settlements with a peer
   *
   * @param address  Cluster address of peer
   */
  async getSettlements(address: Address | string, options?: RequestOptions): Promise<Settlements> {
    assertRequestOptions(options)
    assertAddress(address)

    return settlements.getSettlements(this.getKy(options), address)
  }

  /**
   * Get settlements with all known peers and total amount sent or received
   */
  async getAllSettlements(options?: RequestOptions): Promise<AllSettlements> {
    assertRequestOptions(options)

    return settlements.getAllSettlements(this.getKy(options))
  }

  /**
   * Get health of node
   */
  async getHealth(options?: RequestOptions): Promise<Health> {
    assertRequestOptions(options)

    return status.getHealth(this.getKy(options))
  }

  /**
   * Get mode information of node
   */
  async getNodeInfo(options?: RequestOptions): Promise<NodeInfo> {
    assertRequestOptions(options)

    return status.getNodeInfo(this.getKy(options))
  }

  /**
   * Connnects to a node and checks if it is a supported Mop version by the mop.js
   *
   * @returns true if the Mop node version is supported
   * @deprecated Use `MopDebug.isSupportedExactVersion()` instead
   */
  async isSupportedVersion(options?: RequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return status.isSupportedVersion(this.getKy(options))
  }

  /**
   * Connects to a node and checks if its version matches with the one that mop.js supports.
   *
   * Be aware that this is the most strict version check and most probably
   * you will want to use more relaxed API-versions based checks like
   * `MopDebug.isSupportedApiVersion()`, `MopDebug.isSupportedMainApiVersion()` or `MopDebug.isSupportedDebugApiVersion()`
   * based on your use-case.
   *
   * @param options
   */
  async isSupportedExactVersion(options?: RequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return status.isSupportedExactVersion(this.getKy(options))
  }

  /**
   * Connects to a node and checks if its main's API version matches with the one that mop.js supports.
   *
   * This is useful if you are not using `MopDebug` class (for anything else then this check)
   * and want to make sure about compatibility.
   *
   * @param options
   */
  async isSupportedMainApiVersion(options?: RequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return status.isSupportedMainApiVersion(this.getKy(options))
  }

  /**
   * Connects to a node and checks if its Debug API version matches with the one that mop.js supports.
   *
   * This is useful if you are not using `Mop` class in your application and want to make sure
   * about compatibility.
   *
   * @param options
   */
  async isSupportedDebugApiVersion(options?: RequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return status.isSupportedDebugApiVersion(this.getKy(options))
  }

  /**
   *
   * Connects to a node and checks if its Main and Debug API versions matches with the one that mop.js supports.
   *
   * This should be the main way how to check compatibility for your app and Mop node.
   *
   * @param options
   */
  async isSupportedApiVersion(options?: RequestOptions): Promise<boolean> | never {
    assertRequestOptions(options)

    return status.isSupportedDebugApiVersion(this.getKy(options))
  }

  /**
   * Returns object with all versions specified by the connected Mop node (properties prefixed with `mop*`)
   * and versions that mop.js supports (properties prefixed with `supported*`).
   *
   * @param options
   */
  async getVersions(options?: RequestOptions): Promise<MopVersions> | never {
    assertRequestOptions(options)

    return status.getVersions(this.getKy(options))
  }

  /**
   * Get reserve state
   */
  async getReserveState(options?: RequestOptions): Promise<ReserveState> {
    assertRequestOptions(options)

    return states.getReserveState(this.getKy(options))
  }

  /**
   * Get chain state
   */
  async getChainState(options?: RequestOptions): Promise<ChainState> {
    assertRequestOptions(options)

    return states.getChainState(this.getKy(options))
  }

  /**
   * Get wallet balances for BNB and MOP of the Mop node
   *
   * @param options
   */
  async getWalletBalance(options?: RequestOptions): Promise<WalletBalance> {
    assertRequestOptions(options)

    return states.getWalletBalance(this.getKy(options))
  }

  /**
   * Creates new voucher batch from the funds that the node has available in its BNB Smart Chain account.
   *
   * For better understanding what each parameter means and what are the optimal values please see
   * [Mop docs - Keep your data alive / Voucher stamps](https://docs.bnbcluster.org/docs/access-the-cluster/keep-your-data-alive).
   *
   * **WARNING: THIS CREATES TRANSACTIONS THAT SPENDS MONEY**
   *
   * @param amount Amount that represents the value per chunk, has to be greater or equal zero.
   * @param depth Logarithm of the number of chunks that can be stamped with the batch.
   * @param options Options for creation of voucher batch
   * @throws MopArgumentError when negative amount or depth is specified
   * @throws TypeError if non-integer value is passed to amount or depth
   *
   * @see [Mop docs - Keep your data alive / Voucher stamps](https://docs.bnbcluster.org/docs/access-the-cluster/keep-your-data-alive)
   * @see [Mop Debug API reference - `POST /stamps`](https://docs.bnbcluster.org/debug-api/#tag/Voucher-Stamps/paths/~1stamps~1{amount}~1{depth}/post)
   */
  async createVoucherBatch(amount: NumberString, depth: number, options?: VoucherBatchOptions): Promise<BatchId> {
    assertVoucherBatchOptions(options)
    assertPositiveInteger(amount)
    assertNonNegativeInteger(depth)

    if (depth < STAMPS_DEPTH_MIN) {
      throw new MopArgumentError(`Depth has to be at least ${STAMPS_DEPTH_MIN}`, depth)
    }

    if (depth > STAMPS_DEPTH_MAX) {
      throw new MopArgumentError(`Depth has to be at most ${STAMPS_DEPTH_MAX}`, depth)
    }

    const stamp = await stamps.createVoucherBatch(this.getKy(options), amount, depth, options)

    if (options?.waitForUsable !== false) {
      await this.waitForUsableVoucherStamp(stamp, options?.waitForUsableTimeout)
    }

    return stamp
  }

  /**
   * Topup a fresh amount of MOP to given Voucher Batch.
   *
   * For better understanding what each parameter means and what are the optimal values please see
   * [Mop docs - Keep your data alive / Voucher stamps](https://docs.bnbcluster.org/docs/access-the-cluster/keep-your-data-alive).
   *
   * **WARNING: THIS CREATES TRANSACTIONS THAT SPENDS MONEY**
   *
   * @param voucherBatchId Batch ID
   * @param amount Amount to be added to the batch
   * @param options Request options
   *
   * @see [Mop docs - Keep your data alive / Voucher stamps](https://docs.bnbcluster.org/docs/access-the-cluster/keep-your-data-alive)
   * @see [Mop Debug API reference - `PATCH /stamps/topup/${id}/${amount}`](https://docs.bnbcluster.org/debug-api/#tag/Voucher-Stamps/paths/~1stamps~1topup~1{id}~1{amount}/patch)
   */
  async topUpBatch(voucherBatchId: BatchId | string, amount: NumberString, options?: RequestOptions): Promise<void> {
    assertRequestOptions(options)
    assertNonNegativeInteger(amount, 'Amount')
    assertBatchId(voucherBatchId)

    await stamps.topUpBatch(this.getKy(options), voucherBatchId, amount)
  }

  /**
   * Dilute given Voucher Batch with new depth (that has to be bigger then the original depth), which allows
   * the Voucher Batch to be used for more chunks.
   *
   * For better understanding what each parameter means and what are the optimal values please see
   * [Mop docs - Keep your data alive / Voucher stamps](https://docs.bnbcluster.org/docs/access-the-cluster/keep-your-data-alive).
   *
   * **WARNING: THIS CREATES TRANSACTIONS THAT SPENDS MONEY**
   *
   * @param voucherBatchId Batch ID
   * @param depth Amount to be added to the batch
   * @param options Request options
   *
   * @see [Mop docs - Keep your data alive / Voucher stamps](https://docs.bnbcluster.org/docs/access-the-cluster/keep-your-data-alive)
   * @see [Mop Debug API reference - `PATCH /stamps/topup/${id}/${amount}`](https://docs.bnbcluster.org/debug-api/#tag/Voucher-Stamps/paths/~1stamps~1topup~1{id}~1{amount}/patch)
   */
  async diluteBatch(voucherBatchId: BatchId | string, depth: number, options?: RequestOptions): Promise<void> {
    assertRequestOptions(options)
    assertNonNegativeInteger(depth, 'Depth')
    assertBatchId(voucherBatchId)

    await stamps.diluteBatch(this.getKy(options), voucherBatchId, depth)
  }

  /**
   * Return details for specific voucher batch.
   *
   * @param voucherBatchId Batch ID
   *
   * @see [Mop docs - Keep your data alive / Voucher stamps](https://docs.bnbcluster.org/docs/access-the-cluster/keep-your-data-alive)
   * @see [Mop Debug API reference - `GET /stamps/${id}`](https://docs.bnbcluster.org/debug-api/#tag/Voucher-Stamps/paths/~1stamps~1{id}/get)
   */
  async getVoucherBatch(voucherBatchId: BatchId | string, options?: RequestOptions): Promise<VoucherBatch> {
    assertRequestOptions(options)
    assertBatchId(voucherBatchId)

    return stamps.getVoucherBatch(this.getKy(options), voucherBatchId)
  }

  /**
   * Return detailed information related to buckets for specific voucher batch.
   *
   * @param voucherBatchId Batch ID
   *
   * @see [Mop docs - Keep your data alive / Voucher stamps](https://docs.bnbcluster.org/docs/access-the-cluster/keep-your-data-alive)
   * @see [Mop Debug API reference - `GET /stamps/${id}/buckets`](https://docs.bnbcluster.org/debug-api/#tag/Voucher-Stamps/paths/~1stamps~1{id}~1buckets/get)
   */
  async getVoucherBatchBuckets(
    voucherBatchId: BatchId | string,
    options?: RequestOptions,
  ): Promise<VoucherBatchBuckets> {
    assertRequestOptions(options)
    assertBatchId(voucherBatchId)

    return stamps.getVoucherBatchBuckets(this.getKy(options), voucherBatchId)
  }

  /**
   * Return all voucher batches that has the node available.
   *
   * @see [Mop docs - Keep your data alive / Voucher stamps](https://docs.bnbcluster.org/docs/access-the-cluster/keep-your-data-alive)
   * @see [Mop Debug API reference - `GET /stamps`](https://docs.bnbcluster.org/debug-api/#tag/Voucher-Stamps/paths/~1stamps/get)
   */
  async getAllVoucherBatch(options?: RequestOptions): Promise<VoucherBatch[]> {
    assertRequestOptions(options)

    return stamps.getAllVoucherBatches(this.getKy(options))
  }

  /**
   * Return lists of all current pending transactions that the Mop made
   */
  async getAllPendingTransactions(options?: RequestOptions): Promise<TransactionInfo[]> {
    assertRequestOptions(options)

    return transactions.getAllTransactions(this.getKy(options))
  }

  /**
   * Return transaction information for specific transaction
   * @param transactionHash
   */
  async getPendingTransaction(
    transactionHash: TransactionHash | string,
    options?: RequestOptions,
  ): Promise<TransactionInfo> {
    assertRequestOptions(options)
    assertTransactionHash(transactionHash)

    return transactions.getTransaction(this.getKy(options), transactionHash)
  }

  /**
   * Rebroadcast already created transaction.
   * This is mainly needed when your transaction fall off mempool from other reason is not incorporated into block.
   *
   * @param transactionHash
   */
  async rebroadcastPendingTransaction(
    transactionHash: TransactionHash | string,
    options?: RequestOptions,
  ): Promise<TransactionHash> {
    assertRequestOptions(options)
    assertTransactionHash(transactionHash)

    return transactions.rebroadcastTransaction(this.getKy(options), transactionHash)
  }

  /**
   * Cancel currently pending transaction
   * @param transactionHash
   * @param gasPrice
   */
  async cancelPendingTransaction(
    transactionHash: TransactionHash | string,
    gasPrice?: NumberString,
    options?: RequestOptions,
  ): Promise<TransactionHash> {
    assertRequestOptions(options)
    assertTransactionHash(transactionHash)

    if (gasPrice) {
      assertNonNegativeInteger(gasPrice)
    }

    return transactions.cancelTransaction(this.getKy(options), transactionHash, gasPrice)
  }

  private async waitForUsableVoucherStamp(id: BatchId, timeout = 120_000): Promise<void> {
    const TIME_STEP = 1500
    for (let time = 0; time < timeout; time += TIME_STEP) {
      const stamp = await this.getVoucherBatch(id)

      if (stamp.usable) {
        return
      }

      await sleep(TIME_STEP)
    }

    throw new MopError('Timeout on waiting for voucher stamp to become usable')
  }

  private getKy(options?: RequestOptions): Ky {
    if (!options) {
      return this.ky
    }

    return this.ky.extend(options)
  }
}
