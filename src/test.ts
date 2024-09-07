import { AccountService } from './account-service';
import { CoinType } from './types';
import { CoinsByAddressResult } from './types';
import { NodesOptions } from './types';

const config: NodesOptions['node'] = {
  url: 'https://fullnode.mainnet.sui.io',
  confirmationLimit: 10,
};

const service: AccountService = new AccountService();
service.initNodes({ node: config });

(async () => {
  // const address: BalanceByAddressResult = await service.nodes[0].balanceByAddress('sui', '0x02f0df936675a9b42cb02ade1288883fdaa1785561f67f95a998ad5b834d5767');
  // console.log(address);

  const coinDataByAddress: CoinsByAddressResult = await service.nodes[0].getCoinsByAddress(CoinType.SUI, '0x02f0df936675a9b42cb02ade1288883fdaa1785561f67f95a998ad5b834d5767');
  console.log(coinDataByAddress);
})();
