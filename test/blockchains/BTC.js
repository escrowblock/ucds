const assert = require('assert');
import { _testUCDSHandler, sleep } from "./../helper.js";
import EventEmitter from 'events';

describe('UCDS BTC', () => {
  
  describe('test setup BTC', function () {
    this.timeout(10000);
    
    beforeEach(() => {
      _testUCDSHandler.setup("BTC", {
        protocol: "http",
        user: "root",
        pass: "MyStrongPaSS893713467",
        host: "127.0.0.1",
        port: "8332"
      });
    });
    
    afterEach(() => {
      _testUCDSHandler.close("BTC");
    });
    
    it('should confirm that BTC is running on 8332', async () => {
      assert.equal(await _testUCDSHandler.testRPC("BTC"), true, 'BTC is runnig');
    });
    
    it('should confirm that BTC is running on 8332 in async mode', () => {
      _testUCDSHandler.testRPC("BTC").then((result) => {
        assert.equal(result, true, 'BTC is runnig');
      });
    });
    
    it('should confirm that BTC is NOT running on 8333', async () => {
      _testUCDSHandler.close("BTC");
      
      await sleep(2000);
      
      _testUCDSHandler.setup("BTC", {
        protocol: "http",
        user: "root",
        pass: "MyStrongPaSS893713467",
        host: "127.0.0.1",
        port: "8333",
      });
  
      assert.equal(await _testUCDSHandler.testRPC("BTC"), false, 'BTC is not runnig');
    });
    
    it('should confirm that BTC is NOT running on 8333 in async mode', async () => {
      _testUCDSHandler.close("BTC");
      
      await sleep(2000);
      
      _testUCDSHandler.setup("BTC", {
        protocol: "http",
        user: "root",
        pass: "MyStrongPaSS893713467",
        host: "127.0.0.1",
        port: "8333",
      });
      
      _testUCDSHandler.testRPC("BTC").then((result) => {
        assert.equal(result, false, 'BTC is not runnig');
      });
    });
    
  });

  describe('test mempool BTC', function (done) {
    this.timeout(10000);
  
    beforeEach(() => {
      _testUCDSHandler.setup("BTC", {
        protocol: "http",
        user: "root",
        pass: "MyStrongPaSS893713467",
        host: "127.0.0.1",
        port: "8332",
      });
    });
    
    afterEach(() => {
      _testUCDSHandler.close("BTC");
    });
    
    it('should confirm that mepool is not empty and blockchain is full synced.', async () => {
      const getMemPoolInfo = await _testUCDSHandler.callRpc("BTC", "getMemPoolInfo");
      assert.equal(typeof(getMemPoolInfo) === 'object', true, 'BTC blockchain is synced');
    });
  });

  describe('test subscribe BTC', function () {
    this.timeout(10000);

    beforeEach(() => {
      _testUCDSHandler.setup("BTC", {
        protocol: "http",
        user: "root",
        pass: "MyStrongPaSS893713467",
        host: "127.0.0.1",
        port: "8332",
      });
    });
    
    afterEach(() => {
      _testUCDSHandler.close("BTC");
    });
    
    it('should confirm that we can subscribe and unsubscribe on BTC address', async () => {
      assert.equal(await _testUCDSHandler.testRPC("BTC"), true, 'BTC is runnig');
      
      const BTCSubscriber = _testUCDSHandler.subscribe("BTC", {
        "depositAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "confirmationCount": 3
      });

      assert.equal(typeof(BTCSubscriber) === "object" && BTCSubscriber instanceof EventEmitter, true, 'BTC subscriber is EventEmitter object');
      
      await sleep(2000);
      
      BTCSubscriber.on("incoming", function(result) {
         assert.equal(result[0] == '2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' && 
                      result[2] == 0, true, 'BTC incoming');
      });
      // from, amount, confirmation, rawTx
      // > 2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa, 0.0001, 1, {...}
      
      BTCSubscriber.on("confirmation", function(result) {
         assert.equal(result[0] == '2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' && 
                      result[2] == 2, true, 'BTC confirmation');
      });
      // from, amount, confirmation, rawTx
      // > 2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa, 0.0001, 1, {...}
      
      BTCSubscriber.on("confirmed", function(result) {
         assert.equal(result[0] == '2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' && 
                      typeof(result[2]) === "object", true, 'BTC confirmed');
      });
      // from, amount, rawTx
      // > 2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa, 0.0001, {...}
      
      _testUCDSHandler.unsubscribe("BTC", {
        "depositAddress": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
      });
      
      _testUCDSHandler.emulateEvent(BTCSubscriber, "incoming", ["2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 0.0001, 0, {}]);
      
      _testUCDSHandler.emulateEvent(BTCSubscriber, "confirmation", ["2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 0.0001, 2, {}]);
      
      _testUCDSHandler.emulateEvent(BTCSubscriber, "confirmed", ["2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa", 0.0001, {}]);
      
      await sleep(2000); // we can't use "done" here, because async, just give a time to complete
      
      return true;
    });
  });
})