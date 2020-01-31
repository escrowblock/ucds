import UCDSHandler from "./../index.js";

const sleep = async (time) => {
  await new Promise((resolve) => {
    setTimeout(resolve, time);
  });
};

const _testUCDSHandler = UCDSHandler;
_testUCDSHandler.emulateEvent = function(emitter, event, parameters) {
  emitter.emit(event, parameters);
};

export { sleep, _testUCDSHandler };