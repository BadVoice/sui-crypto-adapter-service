import axios, { AxiosResponse } from 'axios';
import Big from 'big.js';
import { v4 as uuidv4 } from 'uuid';

import {
  NETWORK,
  REQUEST_TIMEOUT,
  RPC_METHODS,
  SUI_PER_MIST,
  transactionBlockOptionsQuery,
} from './constants';
import { mistToSui, txStatusToBoolean } from './functions';
import {
  CoinType,
  CoinDataResult,
  CoinData,
  CoinsByAddressResult,
  BalanceByAddressResult,
  NodesOptions,
  RpcRequestOptions,
  SuiBalance,
  GetHeightResult,
  AdapterType,
  TransactionBlockParams,
  TransactionBlock,
  TxStatus,
  TxByHashResult,
  ChangesData,
  TransactionSui,
  ParseOptions,
  BalanceChangesData,
} from './types';

export class NodeAdapter {
  readonly type = AdapterType.Node;
  readonly network = NETWORK;
  readonly tickers = [NETWORK];
  protected headers: Record<string, string | number> = {};
  protected url: string;
  protected timeout: number;
  protected confirmationLimit: number;

  constructor(
    protected readonly opts: NodesOptions[string],
    readonly name = 'SUI',
  ) {
    this.url = opts.url;
    this.timeout = opts.timeout || REQUEST_TIMEOUT;
    this.confirmationLimit = opts.confirmationLimit;
  }

  async getHeight(
  ): Promise<GetHeightResult> {
    try {
      const getHeightByCheckpoint = await this.rpcRequest({
        method: RPC_METHODS.GET_HEIGHT,
        params: [],
      });

      if(getHeightByCheckpoint.length > 0) {
        return getHeightByCheckpoint;
      } else {
        throw new Error('Not found height');
      }
    } catch (error) {
      throw new Error(`Fetch error ${this.network} 'getHeight'. Message: ${(error as Error)?.message}.`);
    }
  }

  async balanceByAddress(
    ticker: string,
    address: string,
  ): Promise<BalanceByAddressResult> {
    let balance: string;

    try {
      if (ticker.toLowerCase() === this.network.toLowerCase()) {
        const balanceResponse: SuiBalance = await this.rpcRequest<[string]>({
          method: RPC_METHODS.GET_BALANCE_BY_ADDRESS,
          params: [address],
        });

        if (!balanceResponse?.totalBalance || !balanceResponse) {
          throw new Error(`Balance for address ${address} not an(${typeof balanceResponse?.totalBalance}).`);
        }

        balance = mistToSui(balanceResponse.totalBalance);
      } else {
        new Error(`SUI not supported tokens for ${ticker}`);
      }
    } catch (error) {
      throw new Error(`Fetch error ${ticker} "balanceByAddress". Message: ${(error as Error)?.message}.`);
    }

    return {
      balance,
    };
  }

  async getCoinsByAddress(coinType: CoinType, address: string): Promise<CoinsByAddressResult> {
    let cursor: string | null = null;
    const limit = 100;
    let allCoins: CoinDataResult[] = [];
    const seenCursors: Set<string> = new Set<string | null>();
    do {
      try {
        const {
          data: coinsData,
          nextCursor,
        }: { data: CoinData[]; nextCursor: string | null } = await this.rpcRequest({
          method: RPC_METHODS.GET_COINS,
          params: [address, coinType, cursor, limit],
        });

        // TODO: if cursor is null in params request and if address have been coins, will be infinity loop the server starts returning the same cursor.
        if (seenCursors.has(nextCursor)) {
          throw new Error('A repeated cursor is detected. Exit the cycle.');
        }

        seenCursors.add(nextCursor);

        if (!coinsData) {
          throw new Error(`Invalid response format for GET_COINS: ${JSON.stringify(coinsData)}`);
        }

        allCoins = allCoins.concat(
          coinsData.filter((coin: CoinData) => this.validateCoin(coin, coinType)).map((coin: CoinData) => ({
            digest: coin.digest,
            balance: coin.balance,
            objectId: coin.coinObjectId,
          })),
        );

        cursor = nextCursor;

      } catch (error) {
        throw new Error(`Fetch error ${address} "getCoinsByAddress". Message: ${(error as Error)?.message}.`);
      }
    } while (cursor);

    const totalBalance: string = allCoins.reduce((sum: Big, coin: CoinDataResult) => sum.plus(coin.balance), Big(0)).toFixed();

    return {
      data: allCoins,
      totalBalance: mistToSui(totalBalance),
    };
  }

  async txByHash(ticker: string, hash: string): Promise<TxByHashResult> {

    const [transaction, currentHeight] = await Promise.all([
      this.rpcRequest<TransactionBlockParams>({
        method: RPC_METHODS.GET_TX_BY_TXDIGEST,
        params: [hash, transactionBlockOptionsQuery],
      }).catch((result) => result),
      this.getHeight(),
    ]);

    if (!transaction || typeof transaction === 'string' && /\bCould not find the referenced transaction\b/.test(transaction) || !currentHeight) {
      return {
        timestamp: 0,
        hash,
        usedFee: '',
        ticker,
        from: [],
        to: [],
        status: TxStatus.unknown,
        raw: {},
      };
    }

    const [result] = await this.transactionProcess([transaction as TransactionBlock], currentHeight);
    return result;
  }

