var OscEmitter = require('osc-emitter');
var OscReceiver = require('osc-receiver');
var EventEmitter = require('events').EventEmitter;

var receiver = new OscReceiver();
var deviceEmitter = new OscEmitter();

var Device = function (opts) {
  this.port = Math.floor(Math.random() * (65536 - 1024)) + 1024;
  this.on = receiver.on;
  for (var key in opts) {
    this[key] = opts[key];
  }
};

Device.prototype = Object.create(EventEmitter.prototype);

Device.prototype.start = function () {
  this.connected = true;
  
  receiver.bind(this.port, this.host);

  receiver.on('message', function () {
    console.log(arguments);
  });

  var self = this;
  receiver.on('/sys/id', function () {
    self.id = arguments[0];
  });
  receiver.on('/sys/size', function () {
    self.sizeX = arguments[0];
    self.sizeY = arguments[1];
  });
  receiver.on('/sys/host', function () {
    self.host = arguments[0];
  });
  receiver.on('/sys/port', function () {
    self.port = arguments[0];
  });
  receiver.on('/sys/prefix', function () {
    self.removeGridListeners();
    self.prefix = arguments[0];
    self.addGridListeners();
  });
  receiver.on('/sys/rotation', function () {
    self.rotation = arguments[0];
  });
  receiver.on('/sys/connect', function () {
    self.connected = true;
  });
  receiver.on('/sys/disconnect', function () {
    self.connected = false;
  });

  deviceEmitter.add(this.deviceHost, this.devicePort);
  deviceEmitter.emit('/sys/port', this.port);
  deviceEmitter.emit('/sys/host', this.host);
  deviceEmitter.emit('/sys/info', this.host, this.port);
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
  deviceEmitter.emit(this.prefix + '/grid/led/set', data.x, data.y, data.s);
};

Device.prototype.all = function (s) {
  deviceEmitter.emit(this.prefix + '/grid/led/all', s);
};

Device.prototype.map = function (xOffset, yOffset, arr) {
  var state = [];
  for (var y = 0; y < 8; y++) {
    if (typeof arr[y] == 'number') {
      state[y] = arr[y];
      continue;
    }
    state[y] = 0;
    for (var x = 0; x < 8; x++) {
      console.log(arr[y][x] + ' << ' + x);
      state[y] += (arr[y][x] << x);
    }
  }
  console.log(state);
  var args = [
    this.prefix + '/grid/led/map',
    xOffset,
    yOffset
  ];
  args = args.concat(state);
  console.log(args);
  deviceEmitter.emit.apply(deviceEmitter, args);
};

Device.prototype.row = function (xOffset, y, s) {
  console.log('send shit');
  deviceEmitter.emit(this.prefix + '/grid/led/row', 0, 4, 232, 232, 232);
  deviceEmitter.emit(this.prefix + '/grid/led/col', 4, 0, 232, 232, 232);
  // var args = [this.prefix + '/grid/led/row', xOffset, y, s];
  // for (var i = 3; i < arguments.length; i++) {
  //   args.push(arguments[i]);
  // }
  // console.log(args);
  //deviceEmitter.emit.apply(deviceEmitter, args);
};

Device.prototype.col = function (x, yOffset, s) {
  var args = [this.prefix + '/grid/led/col', x, yOffset, s];
  for (var i = 3; i < arguments.length; i++) {
    args.push(arguments[i]);
  }
  deviceEmitter.emit.apply(deviceEmitter, args);
};

module.exports = Device;
