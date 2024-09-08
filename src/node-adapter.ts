import axios, { AxiosResponse } from 'axios';
import Big from 'big.js';
import { v4 as uuidv4 } from 'uuid';

import {
  NETWORK,
  REQUEST_TIMEOUT,
  RPC_METHODS,
} from './constants';
import { mistToSui } from './functions';
import {
  CoinType,
  CoinDataResult,
  CoinData,
  CoinsByAddressResult,
  AdapterType,
  BalanceByAddressResult,
  NodesOptions,
  RpcRequestOptions,
  SuiBalance,
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

  private validateCoin(coin: CoinData, coinType: CoinType): boolean {
    return coin.coinType === coinType &&
      typeof coin.balance === 'string' &&
      Number(coin.balance) > 0;
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
