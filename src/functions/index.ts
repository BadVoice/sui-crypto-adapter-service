import Big from 'big.js';

import { SUI_PER_MIST } from '../constants';
export function mistToSui(mistAmount: bigint | string): string {
  const mist = new Big(mistAmount.toString());
  if (mist.lt(0)) {
    throw new Error('The number of MISTs cannot be negative');
  } else if (mist.eq(0)) {
    return '0';
  }
  return mist.div(SUI_PER_MIST).toFixed(9);
}