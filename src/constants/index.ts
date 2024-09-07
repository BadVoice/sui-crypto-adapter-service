import Big from 'big.js';

export const NETWORK = 'SUI';
export const REQUEST_TIMEOUT = 5000;
export const RPC_METHODS = {
  GET_HEIGHT: 'sui_getLatestCheckpointSequenceNumber',
  GET_BALANCE_BY_ADDRESS: 'suix_getBalance',
  GET_COINS: 'suix_getCoins',
};

export const SUI_PER_MIST = new Big(10).pow(9);
