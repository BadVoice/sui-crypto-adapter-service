import Big from 'big.js';

export const NETWORK = 'SUI';
export const REQUEST_TIMEOUT = 5000;
export const RPC_METHODS = {
  GET_HEIGHT: 'sui_getLatestCheckpointSequenceNumber',
  GET_TX_BY_TXDIGEST: 'sui_getTransactionBlock',
  GET_BALANCE_BY_ADDRESS: 'suix_getBalance',
  GET_COINS: 'suix_getCoins',
};

export const transactionBlockOptionsQuery = {
  showInput: true,
  showRawInput: true,
  showEffects: true,
  showEvents: true,
  showObjectChanges: true,
  showBalanceChanges: true,
  showRawEffects: true,
};

export const SUI_PER_MIST = new Big(10).pow(9);
