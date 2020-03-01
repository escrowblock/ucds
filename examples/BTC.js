import UCDSHandler from "./../index.js";

async function runBTCWatcher (depositAddress) {
  
  UCDSHandler.setup("BTC", {
    protocol: "http",
    user: "root",
    pass: "MyStrongPaSS893713467",
    host: "127.0.0.1",
    port: "8332",
    checkerTimeout: 10000,
  });
  
  if (await UCDSHandler.testRPC("BTC")) {
    const BTCSubscriber = UCDSHandler.subscribe("BTC", {
      "depositAddress": depositAddress,
      "confirmationCount": 3
    });
    
    BTCSubscriber.on("incoming", function(result) {
      console.log("incoming", result);
    });
    
    BTCSubscriber.on("confirmation", function(result) {
      console.log("confirmation", result);
    });
    
    BTCSubscriber.on("confirmed", function(result) {
      console.log("confirmed", result);
      UCDSHandler.unsubscribe("BTC", {
        "depositAddress": depositAddress
      });
    });
  } else {
    console.log('BTC blockchain node is unavailable');
  }
}

export default runBTCWatcher;