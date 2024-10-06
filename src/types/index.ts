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
  data: CoinDataResult[];
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

export type TxByHashResult = Transaction;

export type Transaction = {
  timestamp: number;
  hash: string;
  usedFee: string;
  ticker: string;
  from: FromParams[];
  to: ToParams[];
  status: string;
  height?: number;
  [key: string]: unknown;
};

export type FromParams = {
  address: string;
  extraId?: string;
  value: string | null;
};

export type ToParams = {
  address: string;
  extraId?: string;
  value: string;
};

export  type TransactionBlockOptionsQuery = {
  showInput: boolean;
  showRawInput: boolean;
  showEffects: boolean;
  showEvents: boolean;
  showObjectChanges: boolean;
  showBalanceChanges: boolean;
  showRawEffects: boolean;
};

export  type TransactionBlockParams = [string, TransactionBlockOptionsQuery]

export  type EpochRollingGasCost = {
  computationCost: string;
  storageCost: string;
  storageRebate: string;
  nonRefundableStorageFee: string;
}

export  type CheckpointBlock = {
  epoch: string;
  sequenceNumber: string;
  digest: string;
  networkTotalTransactions: string;
  previousDigest: string;
  epochRollingGasCostSummary: EpochRollingGasCost;
  timestampMs: string;
  transactions: [string];
  checkpointCommitments: [];
  validatorSignature: string;
}

export  type GasUsed = {
  computationCost: string;
  storageCost: string;
  storageRebate: string;
  nonRefundableStorageFee: string;
}

type  EventId = {
  txDigest: string;
  eventSeq: string;
}

export  type Events = {
  id: EventId;
  packageId: string;
  transactionModule: string;
  parsedJson: any;
  bcs: string;
  type: string;
  sender: string;
}

enum EffectStatus {
  'success' = 'success',
  'failure' = 'failure',
}

export  type Effect = {
  messageVersion: string;
  executedEpoch: string;
  status: {
    status: EffectStatus;
  };
  gasUsed: GasUsed;
  transactionDigest: string;
  eventsDigest: string;
}

export  type OwnerData = {
  AddressOwner: string;
  ObjectOwner?: string;
}

export  type SuiBalance = {
  coinType: string;
  coinObjectCount: number;
  totalBalance: string;
  lockedBalance?: any;
}

export  type ChangesData = {
  amount: string;
  coinType: string;
  owner: OwnerData;
}

export  type TransactionBlock = {
  transaction: {
    data: TransactionData;
  };
  balanceChanges: ChangesData[];
  digest: string;
  effects: Effect;
  events: Events[];
  timestampMs: string;
  checkpoint: string;
}

export  type ValidateResult = string | true;

export  type BalanceChangesData = {
  sender: {
    address: string;
    value: string;
  };
  receiver: {
    address: string;
    value: string;
  };
}

export enum TxStatus {
  'finished' = 'finished',
  'failed' = 'failed',
  'unknown' = 'unknown',
  'updating' = 'updating'
}

export  type ParseOptions = {
  event?: Events;
  balanceChanges?: {
    sender: ChangesData;
    receiver: ChangesData;
  };
  object: TransactionBlock;
  txRaw: TransactionBlock[];
  currentHeight: number;
}

export enum AddressFormat {
  Bech32,
  Base58,
  Hex,
}

export  type Expiration = {
  None: boolean;
  Epoch: number;
}

export  type TransactionData = {
  version?: any;
  sender: any;
  expiration: Expiration;
  gasData: GasData;
  inputs: TransactionInput[];
  commands: any;
}

export  type TransactionInput =
    | {
  kind: 'Input';
  index: number;
  value: unknown;
  type: 'object' | undefined;
}
    | {
  kind: 'Input';
  index: number;
  value: unknown;
  type: 'pure';
};

export type SuiTransactionBroadcastParams = TransactionBroadcastParams & {
  txHash: string;
};

export type TransactionBroadcastParams = {
  signedData: string;
};

export type SuiTxSignResult = {
  signedData: string;
  txHash?: string;
};

export type TransactionSui = Transaction & {
  usedFee: string;
}

export type SuiTransactionParams = TransactionParams & {
  gasPrice: string;
  gasLimit: string;
  gasAmount?: string;
  data?: string;
  fee?: {
    properties: {
      gasPrice: string;
      gasAmount: string;
      gasLimit: string;
    };
  };
}

export class NetworkFeeResponseDto {
  networkFee: number;
  properties: Record<string, unknown>;
}
export type TransactionParams = {
  from: FromParams[] | FromParams;
  to: ToParams[] | ToParams;
  fee?: NetworkFeeResponseDto;
  spent?: {
    [address: string]: string[];
  };
  utxo?: {
    [address: string]: string[];
  };
};

export type SuiObjectRef = {
  /** Base64 string representing the object digest */
  objectId: string;
  /** Object version */
  version: number | string;
  /** Hex code as string representing the object id */
  digest: string;
};

/**
 * The GasData to be used in the transaction.
 */
export type GasData = {
  payment: SuiObjectRef[];
  owner: string; // Gas Object's owner
  price: number;
  budget: number;
};
