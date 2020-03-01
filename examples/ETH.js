import UCDSHandler from "./../index.js";

async function runETHWatcher (depositAddress) {
  UCDSHandler.setup("ETH", {
    protocol: "http",
    host: "127.0.0.1",
    port: "8545",
    checkerTimeout: 10000,
  });

  if (await UCDSHandler.testRPC("ETH")) {
    const ETHSubscriber = UCDSHandler.subscribe("ETH", {
      "depositAddress": depositAddress,
      "confirmationCount": 3
    });
    
    ETHSubscriber.on("incoming", function(result) {
      console.log("incoming", result);
    });
    
    ETHSubscriber.on("confirmation", function(result) {
      console.log("confirmation", result);
    });
    
    ETHSubscriber.on("confirmed", function(result) {
      console.log("confirmed", result);
      UCDSHandler.unsubscribe("ETH", {
        "depositAddress": depositAddress
      });
    });
  } else {
    console.log('BTC blockchain node is unavailable');
  }
}

export default runETHWatcher;