import EventEmitter from 'events';
import { RpcClient, generateRPCMethods, rpc } from './../../RpcClient';

const callspec = {
  web3_clientVersion: '',
  web3_sha3: 'str',
  net_version: '',
  net_peerCount: '',
  net_listening: '',
  eth_protocolVersion: '',
  eth_syncing: '',
  eth_coinbase: '',
  eth_mining: '',
  eth_hashrate: '',
  eth_gasPrice: '',
  eth_accounts: '',
  eth_blockNumber: '',
  eth_getBalance: 'str str',
  eth_getStorageAt: 'str str str',
  eth_getTransactionCount: 'str str',
  eth_getBlockTransactionCountByHash: 'str',
  eth_getBlockTransactionCountByNumber: 'str',
  eth_getUncleCountByBlockHash: 'str',
  eth_getUncleCountByBlockNumber: 'str',
  eth_getCode: 'str str',
  eth_sign: 'str str',
  eth_sendTransaction: 'obj',
  eth_sendRawTransaction: 'str',
  eth_call: 'obj str',
  eth_estimateGas: 'obj str',
  eth_getBlockByHash: 'str bool',
  eth_getBlockByNumber: 'str bool',
  eth_getTransactionByHash: 'str',
  eth_getTransactionByBlockHashAndIndex: 'str str',
  eth_getTransactionByBlockNumberAndIndex: 'str str',
  eth_getTransactionReceipt: 'str',
  eth_pendingTransactions: '',
  eth_getUncleByBlockHashAndIndex: 'str str',
  eth_getUncleByBlockNumberAndIndex: 'str str',
  eth_newFilter: 'obj',
  eth_newBlockFilter: '',
  eth_newPendingTransactionFilter: '',
  eth_uninstallFilter: 'str',
  eth_getFilterChanges: 'str',
  eth_getFilterLogs: 'str',
  eth_getLogs: 'obj',
  eth_getWork: '',
  eth_submitWork: 'str str str',
  eth_submitHashrate: 'str str',
  eth_getProof: 'str obj str',
  shh_post: 'obj',
  shh_version: '',
  shh_newIdentity: '',
  shh_hasIdentity: 'str',
  shh_newGroup: '',
  shh_addToGroup: 'str',
  shh_newFilter: 'obj',
  shh_uninstallFilter: 'str',
  shh_getFilterChanges: 'str',
  shh_getMessages: 'str',
  parity_chainStatus: '',
};

const _client = RpcClient;

generateRPCMethods(RpcClient, callspec, rpc);

class ETH {
  constructor() {
    this.run = false;
    this.emitters = {};
    this.txPool = {};
    this.rpc = {};
    this.checkerTimeout = 60000;
    this.checkerInterval;
    const _this = this;
    this.checker = function() {
      if (!_this.run) {
        return;
      }
      let txids = [];
      _this.rpc.eth_getBlockByNumber('latest', true, function (err, result) {
        console.log(err, result);
      });
      _this.rpc.net_peerCount(function (err, result) {
        console.log(err, result);
      });
      _this.rpc.eth_getBlockByNumber("latest", true, function (err, result) {
        const ret = result.result;
        console.log(err, result);
        if (err) {
          console.error(err.message);
          return false;
        }
        console.log(ret.number);
        if (ret.transactions.length) {
          ret.transactions.forEach(function (tx, txindex) {
            if (txids.indexOf(tx.id) === -1) {
              ret.transactions[txindex].confirmation = parseInt(ret.number, 16) - parseInt(tx.blockNumber, 16);
            }
          });
  
          ret.transactions.map(function (tx) {
            console.log(tx.from);
            for(const depositAddress in _this.emitters) {
              if (tx.to === depositAddress && tx.confirmation <= _this.emitters[depositAddress].parameters.confirmationCount) {
                console.log('ETH tx', tx);
                if (!_this.txPool[tx.hash]) {
                  _this.emitters[depositAddress].emitter.emit('incoming', [tx.from, parseInt(tx.value, 16), tx.confirmation, tx] );
                  _this.txPool[tx.hash] = {"confirmation": tx.confirmation, "depositAddress": depositAddress, "from": tx.from};
                } else {
                  if (tx.confirmation >= _this.emitters[depositAddress].parameters.confirmationCount) {
                    _this.emitters[depositAddress].emitter.emit('confirmed', [tx.from, parseInt(tx.value, 16), tx] );
                    delete _this.txPool[tx.hash];
                  } else if (_this.txPool[tx.hash].confirmation != tx.confirmation) {
                    _this.emitters[depositAddress].emitter.emit('confirmation', [tx.from, parseInt(tx.value, 16), tx.confirmation, tx] );
                  }
                }
              }
            }
          });
           
          //check the previous transactions
          for (const hash in _this.txPool) {
            if (ret.blockNumber - _this.txPool[hash].blockNumber >= _this.emitters[_this.txPool[hash].depositAddress].parameters.confirmationCount ) {
              _this.rpc.eth_getTransactionByHash(hash, function(tx) {
                if (tx) {
                  _this.emitters[_this.txPool[hash].depositAddress].emitter.emit('confirmed', [tx.from, tx.valueamount, tx]);
                }
              });
              delete _this.txPool[hash];
            } else if (_this.txPool[hash].confirmation != ret.blockNumber - _this.txPool[hash].blockNumber) {
              _this.rpc.eth_getTransactionByHash(hash, function(tx) {
                console.log('tx', tx);
                if (tx) {
                  _this.txPool[hash].confirmation = ret.blockNumber - _this.txPool[hash].blockNumber;
                  _this.emitters[_this.txPool[hash].depositAddress].emitter.emit('confirmation', [tx.from, parseInt(tx.value, 16), tx.confirmation, tx]);
                }
              });
            }
          }
        }
      });
    };
    
    this.checkerInterval = setInterval(this.checker, this.checkerTimeout);
  }
 
  setup (settings) {
    if (settings["checkerTimeout"]) {
       this.checkerTimeout = parseInt(settings["checkerTimeout"], 10);
       delete settings["checkerTimeout"];
       this.checkerInterval = setInterval(this.checker, this.checkerTimeout);
    }
    this.rpc = new _client(settings);
    this.run = true;
  }
  
  testRPC () {
    const _this = this;
    return new Promise(function(resolve) {
      try {
        _this.rpc.eth_blockNumber(function (err, ret) {
          err != null ? resolve(false): resolve(ret != null);
        });
      } catch(e) {
        resolve(false);
      }
    });
  }
  
  callRpc (procedureName, procedureArgs = []) {
    const _this = this;
    return new Promise(function(resolve) {
      try {
        procedureArgs.push(
          function (err, ret) {
            err != null ? resolve(false): resolve(ret);
          }
        );
        _this.rpc[procedureName].apply(_this.rpc, procedureArgs);
      } catch(e) {
        resolve(e);
      }
    });
  }
  
  subscribe (parameters) {
    this.emitters[parameters.depositAddress] = {
      emitter: new EventEmitter(),
      parameters: parameters
    };
    return this.emitters[parameters.depositAddress].emitter;
  }
  
  unsubscribe (parameters) {
    if (parameters && parameters.depositAddress) {
      if (this.emitters[parameters.depositAddress]) {
        delete this.emitters[parameters.depositAddress];
        return true;
      } else {
        return false;
      }
    } else {
      this.emitters = [];
      return true;
    }
  }
  
  close () {
    this.run = false;
    this.emitters = {};
    this.txPool = {};
    clearInterval(this.checkerInterval);
  }
}

export default new ETH();