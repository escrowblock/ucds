[logo](./images/escrow_1024.png)

<div align="center">United Cryptocurrency Depositing System (UCDS)</div>

# Description

United Cryptocurrency Depositing System allows to have gateway for accepting cryptocurrencies on your addresses and watching transactions.
UCDS works by event model, that allows to use it as microservice for transforming data from blockchain to offline data.
For example you can handle the event that you have got a transaction in 0.01 BTC and record this to DB or send email, etc.

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

Allows to setup parameters for blockchain node connection


```
testRPC(Symbol)
```

Symbol - coin or token symbol

Allows to chekc that blockchain node is running. This method returns *Promise*;

```
subscribe(Symbol, {...params});
```
Symbol - coin or token symbol
{...params} - object of parameters for subscription

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
  
If {...params} will be omitted, when will be closed all subscriptions by Symbol


```
close(Symbol);
```
Symbol - coin or token symbol

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

# Code reusing and inspiration

Thank for:
https://github.com/bitpay/bitcoind-rpc
https://github.com/renproject/send-crypto

# Blockchain node list

- BTC: https://github.com/jamesob/docker-bitcoind
- ETH: https://github.com/paritytech/parity-ethereum/tree/6b17e321dfbcd3db7b60f52ab8530a9dd77a4e46/scripts/docker
- XMR: https://github.com/WietseWind/docker-rippled

# Blockchain RPC API node list

- BTC: https://chainquery.com/bitcoin-cli/getrawmempool
- ETH: https://github.com/ethereum/wiki/wiki/json-rpc
- XMR: https://xrpl.org/account_tx.html