import blockchainList from './lib/blockchains';

//https://github.com/avoidwork/tiny-lru
class UCSD {
  constructor() {
    this.blockchainList = blockchainList; 
  }
  
  validateBlockchain (name) {
    if (typeof(name) == undefined) {
      throw Error('Blockchain network name is not provided.');
    }
    if (typeof(this.blockchainList[name]) == undefined) {
      throw Error('This blockchain network is not supported right now. Please feel free to make a pull request to official repository.');
    }
    for(const method in ["setup", "testRPC", "callRpc", "subscribe", "unsubscribe", "close"]) {
      if (typeof(this.blockchainList[name][method]) == undefined) {
       throw Error('This blockchain network doesn`t have "' + method + '" method implementation.');
      }
    }
  }
  
  setup (name, settings) {
    this.validateBlockchain(name);
    this.blockchainList[name].setup(settings);
    return null;
  }
  
  testRPC (name) {
    this.validateBlockchain(name);
    return this.blockchainList[name].testRPC();
  }
  
  callRpc (name, procedureName, procedureArgs = []) {
    this.validateBlockchain(name);
    return this.blockchainList[name].callRpc(procedureName, procedureArgs);
  }
  
  subscribe (name, parameters) {
    this.validateBlockchain(name);
    return this.blockchainList[name].subscribe(parameters);
  }
  
  unsubscribe (name, parameters) {
    this.validateBlockchain(name);
    return this.blockchainList[name].unsubscribe(parameters);
  }
  
  close (name) {
    this.validateBlockchain(name);
    return this.blockchainList[name].close();
  }
}

export default new UCSD();