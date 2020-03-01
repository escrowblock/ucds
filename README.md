<div align="center">
  <img title="Escrowblock exchange logo" src="images/favicon.png">
</div>

<div align="center">United Cryptocurrency Depositing System (UCDS)</div>

# Description

United Cryptocurrency Depositing System allows having a gateway for accepting cryptocurrencies on your addresses and watching transactions.
UCDS works by event model, which allows using it as microservice for transforming data from the blockchain to offline data.
For example, you can handle the event that you have got a transaction in 0.01 BTC and record this to DB or send an email, etc.

# Installation

```bash
npm install --save ucds
```

# Blockchain nodes
You can use your own or external nodes.

## Using own nodes
Specify own environment variables in file `.env`
Create directory `/opt/ucds`. It is the main directory with data that necessary for blockchain work. For some blockchains maybe demands config. You can find them into `./lib/blockchains/{COIN}`. For example, for ETH `./lib/blockchains/ETH/config.toml` need to copy into `/opt/ucds/eth/config.toml`
Notice that some docker containers can have not root users to run internal programs. In this case, you must set up a directory mode that will allow use it for a user with special access rights.
Install *docker-compose* and then run

```bash
docker-compose build
docker-compose up
```

You can disable some blockchains by configuration `docker-compose.yml`

# Usage

## BTC

```javascript
import UCDSHandler from "ucds";

// BTC RPC
UCDSHandler.setup("BTC", {
    protocol: "http",
    user: "user",
    pass: "pass",
    host: "127.0.0.1",
    port: "8332",
});

async function checkTxBTC() {
  if (await UCDSHandler.testRPC("BTC") === false) {
    console.log("BTC node is not running");
    return;
  } 
  
  const BTCSubscriber = UCDSHandler.subscribe("BTC", {
    "depositAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
    "confirmationCount": 3
  });
  
  BTCSubscriber.on("incoming", console.log);
  // from, amount, confirmation, rawTx
  // > 2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa, 0.0001, 1, {...}
  
  
  BTCSubscriber.on("confirmation", console.log);
  // from, amount, confirmation, rawTx
  // > 2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa, 0.0001, 1, {...}
  
  BTCSubscriber.on("confirmed", console.log);
  // from, amount, rawTx
  // > 2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa, 0.0001, {...}
  
  UCDSHandler.unsubscribe("BTC", {
    "depositAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
  });
}

checkTxBTC();
```

## ETH

```javascript
import UCDSHandler from "ucds";

// Ethereum RPC
UCDSHandler.setup("ETH", {
    protocol: "http",
    host: "127.0.0.1",
    port: "8545",
});

async function checkTxETH() {
  if (await UCDSHandler.testRPC("ETH") === false) {
    console.log("ETH node is not running");
    return;
  } 
  
  const ETHSubscriber = UCDSHandler.subscribe("ETH", {
    "depositAddress": "0x68b1d1f8bbb96d374a8da6fab7ffdcf08e0b083f",
    "confirmationCount": 6
  }); 
  
  ETHSubscriber.on("incoming", console.log);
  // from, amount, confirmation, rawTx
  // > 0x78b1d1f8bbb96d374a8da6fab7ffdcf08e0b083f, 0.01, 1, {...}
  
  ETHSubscriber.on("confirmation", console.log);
  // from, amount, confirmation, rawTx
  // > 0x78b1d1f8bbb96d374a8da6fab7ffdcf08e0b083f, 0.01, 1, {...}
  
  ETHSubscriber.on("confirmed", console.log);
  // from, amount, rawTx
  // > 0x78b1d1f8bbb96d374a8da6fab7ffdcf08e0b083f, 0.01, {...}
  
  UCDSHandler.unsubscribe("ETH", {
    "depositAddress": "0x68b1d1f8bbb96d374a8da6fab7ffdcf08e0b083f"
  });
}

checkTxETH();
```

## ETH token ESCB

