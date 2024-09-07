export  type BalanceByAddressResult = {
  balance: string;
}

export type NodesOptions = {
  [name: string]: {
    url: string;
    timeout?: number;
    confirmationLimit?: number;
    [p: string]: unknown;
  };
};

export  type SuiBalance = {
  coinType: string;
  coinObjectCount: number;
  totalBalance: string;
  lockedBalance?: any;
}

export  type Coin = {
  data: CoinData[];
  nextCursor: string;
  hasNextPage: boolean;
}

export  type CoinData = {
  coinType: string;
  coinObjectId: string;
  version: string;
  digest: string;
  balance: string;
  previousTransaction: string;
}

export  type CoinDataResult = {
  objectId: string;
  digest: string;
  balance: string;
}

export  enum CoinType {
  'SUI' = '0x2::sui::SUI',
}

export  type CoinsByAddressResult = {
  data: CoinDataResult[],
  totalBalance: string;
}

export  type RpcRequestOptions<T> = {
  method: string;
  params?: T;
};


export  type BlockBookParams = {
  [name: string]: {
    url: string;
    headers?: {
      [key: string]: string;
    };
    basic?: {
      user: string;
      pass: string;
    };
    query?: {
      [key: string]: string;
    };
    data?: {
      [key: string]: string;
    };
    timeout?: number;
    confirmationLimit?: number;
  };
};

export enum AdapterType {
  Node = 'Node',
  BBook = 'BBook'
}

export type GetHeightResult = number;