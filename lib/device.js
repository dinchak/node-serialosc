/**
 * @module node-serialosc
 * @author Tom Dinchak <dinchak@gmail.com>
 */

var _ = require('underscore');
var OscEmitter = require('osc-emitter');
var OscReceiver = require('osc-receiver');
var EventEmitter = require('events').EventEmitter;

/**
 * A Device represents either an arc or a grid connected to serialosc
 *
 * The following properties can be passed as options or will be provided
 * by serialosc as the result of a /sys/info call.
 *
 * host       - the hostname to listen on (default: localhost)
 * port       - the port to listen on (default: random between 1024-65535)
 * id         - The id of the device (ie. m128-302, provided by serialosc)
 * type       - The type of device, grid or arc
 * model      - The model of device (ie. monome 128, provided by serialosc)
 * deviceHost - the hostname the device is listening on (ie. localhost, provided by serialosc)
 * devicePort - the port the device is listening on (ie. 38717, provided by serialosc)
 * sizeX      - the width of a grid device (ie. 16)
 * sizeY      - the height of a grid device (ie. 8)
 * encoders   - the number of encoders for an arc device (ie. 4)
 * prefix     - the prefix of the device (ie. /monome)
 * connected  - true after device is ready to use
 * 
 * @constructor
 */
function Device() {}
/**
 * Extend the EventEmitter prototype
 * Provides .on(), .emit(), etc.
 */
Device.prototype = Object.create(EventEmitter.prototype);

/**
 * Configure device
 * @param  {Object} opts configuration options
 */
Device.prototype.config = function (opts) {
  // choose a random port if none is provided
  this.port = opts.port || Math.floor(Math.random() * (65536 - 1024)) + 1024;

  this.oscReceiver = new OscReceiver();
  this.oscEmitter = new OscEmitter();

  this.on = this.oscReceiver.on;

  this.connected = false;

  // set all keys passed in opts
  for (var key in opts) {
    this[key] = opts[key];
  }
};

/**
 * Begin listening on a host/port to respond to device messages
 * Setup listeners for /sys messages
 * Set the device's port and hostname
 * Send /sys/info to get device information
 */
Device.prototype.start = function () {
  var self = this;
  var sentSysInfo = false;
  var initMsgs = [
    '/sys/host',
    '/sys/port',
    '/sys/prefix',
    '/sys/rotation',
    '/sys/size',
  ];

  // listen on host/port to respond to device messages
  this.oscReceiver.bind(this.port, this.host);

  function receiveInitMsg(msg) {
    if (self.connected) {
      return;
    }
    initMsgs = _.without(initMsgs, msg);
    if (initMsgs.length === 0) {
      self.connected = true;
      self.emit('initialized');
    }

    // send host message once port reply is received
    if (!_.contains(initMsgs, '/sys/port') && _.contains(initMsgs, '/sys/host')) {
      self.oscEmitter.emit(
        '/sys/host',
        {
          type: 'string',
          value: self.host
        }
      );
    }

    // once host/port have been received finish initialization
    if (!sentSysInfo && !_.contains(initMsgs, '/sys/port') && !_.contains(initMsgs, '/sys/host')) {
      sentSysInfo = true;
      self.oscEmitter.emit('/sys/info');
    }
  }

  // handle basic /sys messages by setting device properties

  this.oscReceiver.on('/sys/id', function () {
    self.id = arguments[0];
  });

  this.oscReceiver.on('/sys/size', function () {
    self.sizeX = arguments[0];
    self.sizeY = arguments[1];
    receiveInitMsg('/sys/size');
  });

  this.oscReceiver.on('/sys/rotation', function () {
    self.rotation = arguments[0];
    receiveInitMsg('/sys/rotation');
  });

  this.oscReceiver.on('/sys/connect', function () {
    self.connected = true;
    self.emit('connected');
  });

  this.oscReceiver.on('/sys/disconnect', function () {
    self.connected = false;
    self.emit('disconnected');
  });

  // device initialization is handled through these responders
  // we wait for a response from /sys/port, /sys/host, and /sys/rotation
  // before broadcasting the connected event

  this.oscReceiver.on('/sys/port', function () {
    self.port = arguments[0];
    receiveInitMsg('/sys/port');
  });

  this.oscReceiver.on('/sys/host', function () {
    self.host = arguments[0];
    receiveInitMsg('/sys/host');
  });

  this.oscReceiver.on('/sys/prefix', function () {
    // remove existing listeners for old prefix
    self.removeListeners();
    self.prefix = arguments[0];
    // add new listeners for new prefix
    self.addListeners();
    receiveInitMsg('/sys/prefix');
  });

  // add deviceHost and devicePort to the broadcast list
  this.oscEmitter.add(this.deviceHost, this.devicePort);

  // initialize device
  self.oscEmitter.emit(
    '/sys/port',
    {
      type: 'integer',
      value: self.port
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
 * Sets a device's rotation
 * @param  {Number} r new rotation value (0, 90, 180, 270)
 */
Device.prototype.setRotation = function (r) {
  this.oscEmitter.emit(
    '/sys/rotation',
    {
      type: 'integer',
      value: r
    }
  );
};

module.exports = Device;
