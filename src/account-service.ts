import { NETWORK } from './constants';
import { NodeAdapter } from './node-adapter';
import { BlockBookParams, NodesOptions } from './types';

export class AccountService {
  readonly network = NETWORK;
  node: NodeAdapter;
  nodes: NodeAdapter[];
  blockBooks: NodeAdapter[];

  initNodes(
    nodeParams: NodesOptions,
  ): void {
    this.nodes = Object.entries(nodeParams).map(([name, param]) => {

      this.validationParamsUrl(param, 'Node');
      this.validationParamsConfirmationLimit(param, 'Node');
      return new NodeAdapter(param, name);
    });
  }

  private validationParamsUrl(
    param: NodesOptions[string] | BlockBookParams,
    type: string,
  ): void {
    if (typeof param?.url !== 'string' || param?.url?.trim() === '') {
      throw new Error(`Failed to initialize "${type}". Invalid URL.`);
    }
  }

  private validationParamsConfirmationLimit(
    param: NodesOptions[string] | BlockBookParams,
    type: string,
  ): void {
    if (typeof param?.confirmationLimit !== 'number' || param.confirmationLimit < 0) {
      throw new Error(`Failed to initialize "${type}". Invalid confirmation limit.`);
    }
  }
}
