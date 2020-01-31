import EventEmitter from 'events';
import { RpcClient, generateRPCMethods, rpc } from './../../RpcClient';
import bitcoin from 'bitcoinjs-lib';

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
      // тут и в btc надо просто запоминать какие транзакции надо проверять каждую минуту,
      // то есть объект будет checker_incoming
      // и далее уже по массиву будут проверяться какие транзакии сколько подтверждений имеют.
      _this.rpc.eth_getBlockByNumber("latest", true, function (err, ret) {
        if (err) {
          console.error(err.message);
          return false;
        }
        
        function batchCall() {
          if (ret.transactions.length) {
            ret.transactions.forEach(function (txid) {
              if (txids.indexOf(txid) === -1) {
                _this.rpc.getRawTransaction(txid);
                ret.transactions[txid].confirmation = ret.number - ret.transactions[txid].blockNumber;
              }
            });
          }
        }
  
        _this.rpc.batch(batchCall, function(err, rawtxs) {
          if (err) {
            console.error(err);
            return false;
          }
          rawtxs.map(function (rawtx) {
            const tx = bitcoin.Transaction.fromHex(rawtx);
            console.log(tx);
            for(const depositAddress in _this.emitters) {
              if (tx.address === depositAddress && tx.confirmation <= _this.emitters[depositAddress].parameters.confirmationCount) {
                if (!this.txPool[tx.from]) {
                  _this.emitters[depositAddress].emitter.emit('incoming', [tx.from, tx.amount, tx.confirmation, tx] );
                  this.txPool[tx.from] = tx.confirmation;
                } else {
                  if (tx.confirmation === _this.emitters[depositAddress].parameters.confirmationCount) {
                    _this.emitters[depositAddress].emitter.emit('confirmed', [tx.from, tx.amount, tx] );
                    delete this.txPool[tx.from];
                  } else if (this.txPool[tx.from] != tx.confirmation) {
                    _this.emitters[depositAddress].emitter.emit('confirmation', [tx.from, tx.amount, tx.confirmation, tx] );
                  }
                }
              }
            }
            //console.log('\n\n\n' + tx.getId() + ':', tx.toObject());
          });
          
          txids = ret.transactions;
        });
      });
    };
    
    this.checkerInterval = setInterval(this.checker, this.checkerTimeout);
  }
 
  setup (settings) {
    if (settings["checkerTimeout"]) {
       this.checkerTimeout = parseInt(settings["checkerTimeout"], 10) * 1000;
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
        _this.rpc.getblockchaininfo(function (err, ret) {
          err != null ? resolve(false): resolve(ret != null);
        });
      } catch(e) {
        resolve(false);
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
  
  close() {
    this.run = false;
    this.emitters = {};
    this.txPool = {};
    clearInterval(this.checkerInterval);
  }
}

export default new ETH();