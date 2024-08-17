import { AddressAdapter } from './address-adapter';

const service = new AddressAdapter();

(async () => {
  const address = await service.getAddress(
    '0x0000000000000000000000000000000000000000',
  );
  console.log(address);
})();
