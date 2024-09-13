import { AccountService } from './account-service';
import { NodesOptions } from './types';

export class AccountProvider {
  private static instance: AccountProvider | null = null;

  accountService: AccountService;

  private constructor(private config: NodesOptions) {
    this.accountService = new AccountService();
    this.accountService.initNodes(this.config);
  }

  static getInstance(config: NodesOptions): AccountProvider {
    if (!AccountProvider.instance) {
      AccountProvider.instance = new AccountProvider(config);
    }
    return AccountProvider.instance;
  }
}