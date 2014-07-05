var OscEmitter = require('osc-emitter');
var OscReceiver = require('osc-receiver');
var EventEmitter = require('events').EventEmitter;

var receiver = new OscReceiver();
var deviceEmitter = new OscEmitter();

var Device = function (opts) {
  this.port = Math.floor(Math.random() * (65536 - 1024)) + 1024;
  this.on = receiver.on;
  this.hostConnected = false;
  this.portConnected = false;
  this.connected = false;
  for (var key in opts) {
    this[key] = opts[key];
  }
};

Device.prototype = Object.create(EventEmitter.prototype);

Device.prototype.start = function () {
  receiver.bind(this.port, this.host);
  var self = this;

  receiver.on('/sys/id', function () {
    self.id = arguments[0];
  });

  receiver.on('/sys/size', function () {
    self.sizeX = arguments[0];
    self.sizeY = arguments[1];
  });

  receiver.on('/sys/rotation', function () {
    self.rotation = arguments[0];
  });

  receiver.on('/sys/connect', function () {
    self.connected = true;
    self.emit('connected');
  });

  receiver.on('/sys/disconnect', function () {
    self.connected = false;
    self.emit('disconnected');
  });

  // device initialization is handled through these responders
  // we wait for a response from /sys/port, /sys/host, and /sys/rotation
  // before broadcasting the connected event

  receiver.on('/sys/port', function () {
    self.port = arguments[0];
    // if port hasn't been initialized yet
    if (!self.portConnected) {
      // port is now initialized
      // begin 2nd step of initialization, setting host
      self.portConnected = true;
      deviceEmitter.emit(
        '/sys/host',
        {
          type: 'string',
          value: self.host
        }
      );
    }
  });

  receiver.on('/sys/host', function () {
    self.host = arguments[0];
    // if host hasn't been initialized yet
    if (!self.hostConnected) {
      // host is now initialized
      // begin 3rd step of initialization, wait for /sys/rotation
      self.hostConnected = true;
      deviceEmitter.emit('/sys/info');
    }
  });

  receiver.on('/sys/prefix', function () {
    // remove existing listeners for old prefix
    self.removeGridListeners();
    self.prefix = arguments[0];
    // add new listeners for new prefix
    self.addGridListeners();
    // if not yet connected, set connected and emit connected event
    if (!self.connected) {
      // /sys/rotation is received
      // device is now ready to use
      self.connected = true;
      self.emit('connected');
    }
  });

  deviceEmitter.add(this.deviceHost, this.devicePort);

  // begin initialization by setting port
  deviceEmitter.emit(
    '/sys/port',
    {
      type: 'integer',
      value: this.port
    }
  );
};

Device.prototype.stop = function () {
  this.connected = false;
};

Device.prototype.removeGridListeners = function () {
  receiver.removeAllListeners(this.prefix + '/grid/key');
  receiver.removeAllListeners(this.prefix + '/tilt');
};

Device.prototype.addGridListeners = function () {
  var self = this;
  receiver.on(this.prefix + '/grid/key', function () {
    self.emit('key', {
      x: arguments[0],
      y: arguments[1],
      s: arguments[2]
    });
  });
  receiver.on(this.prefix + '/tilt', function () {
    self.emit('tilt', {
      n: arguments[0],
      x: arguments[1],
      y: arguments[2],
      s: arguments[3]
    });
  });
};

Device.prototype.set = function (data) {
  if (typeof data == 'number') {
    data = {
      x: arguments[0],
      y: arguments[1],
      s: arguments[2]
    };
  }
  deviceEmitter.emit(
    this.prefix + '/grid/led/set',
    {
      type: 'integer',
      value: data.x
    },
    {
      type: 'integer',
      value: data.y
    },
    {
      type: 'integer',
      value: data.s
    }
  );
};

Device.prototype.all = function (s) {
  deviceEmitter.emit(
    this.prefix + '/grid/led/all',
    {
      type: 'integer',
      value: s
    }
  );
};

Device.prototype.map = function (xOffset, yOffset, arr) {
  var state = [];
  for (var y = 0; y < 8; y++) {
    if (typeof arr[y] == 'number') {
      state[y] = arr[y];
      continue;
    }
    state[y] = {
      type: 'integer',
      value: 0
    };
    for (var x = 0; x < 8; x++) {
      state[y].value += (arr[y][x] << x);
    }
  }
  var args = [
    this.prefix + '/grid/led/map',
    {
      type: 'integer',
      value: xOffset
    },
    {
      type: 'integer',
      value: yOffset
    }
  ];
  args = args.concat(state);
  deviceEmitter.emit.apply(deviceEmitter, args);
};

Device.prototype.row = function (xOffset, y, s) {
  var args = [
    this.prefix + '/grid/led/row',
    {
      type: 'integer',
      value: xOffset
    },
    {
      type: 'integer',
      value: y
    },
    {
      type: 'integer',
      value: s
    }
  ];
  for (var i = 3; i < arguments.length; i++) {
    args.push({
      type: 'integer',
      value: arguments[i]
    });
  }
  deviceEmitter.emit.apply(deviceEmitter, args);
};

Device.prototype.col = function (x, yOffset, s) {
  var args = [
    this.prefix + '/grid/led/col',
    {
      type: 'integer',
      value: x
    },
    {
      type: 'integer',
      value: yOffset
    },
    {
      type: 'integer',
      value: s
    }
  ];
  for (var i = 3; i < arguments.length; i++) {
    args.push({
      type: 'integer',
      value: arguments[i]
    });
  }
  deviceEmitter.emit.apply(deviceEmitter, args);
};

module.exports = Device;