```javascript
import UCDSHandler from "ucds";

// Ethereum RPC
UCDSHandler.setup("ETH", {
    protocol: "http",
    host: "127.0.0.1",
    port: "8545",
});

async function checkTxESCB() {
  if (await UCDSHandler.testRPC("ETH") === false) {
    console.log("ETH node is not running");
    return;
  } 
  
  const ESCBSubscriber = UCDSHandler.subscribe("ESCB", {
    "depositAddress": "0x68b1d1f8bbb96d374a8da6fab7ffdcf08e0b083f",
    "confirmationCount": 6,
    "tokenAddress": "0x5e365a320779acc2c72f5dcd2ba8a81e4a34569f"
  }); 
  
  ESCBSubscriber.on("incoming", console.log);
  // from, amount, confirmation, rawTx
  // > 0x78b1d1f8bbb96d374a8da6fab7ffdcf08e0b083f, 1000, 1, {...}
  
  ESCBSubscriber.on("confirmation", console.log);
  // from, amount, confirmation, rawTx
  // > 0x78b1d1f8bbb96d374a8da6fab7ffdcf08e0b083f, 1000, 1, {...}
  
  ESCBSubscriber.on("confirmed", console.log);
  // from, amount, rawTx
  // > 0x78b1d1f8bbb96d374a8da6fab7ffdcf08e0b083f, 1000, {...}
  
  UCDSHandler.unsubscribe("ESCB", {
    "depositAddress":"0x68b1d1f8bbb96d374a8da6fab7ffdcf08e0b083f"
  });
}

checkTxESCB();
```

# Accepting cryptocurrencies

- Bitcoin (BTC)
- Ethereum (ETH)
- Ethereum tokens (ERC20, ERC721, etc.)
- Ripple (XRM)
- Zero Cash (ZC)

# API

All methods that can return value, return *Promise*.
For sync case you can use *async/await*:

```javascript
import UCDSHandler from "ucds";

// Ethereum RPC
UCDSHandler.setup("ETH", {
    protocol: "http",
    host: "127.0.0.1",
    port: "8545",
});

async function testBTCnode() {
  return await UCDSHandler.testRPC("BTC");
}

if (testBTCnode()) {
  // do something, because node is running
} else {
  // handle error
}
```

For async case you can use *then/catch*:

```javascript
import UCDSHandler from "ucds";

// Ethereum RPC
UCDSHandler.setup("ETH", {
    protocol: "http",
    host: "127.0.0.1",
    port: "8545",
});

UCDSHandler.testRPC("BTC").then((result) {
  if (result) {
    // do something, because node is running
  } else {
    // handle error
  }
})

```

## Methods

```
setup(Symbol, {...params})
```

Symbol - coin or token symbol
{...params} - object of parameters for connection to node by RPC

@return undefined

Allows to setup parameters for blockchain node connection

```
testRPC(Symbol)
```

Symbol - coin or token symbol

@return Boolean

Allows to chekc that blockchain node is running. This method returns *Promise*;

```
subscribe(Symbol, {...params});
```
Symbol - coin or token symbol
{...params} - object of parameters for subscription

@return EventEmitter object

{
    "depositAddress": "required"
    "confirmationCount": "required",
    "tokenAddress": "optional"
}


Allows to subscribe on events for Symbol that will be happened on depositAddress

```
unsubscribe(Symbol, {...params});
```
Symbol - coin or token symbol
{...params} - object of parametersfor unsubscription

{
    "depositAddress": "optional"
}

#return Boolean

If {...params} will be omitted, when will be closed all subscriptions by Symbol

```
callRpc(Symbol, ProcedureName, ProcedureArgs)
```
Symbol - coin or token symbol

ProcedureName - Remote procedure name
ProcedureArgs - array of parameters for procedure

@return void

This function allow to invoke some RPC on certain blockchain

```
close(Symbol);
```
Symbol - coin or token symbol

@return undefined

Close connection for observation for new transactions

## Events

```
on("incoming", callback(array))
```
callback - function that will be triggered after "incoming" event (when transaction is coming to blockchain network) and will contain `array` with parameters
`from, amount, confirmation, rawTx`

```
on("confirmation", callback(array))
```
callback - function that will be triggered after "confirmation" event (when transaction confirmation count is changed on blockchain network) and will contain `array` with parameters
`from, amount, confirmation, rawTx`

```
on("confirmed", callback(array))
```
callback - function that will be triggered after "confirmed" event (when transaction is confirmed on blockchain network) and will contain `array` with parameters
`from, amount, rawTx`
This event will be triggered in according with `confirmationCount` parameter in `subscribe` method

