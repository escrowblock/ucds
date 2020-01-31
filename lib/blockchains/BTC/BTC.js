import EventEmitter from 'events';
import { RpcClient, generateRPCMethods, rpc } from './../../RpcClient';
import bitcoin from 'bitcoinjs-lib';

const callspec = {
  abandonTransaction: 'str',
  addMultiSigAddress: '',
  addNode: '',
  backupWallet: '',
  bumpFee: 'str',
  createMultiSig: '',
  createRawTransaction: 'obj obj',
  decodeRawTransaction: '',
  dumpPrivKey: '',
  encryptWallet: '',
  estimateFee: '',
  estimateSmartFee: 'int str',
  estimatePriority: 'int',
  generate: 'int',
  generateToAddress: 'int str',
  getAccount: '',
  getAccountAddress: 'str',
  getAddedNodeInfo: '',
  getAddressMempool: 'obj',
  getAddressUtxos: 'obj',
  getAddressBalance: 'obj',
  getAddressDeltas: 'obj',
  getAddressTxids: 'obj',
  getAddressesByAccount: '',
  getBalance: 'str int',
  getBestBlockHash: '',
  getBlockDeltas: 'str',
  getBlock: 'str int',
  getBlockchainInfo: '',
  getBlockCount: '',
  getBlockHashes: 'int int obj',
  getBlockHash: 'int',
  getBlockHeader: 'str',
  getBlockNumber: '',
  getBlockTemplate: '',
  getConnectionCount: '',
  getChainTips: '',
  getDifficulty: '',
  getGenerate: '',
  getHashesPerSec: '',
  getInfo: '',
  getMemoryPool: '',
  getMemPoolEntry: 'str',
  getMemPoolInfo: '',
  getMiningInfo: '',
  getNetworkInfo: '',
  getNewAddress: '',
  getPeerInfo: '',
  getRawMemPool: 'bool',
  getRawTransaction: 'str int',
  getReceivedByAccount: 'str int',
  getReceivedByAddress: 'str int',
  getSpentInfo: 'obj',
  getTransaction: '',
  getTxOut: 'str int bool',
  getTxOutSetInfo: '',
  getWalletInfo: '',
  getWork: '',
  help: '',
  importAddress: 'str str bool',
  importMulti: 'obj obj',
  importPrivKey: 'str str bool',
  invalidateBlock: 'str',
  keyPoolRefill: '',
  listAccounts: 'int',
  listAddressGroupings: '',
  listReceivedByAccount: 'int bool',
  listReceivedByAddress: 'int bool',
  listSinceBlock: 'str int',
  listTransactions: 'str int int',
  listUnspent: 'int int',
  listLockUnspent: 'bool',
  lockUnspent: '',
  move: 'str str float int str',
  prioritiseTransaction: 'str float int',
  sendFrom: 'str str float int str str',
  sendMany: 'str obj int str',  //not sure this is will work
  sendRawTransaction: 'str',
  sendToAddress: 'str float str str',
  setAccount: '',
  setGenerate: 'bool int',
  setTxFee: 'float',
  signMessage: '',
  signRawTransaction: '',
  signRawTransactionWithWallet: 'str',
  stop: '',
  submitBlock: '',
  validateAddress: '',
  verifyMessage: '',
  walletLock: '',
  walletPassPhrase: 'string int',
  walletPassphraseChange: '',
};

const _client = RpcClient;

generateRPCMethods(RpcClient, callspec, rpc);

class BTC {
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
      _this.rpc.getRawMemPool(true, function (err, ret) {
        if (err) {
          console.error(err.message);
          return false;
        }
        
        function batchCall() {
          if (ret.result.length) {
            ret.result.forEach(function (txid) {
              if (txids.indexOf(txid) === -1) {
                _this.rpc.getRawTransaction(txid);
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
            const tx = bitcoin.Transaction.fromHex(rawtx); // https://github.com/you21979/node-multisig-wallet/blob/master/lib/txdecoder.js
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
          
          txids = ret.result;
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

export default new BTC();