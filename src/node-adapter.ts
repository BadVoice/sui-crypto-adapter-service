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

    do {
      try {
        // TODO: if cursor is null in params request, will be infinity loop
        const {
          data: coinsData,
          nextCursor,
        }: { data: CoinData[]; nextCursor: string | null } = await this.rpcRequest({
          method: RPC_METHODS.GET_COINS,
          params: [address, coinType, cursor, limit],
        });

        if (!coinsData) {
          throw new Error(`Invalid response format for GET_COINS: ${coinsData}`);
        }

        allCoins = allCoins.concat(
          coinsData.filter(this.validateCoin).map((coin: CoinData) => ({
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


    const totalBalance = allCoins.reduce((sum: Big, coin: CoinDataResult) => sum.plus(coin.balance), Big(0)).toFixed();

    return {
      data: allCoins,
      totalBalance: mistToSui(totalBalance),
    };
  }

  private validateCoin(coin: CoinData): boolean {
    return coin.coinType === CoinType.SUI &&
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
