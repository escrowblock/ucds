import ETHWorker from './ETH'; //0x4DF63B8Ad619fC1c85932550405ebB77E0AC183D
import BTCWorker from './BTC'; //1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa

const coin = process.argv ? process.argv[2]: false || "ETH";
const address = process.argv ? process.argv[3]: false || "0x4DF63B8Ad619fC1c85932550405ebB77E0AC183D";

try {
  switch (coin) {
    case 'ETH':
      ETHWorker(address);
      break;
    case 'BTC':
      BTCWorker(address);
      break;
    default:
      throw new Error();
  }
} catch(e) {
  console.log(`Example for ${coin} is not found`, e);
}