const assert = require('assert');
import { _testUCDSHandler, sleep } from "./../helper.js";
import EventEmitter from 'events';

describe('UCDS ETH', () => {
  
  describe('test setup ETH', function () {
    this.timeout(10000);

    beforeEach(() => {
      _testUCDSHandler.setup("ETH", {
        protocol: "http",
        host: "127.0.0.1",
        port: "8545",
      });
    });
    
    afterEach(() => {
      _testUCDSHandler.close("ETH");
    });
    
    it('should confirm that ETH is running on 8545', async () => {
      assert.equal(await _testUCDSHandler.testRPC("ETH"), true, 'ETH is runnig');
    });
    
    it('should confirm that ETH is running on 8545 in async mode', async () => {
      _testUCDSHandler.testRPC("ETH").then((result) => {
        assert.equal(result, true, 'ETH is runnig');
      });
    });
    
    it('should confirm that ETH is NOT running on 8333', async () => {
      _testUCDSHandler.close("ETH");
      
      await sleep(2000);
      
      _testUCDSHandler.setup("ETH", {
        protocol: "http",
        host: "127.0.0.1",
        port: "8333",
      });
      
      assert.equal(await _testUCDSHandler.testRPC("ETH"), false, 'ETH is not runnig');
    });
    
    it('should confirm that ETH is NOT running on 8333 in async mode', async () => {
      _testUCDSHandler.close("ETH");
      
      await sleep(2000);
      
      _testUCDSHandler.setup("ETH", {
        protocol: "http",
        host: "127.0.0.1",
        port: "8333",
      });
      
      _testUCDSHandler.testRPC("ETH").then((result) => {
        assert.equal(result, false, 'ETH is not runnig');
      });
    });
    
  });

  describe('test mempool ETH', function (done) {
    this.timeout(10000);
  
    beforeEach(() => {
      _testUCDSHandler.setup("ETH", {
        protocol: "http",
        host: "127.0.0.1",
        port: "8545",
      });
    });
    
    afterEach(() => {
      _testUCDSHandler.close("ETH");
    });
    
    it('should confirm that mepool is not empty and blockchain is full synced.', async () => {
      const blockNumber = await _testUCDSHandler.callRpc("ETH", "eth_blockNumber");
      assert.equal(blockNumber && blockNumber.result !== '', true, 'ETH is runnig');
    });
  });
  
  describe('test subscribe ETH', function () {
    this.timeout(10000);

    beforeEach(() => {
      _testUCDSHandler.setup("ETH", {
        protocol: "http",
        host: "127.0.0.1",
        port: "8545",
      });
    });
    
    afterEach(() => {
      _testUCDSHandler.close("ETH");
    });
    
    it('should confirm that we can subscribe and unsubscribe on ETH address', async () => {
      assert.equal(await _testUCDSHandler.testRPC("ETH"), true, 'ETH is runnig');
      
      const ETHSubscriber = _testUCDSHandler.subscribe("ETH", {
        "depositAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "confirmationCount": 3
      });

      assert.equal(typeof(ETHSubscriber) === "object" && ETHSubscriber instanceof EventEmitter, true, 'ETH subscriber is EventEmitter object');
      
      await sleep(2000);
      
      ETHSubscriber.on("incoming", function(result) {
         assert.equal(result[0] == '2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' && 
                      result[2] == 0, true, 'ETH incoming');
      });
      // from, amount, confirmation, rawTx
      // > 2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa, 0.0001, 1, {...}
      
      ETHSubscriber.on("confirmation", function(result) {
         assert.equal(result[0] == '2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' && 
                      result[2] == 2, true, 'ETH confirmation');
      });
      // from, amount, confirmation, rawTx
      // > 2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa, 0.0001, 1, {...}
      
      ETHSubscriber.on("confirmed", function(result) {
         assert.equal(result[0] == '2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' && 
                      typeof(result[2]) === "object", true, 'ETH confirmed');
      });
      // from, amount, rawTx
      // > 2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa, 0.0001, {...}
      
      _testUCDSHandler.unsubscribe("ETH", {
        "depositAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
      });
      
      _testUCDSHandler.emulateEvent(ETHSubscriber, "incoming", ["2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 0.0001, 0, {}]);
      
      _testUCDSHandler.emulateEvent(ETHSubscriber, "confirmation", ["2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 0.0001, 2, {}]);
      
      _testUCDSHandler.emulateEvent(ETHSubscriber, "confirmed", ["2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 0.0001, {}]);
      
      await sleep(2000); // we can't use "done" here, because async, just give a time to complete
      
      return true;
    });
  });
})