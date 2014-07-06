var OscEmitter = require('osc-emitter');
var OscReceiver = require('osc-receiver');
var EventEmitter = require('events').EventEmitter;

/**
 * Receive OSC messages from an actual device
 * @type {OscReceiver}
 */
var receiver = new OscReceiver();

/**
 * Send OSC messages to an actual device
 * @type {OscReceiver}
 */
var deviceEmitter = new OscEmitter();

/**
 * A Device represents either an arc or a grid connected to serialosc
 *
 * The following properties can be passed as options or will be provided
 * by serialosc as the result of a /sys/info call.
 *
 * host       - the hostname to listen on (default: localhost)
 * port       - the port to listen on (default: random between 1024-65535)
 * id         - The id of the device (ie. m128-302, provided by serialosc)
 * type       - The type of device it is (ie. monome 128, provided by serialosc)
 * deviceHost - the hostname the device is listening on (ie. localhost, provided by serialosc)
 * devicePort - the port the device is listening on (ie. 38717, provided by serialosc)
 * sizeX      - the width of the device (ie. 16)
 * sizeY      - the height of the device (ie. 8)
 * prefix     - the prefix of the device (ie. /monome)
 *
 * The following additional properties handle the state of the device:
 *
 * portConnected - true after /sys/port has been set
 * hostConnected - true after /sys/host has been set
 * connected     - true after /sys/prefix has been received
 */
var Device = function (opts) {
  // choose a random port if none is provided
  this.port = opts.port || Math.floor(Math.random() * (65536 - 1024)) + 1024;

  // map on function to receiver's on function
  this.on = receiver.on;

  // not yet connected
  this.hostConnected = false;
  this.portConnected = false;
  this.connected = false;

  // set all keys passed in opts
  for (var key in opts) {
    this[key] = opts[key];
  }
};

/**
 * Extend the EventEmitter prototype
 * Provides .on(), .emit(), etc.
 */
Device.prototype = Object.create(EventEmitter.prototype);

/**
 * Begin listening on a host/port to respond to device messages
 * Setup listeners for /sys messages
 * Set the device's port and hostname
 * Send /sys/info to get device information
 */
Device.prototype.start = function () {
  // listen on host/port to respond to device messages
  receiver.bind(this.port, this.host);
  var self = this;

  // handle basic /sys messages by setting device properties

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

  // add deviceHost and devicePort to the broadcast list
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

/**
 * Called when the device is unplugged
 */
Device.prototype.stop = function () {
  this.connected = false;
};

/**
 * Remove existing prefix-based listeners
 * Called when the prefix is changed
 */
Device.prototype.removeGridListeners = function () {
  receiver.removeAllListeners(this.prefix + '/grid/key');
  receiver.removeAllListeners(this.prefix + '/tilt');
};

/**
 * Add prefix-based listeners
 * Called when the prefix is changed
 */
Device.prototype.addGridListeners = function () {
  var self = this;
  receiver.on(this.prefix + '/grid/key', function () {
    // emit key event when /grid/key received
    self.emit('key', {
      x: arguments[0],
      y: arguments[1],
      s: arguments[2]
    });
  });
  receiver.on(this.prefix + '/tilt', function () {
    // emit tilt event when /tilt received
    self.emit('tilt', {
      n: arguments[0],
      x: arguments[1],
      y: arguments[2],
      s: arguments[3]
    });
  });
};

/**
 * Sets a single led's state to off or on
 * Can be called two ways:
 *
 * set(x, y, s);
 * set({x: x, y: y, s: s});
 * 
 * @param {Object} data press data
 */
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

/**
 * Set all of device's leds to off or on
 * @param  {Number} s 0 for off, 1 for on
 */
Device.prototype.all = function (s) {
  deviceEmitter.emit(
    this.prefix + '/grid/led/all',
    {
      type: 'integer',
      value: s
    }
  );
};
/**
 * Update an 8x8 quad of leds
 * Can be called two ways:
 *
 * map(0, 0, [
 *   [0, 1, 0, 1, 0, 1, 0, 1],
 *   [0, 1, 0, 1, 0, 1, 0, 1],
 *   [0, 1, 0, 1, 0, 1, 0, 1],
 *   [0, 1, 0, 1, 0, 1, 0, 1],
 *   [0, 1, 0, 1, 0, 1, 0, 1],
 *   [0, 1, 0, 1, 0, 1, 0, 1],
 *   [0, 1, 0, 1, 0, 1, 0, 1],
 *   [0, 1, 0, 1, 0, 1, 0, 1]
 * ]);
 *
 * or
 * 
 * map(0, 0, [
 *   255, 255, 255, 255, 255, 255, 255, 255
 * ]);
 * 
 * @param  {[type]} xOffset x offset of target quad in multiples of 8
 * @param  {[type]} yOffset y offset of target quad in multiples of 8
 * @param  {[type]} arr     1 or 2 dimensional array of led values
 */
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

/**
 * Set a row of leds
 * You can send an optional 4th argument for the 2nd quad bitmask
 * 
 * @param  {[type]} xOffset quad offset
 * @param  {[type]} y       row number
 * @param  {[type]} s       bitmask of first 8 led states
 */
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

/**
 * Set a column of leds
 * You can send an optional 4th argument for the 2nd quad bitmask
 * 
 * @param  {[type]} x       column number
 * @param  {[type]} yOffset quad offset
 * @param  {[type]} s       bitmask of first 8 led states
 */
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
