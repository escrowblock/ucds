import EventEmitter from 'events';
import { RpcClient, generateRPCMethods, rpc } from './../../RpcClient';
import bitcoin from 'bitcoinjs-lib';

const callspec = {
  abandontransaction: 'str',
  addmultisigaddress: '',
  addnode: '',
  backupwallet: '',
  bumpfee: 'str',
  createmultisig: '',
  createrawtransaction: 'obj obj',
  decoderawtransaction: '',
  dumpprivkey: '',
  encryptwallet: '',
  estimatefee: '',
  estimatesmartfee: 'int str',
  estimatepriority: 'int',
  generate: 'int',
  generatetoaddress: 'int str',
  getaccount: '',
  getaccountaddress: 'str',
  getaddednodeinfo: '',
  getaddressmempool: 'obj',
  getaddressutxos: 'obj',
  getaddressbalance: 'obj',
  getaddressdeltas: 'obj',
  getaddresstxids: 'obj',
  getaddressesbyaccount: '',
  getbalance: 'str int',
  getbestblockhash: '',
  getblockdeltas: 'str',
  getblock: 'str int',
  getblockchaininfo: '',
  getblockcount: '',
  getblockhashes: 'int int obj',
  getblockhash: 'int',
  getblockheader: 'str',
  getblocknumber: '',
  getblocktemplate: '',
  getconnectioncount: '',
  getchaintips: '',
  getdifficulty: '',
  getgenerate: '',
  gethashespersec: '',
  getinfo: '',
  getmemorypool: '',
  getmempoolentry: 'str',
  getmempoolinfo: '',
  getmininginfo: '',
  getnetworkinfo: '',
  getnewaddress: '',
  getpeerinfo: '',
  getrawmempool: 'bool',
  getrawtransaction: 'str int',
  getreceivedbyaccount: 'str int',
  getreceivedbyaddress: 'str int',
  getspentinfo: 'obj',
  gettransaction: '',
  gettxout: 'str int bool',
  gettxoutsetinfo: '',
  getwalletinfo: '',
  getwork: '',
  help: '',
  importaddress: 'str str bool',
  importmulti: 'obj obj',
  importprivkey: 'str str bool',
  invalidateblock: 'str',
  keypoolrefill: '',
  listaccounts: 'int',
  listaddressgroupings: '',
  listreceivedbyaccount: 'int bool',
  listreceivedbyaddress: 'int bool',
  listsinceblock: 'str int',
  listtransactions: 'str int int',
  listunspent: 'int int',
  listlockunspent: 'bool',
  lockunspent: '',
  move: 'str str float int str',
  prioritisetransaction: 'str float int',
  sendfrom: 'str str float int str str',
  sendmany: 'str obj int str',  //not sure this is will work
  sendrawtransaction: 'str',
  sendtoaddress: 'str float str str',
  setaccount: '',
  setgenerate: 'bool int',
  settxfee: 'float',
  signmessage: '',
  signrawtransaction: '',
  signrawtransactionwithwallet: 'str',
  stop: '',
  submitblock: '',
  validateaddress: '',
  verifymessage: '',
  walletlock: '',
  walletpassphrase: 'string int',
  walletpassphrasechange: '',
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
      _this.rpc.getrawmempool(true, function (err, ret) {
        if (err) {
          console.error(err.message);
          return false;
        }

        console.log('stringify', JSON.stringify(ret.result));
        if (ret.result.length) {
          for (const txid in ret.result) {
            if (txids.indexOf(txid) === -1) {
              txids.push(txid);
            }
          }
          console.log(txids);
          _this.rpc.getrawtransaction(txids, function(err, rawtxs) {
            console.log(err, rawtxs);
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
            });
            
            txids = ret.result;
          });
          
          //check the previous transactions
          for (const hash in _this.txPool) {
            if (ret.blockNumber - _this.txPool[hash].blockNumber >= _this.emitters[_this.txPool[hash].depositAddress].parameters.confirmationCount ) {
              _this.rpc.eth_getTransactionByHash(hash, function(tx) {
                _this.emitters[_this.txPool[hash].depositAddress].emitter.emit('confirmed', [tx.from, tx.amount, tx]);
              });
              delete _this.txPool[hash];
            } else if (_this.txPool[hash].confirmation != ret.blockNumber - _this.txPool[hash].blockNumber) {
              _this.rpc.eth_getTransactionByHash(hash, function(tx) {
                _this.txPool[hash].confirmation = ret.blockNumber - _this.txPool[hash].blockNumber;
                _this.emitters[_this.txPool[hash].depositAddress].emitter.emit('confirmation', [tx.from, tx.amount, tx.confirmation, tx]);
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
        _this.rpc.getblockchaininfo(function (err, ret) {
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

export default new BTC();