  private async transactionProcess(transactions: TransactionBlock[], currentHeight: number): Promise<TransactionSui[]> {
    const resultTransactions: TransactionSui[] = [];

    await Promise.all(
      transactions.map(async (tx: TransactionBlock) => {

        for (const obj of [tx]) {

          if(this.validateBalanceChanges(obj.balanceChanges)) {
            const promises: Promise<TransactionSui[]>[] = [];

            const options: ParseOptions = {
              object: obj,
              txRaw: [tx],
              currentHeight: currentHeight,
            };

            const from = tx.transaction.data.sender;
            const senderChange: ChangesData = tx.balanceChanges.find(
              (change: ChangesData): boolean => change.owner.AddressOwner === from,
            );
            const receiverChanges: ChangesData[] = tx.balanceChanges.filter(
              (change: ChangesData): boolean => change.owner.AddressOwner !== from,
            );

            receiverChanges.forEach((changes: ChangesData) => {
              promises.push(this.parseTranfser(options, changes, senderChange).catch(() => {
                return [];
              }));
            });

            const transfers: TransactionSui[] = (await Promise.all(promises)).flat();
            resultTransactions.push(...transfers);
          }
        }

      }),
    );
    return resultTransactions;
  }

  private async parseTranfser(options: ParseOptions, receiverChanges: ChangesData, senderChanges: ChangesData ): Promise<TransactionSui[]> {
    const { computationCost, storageCost, storageRebate } = options.object?.effects.gasUsed || {};
    const txStatus = this.checkTxStatus(
      Number(options.object.checkpoint),
      options.currentHeight,
      Number(txStatusToBoolean(options.object)),
    );

    const transactions: TransactionSui[] = [];

    if (!options.object?.balanceChanges.length) {
      throw new Error('Not found balanceChanges.');
    }

    const changesData: BalanceChangesData = this.getSenderAndReceiverData(receiverChanges, senderChanges);
    const usedFeeInSui: string = this.getUsedFeeInSui(computationCost, storageCost, storageRebate);

    transactions.push({
      timestamp: Number(options.object.timestampMs),
      usedFee: usedFeeInSui,
      hash: options.object.digest,
      ticker: this.network,
      from: [changesData.sender],
      to: [changesData.receiver],
      status: txStatus,
      height: parseInt(options.object.checkpoint, 10),
      raw: options.txRaw,
    });

    return transactions;
  }

  /*
  * The total gas fee paid for executing the transaction.
  * It includes the computation fee plus the storage fee minus the storage refund,
  * all adjusted to the current gas price.
  */
  private getUsedFeeInSui(computationCost: string, storageCost: string, storageRebate: string): string {
    const totalGasCostInSui: Big = new Big(computationCost).plus(new Big(storageCost)).minus(new Big(storageRebate)).div(SUI_PER_MIST);
    return totalGasCostInSui.toString();
  }

  /*
   * Calculates the value for the 'sender' field.
   * The value is calculated as the sum of the sender's commission fees and the transfer amount.
   * @param receiverChanges
  */
  private getSenderAndReceiverData(receiverChanges: ChangesData, senderChanges: ChangesData): BalanceChangesData {
    const amount: Big = new Big(senderChanges.amount);

    const sender = { address: senderChanges.owner.AddressOwner, value: amount.abs().toString() };
    const receiver = { address: receiverChanges.owner.AddressOwner, value: receiverChanges.amount };

    if (!sender || !receiver) {
      throw new Error('Not found sender or receiver in balanceChanges.');
    }

    return { sender, receiver };
  }

  private validateBalanceChanges(balanceChanges: ChangesData[]): boolean {
    if (balanceChanges.length === 0) {
      return false;
    }
    return (
      balanceChanges.length > 0 &&
        balanceChanges.every((coinData: ChangesData) => {
          return coinData.coinType === '0x2::sui::SUI' && typeof coinData.amount === 'string';
        })
    );
  }

  private validateCoin(coin: CoinData, coinType: CoinType): boolean {
    return coin.coinType === coinType &&
      typeof coin.balance === 'string' &&
      Number(coin.balance) > 0;
  }

  private checkTxStatus(
    txBlockNumber: number,
    currentHeight: number,
    receiptStatus: number,
  ): TxStatus {
    const isConfirmed: boolean = currentHeight >= txBlockNumber + this.confirmationLimit;
    let status: TxStatus = TxStatus.unknown;

    if (receiptStatus === 1) {
      if (isConfirmed) {
        status = TxStatus.finished;
      }
    } else if (receiptStatus === 0) {
      status = TxStatus.failed;
    }

    return status;
  }

  async rpcRequest<T>(options: RpcRequestOptions<T>): Promise<any> {
    try {
      const url: string = this.url;
      const response: AxiosResponse = await axios.post(url, {
        jsonrpc: '2.0',
        id: uuidv4(),
        ...options,
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      const errorMessage = response.data.error?.message;
      if (errorMessage) {
        throw new Error(errorMessage);
      }

      return response.data.result as T;
    } catch (error) {
      console.error('Request Error:', error.message);
      throw error.message;
    }
  }
}
