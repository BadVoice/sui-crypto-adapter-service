import { AccountService } from './account-service';
import { NodesOptions, TxByHashResult } from './types';


const config: NodesOptions['node'] = {
  url: 'https://fullnode.mainnet.sui.io',
  confirmationLimit: 10,
};

const service: AccountService = new AccountService();
service.initNodes({ node: config });

(async () => {
  // const address: BalanceByAddressResult = await service.nodes[0].balanceByAddress('sui', '0x02f0df936675a9b42cb02ade1288883fdaa1785561f67f95a998ad5b834d5767');
  // console.log(address);

  // const coinDataByAddress: CoinsByAddressResult = await service.nodes[0].getCoinsByAddress(CoinType.SUI, '0x60dd01bc037e2c1ea2aaf02187701f9f4453ba323338d2f2f521957065b0984d');
  // console.log(coinDataByAddress);

  const transaction: TxByHashResult = await service.nodes[0].txByHash('SUI', 'F3158hK5CdM27EuLdxcMsPdKzqwPCZXwaCidGMszU9p');
  console.log(transaction);
})();