# Testing

Test via mocha

```
npm run test
```

To test specific coin with own address use the command `npm run example`.
For example, for BTC:

```
npm run example BTC 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa
```

Where `BTC` - blockchain name. `1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa` - blockchain address.

# Developing

For adding a new blockchain you need to follow the next scheme of code organization.
For example you want to add the blockchain with codename "XCHAIN". Then you need to create the next directories and files:

`/ucds/examples/XCHAIN.js` - example that can be run by command `npm run example XCHAIN`

`/ucds/lib/blockchains/XCHAIN/` - directory for files related to this blockchain

`/ucds/lib/blockchains/XCHAIN/Dockerfile` - optional file for Docker image

`/ucds/lib/blockchains/XCHAIN/docker_entrypoint.sh` - optional file for `Dockerfile`

`/ucds/lib/blockchains/XCHAIN/README.md` - optional file for the settings description for this blockchain

`/ucds/lib/blockchains/XCHAIN/XCHAIN.js` - code for the blockchain that implement interface between RPC and specification. For example look at the implementation for `BTC` in the file `/ucds/lib/blockchains/BTC/BTC.js`

`/ucds/test/blockchains/XCHAIN.js` - file for the testing your code

Add needed configuration to `docker-compose.yml`

# Contributing

You can read about the contributing process in the document [CONTRIBUTING.md](./CONTRIBUTING.md)

# Code reusing and inspiration

Thanks for:

- https://github.com/bitpay/bitcoind-rpc
- https://github.com/renproject/send-crypto

# Blockchain node list

- BTC: https://github.com/jamesob/docker-bitcoind
- BSV: https://hub.docker.com/r/bitcoinsv/bitcoin-sv
- BCH: https://github.com/bfgasparin/docker-bitcoin-abc
- ETH: https://github.com/paritytech/parity-ethereum/tree/6b17e321dfbcd3db7b60f52ab8530a9dd77a4e46/scripts/docker
- XRP: https://github.com/WietseWind/docker-rippled
- WAVES: https://github.com/wavesplatform/node-docker-image
- XTZ: https://hub.docker.com/r/tezos/tezos/
- EOS: https://hub.docker.com/r/eostudio/eos
- ADA: https://github.com/cipherzzz/cardano-node
- LTC: https://github.com/uphold/docker-litecoin-core
- XLM: https://github.com/stellar/docker-stellar-core
- XMR: https://hub.docker.com/r/xmrto/monero/
- TRX: https://github.com/TRON-US/docker-tron-quickstart
- DASH: https://github.com/dashpay/docker-dashd
- NEO: https://github.com/CityOfZion/neo-privatenet-docker
- ZEC: https://github.com/kost/docker-zcash
- NEM: https://github.com/rb2nem/nem-docker

# Blockchain RPC API node list

- BTC: https://chainquery.com/bitcoin-cli/getrawmempool
- BSV: https://chainquery.com/bitcoin-cli/getrawmempool
- BCH: https://chainquery.com/bitcoin-cli/getrawmempool
- ETH: https://github.com/ethereum/wiki/wiki/json-rpc
- XRP: https://xrpl.org/account_tx.html
- WAVES: https://nodes.wavesnodes.com/api-docs/index.html
- XTZ: https://tezos.gitlab.io/developer/rpc.html
- EOS: https://developers.eos.io/manuals/eos/latest/nodeos/plugins/chain_api_plugin/api-reference/index
- ADA: https://cardanodocs.com/technical/wallet/api/v1/?v=1.7.0#section/Common-Use-Cases/Retrieving-Transaction-History
- LTC: https://github.com/litecoin-project/litecoin/blob/master/doc/REST-interface.md
- XLM: https://www.stellar.org/developers/horizon/reference/endpoints/transactions-for-account.html
- XMR: https://web.getmonero.org/resources/developer-guides/wallet-rpc.html
- TRX: https://developers.tron.network/docs/tron-wallet-rpc-api
- DASH: https://docs.dash.org/en/stable/wallets/dashcore/cmd-rpc.html
- NEO: https://docs.neo.org/docs/en-us/reference/rpc/latest-version/api.html
- ZEC: https://zcash-rpc.github.io/
- NEM: https://nemproject.github.io/