import { AccountProvider } from './account-provider';
import { AccountService } from './account-service';
import { NodesOptions } from './types';
import { Logger } from './utils/logger';

const logger = new Logger();

async function bootstrap() {
  try {
    logger.info('Application started');

    const config: NodesOptions =
      {
        node: {
          url: 'https://fullnode.mainnet.sui.io',
          confirmationLimit: 10,
        },
      };

    const accountProvider = AccountProvider.getInstance(config);
    const accountService = new AccountService();

  } catch (error) {
    logger.error('Application error:', error);
    process.exit(1);
  }
}

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

void bootstrap();