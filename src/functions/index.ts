import Big from 'big.js';

import { SUI_PER_MIST } from '../constants';
import { TransactionBlock } from '../types';
export function mistToSui(mistAmount: bigint | string): string {
  const mist = new Big(mistAmount.toString());
  if (mist.lt(0)) {
    throw new Error('The number of MISTs cannot be negative');
  } else if (mist.eq(0)) {
    return '0';
  }

  return formatSuiBalance(mist.div(SUI_PER_MIST));
}

function formatSuiBalance(suiAmount: Big): string {
  const parts = suiAmount.toFixed(9).split('.');
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return parts.join('.');
}

export function txStatusToBoolean(object: TransactionBlock): boolean {
  if(object.effects.status.status ===  'success') {
    return true;
  } else if (object.effects.status.status ===  'failure') {
    return false;
  }
  return false;
}