'use strict';

import http from 'http';
import https from 'https';
import url from 'url';

function decodeURL(str) {
  const parsedUrl = url.parse(str);
  const hostname = parsedUrl.hostname;
  const port = parseInt(parsedUrl.port, 10);
  let protocol = parsedUrl.protocol;
  // strip trailing ":"
  protocol = protocol.substring(0, protocol.length - 1);
  const auth = parsedUrl.auth;
  const parts = auth.split(':');
  const user = parts[0] ? decodeURIComponent(parts[0]) : null;
  const pass = parts[1] ? decodeURIComponent(parts[1]) : null;
  const opts = {
    host: hostname,
    port: port,
    protocol: protocol,
    user: user,
    pass: pass,
  };
  return opts;
}

function RpcClient(opts) {
  // opts can ba an URL string
  if (typeof opts === 'string') {
    opts = decodeURL(opts);
  }
  opts = opts || {};
  this.host = opts.host || '127.0.0.1';
  this.port = opts.port || 8332;
  this.user = opts.user || '';
  this.pass = opts.pass || '';
  this.protocol = opts.protocol === 'http' ? http : https;
  this.disableAgent  = opts.disableAgent || false;

  const isRejectUnauthorized = typeof opts.rejectUnauthorized !== 'undefined';
  this.rejectUnauthorized = isRejectUnauthorized ? opts.rejectUnauthorized : true;

  if (RpcClient.config.log) {
    this.log = RpcClient.config.log;
  } else {
    this.log = RpcClient.loggers[RpcClient.config.logger || 'normal'];
  }

}

const cl = console.log.bind(console);

const noop = function() {};

RpcClient.loggers = {
  none: {info: noop, warn: noop, err: noop, debug: noop},
  normal: {info: cl, warn: cl, err: cl, debug: noop},
  debug: {info: cl, warn: cl, err: cl, debug: cl}
};

RpcClient.config = {
  logger: 'normal' // none, normal, debug
};

function rpc(request, callback) {

  const self = this;
  request = JSON.stringify(request);
  const auth = self.user && self.pass ? new Buffer(self.user + ':' + self.pass).toString('base64'): false;

  const options = {
    host: self.host,
    path: '/',
    method: 'POST',
    port: self.port,
    rejectUnauthorized: self.rejectUnauthorized,
    agent: self.disableAgent ? false : undefined
  };

  if (self.httpOptions) {
    for (const k in self.httpOptions) {
      options[k] = self.httpOptions[k];
    }
  }

  let called = false;

  let errorMessage = 'JSON-RPC: ';

  const req = this.protocol.request(options, function(res) {

    let buf = '';
    res.on('data', function(data) {
      buf += data;
    });

    res.on('end', function() {

      if (called) {
        return;
      }
      called = true;

      if (res.statusCode === 401) {
        callback(new Error(errorMessage + 'Connection Rejected: 401 Unnauthorized'));
        return;
      }
      if (res.statusCode === 403) {
        callback(new Error(errorMessage + 'Connection Rejected: 403 Forbidden'));
        return;
      }
      if (res.statusCode === 500 && buf.toString('utf8') === 'Work queue depth exceeded') {
        var exceededError = new Error('JSON-RPC: ' + buf.toString('utf8'));
        exceededError.code = 429; // Too many requests
        callback(exceededError);
        return;
      }

      let parsedBuf;
      try {
        parsedBuf = JSON.parse(buf);
      } catch(e) {
        self.log.err(e.stack);
        self.log.err(buf);
        self.log.err('HTTP Status code:' + res.statusCode);
        const err = new Error(errorMessage + 'Error Parsing JSON: ' + e.message + ' json: ' + request);
        callback(err);
        return;
      }

      callback(parsedBuf.error, parsedBuf);

    });
  });

  req.on('error', function(e) {
    const err = new Error(errorMessage + 'Request Error: ' + e.message);
    if (!called) {
      called = true;
      callback(err);
    }
  });

  req.setHeader('Content-Length', request.length);
  req.setHeader('Content-Type', 'application/json');
  if (auth) {
    req.setHeader('Authorization', 'Basic ' + auth);
  }
  req.write(request);
  req.end();
}

const slice = function(arr, start, end) {
  return Array.prototype.slice.call(arr, start, end);
};

function generateRPCMethods(constructor, apiCalls, rpc) {

  function createRPCMethod(methodName, argMap) {
    return function() {

      let limit = arguments.length - 1;

      for (let i = 0; i < limit; i++) {
        if(argMap[i]) {
          arguments[i] = argMap[i](arguments[i]);
        }
      }

      rpc.call(this, {
        jsonrpc: '2.0',
        method: methodName,
        params: slice(arguments, 0, arguments.length - 1),
        id: getRandomId()
      }, arguments[arguments.length - 1]);
    };
  }

  const types = {
    str: function(arg) {
      return arg.toString();
    },
    int: function(arg) {
      return parseFloat(arg);
    },
    float: function(arg) {
      return parseFloat(arg);
    },
    bool: function(arg) {
      return (arg === true || arg == '1' || arg == 'true' || arg.toString().toLowerCase() == 'true');
    },
    obj: function(arg) {
      if (typeof arg === 'string') {
        return JSON.parse(arg);
      }
      return arg;
    }
  };

  for(let methodName in apiCalls) {
    let spec = [];
    if (apiCalls[methodName].length) {
      spec = apiCalls[methodName].split(' ');
      for (let i = 0; i < spec.length; i++) {
        if(types[spec[i]]) {
          spec[i] = types[spec[i]];
        } else {
          spec[i] = types.str;
        }
      }
    }
    constructor.prototype[methodName] = createRPCMethod(methodName, spec);
    constructor.prototype[methodName] = constructor.prototype[methodName];
  }

}

function getRandomId() {
  return parseInt(Math.random() * 100000, 10);
}

export { RpcClient, generateRPCMethods, rpc};