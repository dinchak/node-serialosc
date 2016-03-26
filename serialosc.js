/**
 * @module node-serialosc
 * @author Tom Dinchak <dinchak@gmail.com>
 */

var util = require('util');
var _ = require('underscore');
var OscReceiver = require('osc-receiver');
var OscEmitter = require('osc-emitter');
var EventEmitter = require('events').EventEmitter;
var Grid = require('./lib/grid');
var Arc = require('./lib/arc');

/**
 * The SerialOSC object represents an instance of
 * serialosc running either on the local computer
 * or another computer on the network.
 *
 * @constructor
 */
var SerialOSC = function () {
  /**
   * An array of all devices that have been seen
   * @type {Array}
   */
  this.devices = [];

  /**
   * Receives OSC messages from serialosc directly
   * ie. not messages from actual devices
   * @type {OscReceiver}
   */
  this.receiever = null;

  /**
   * Sends OSC messages to serialosc server directly
   * ie. not messages to actual devices
   * @type {OscEmitter}
   */
  this.serialoscEmitter = null;
};

/**
 * Extend the EventEmitter prototype
 * Provides .on(), .emit(), etc.
 */
util.inherits(SerialOSC, EventEmitter);

/**
 * Begin listening for serialosc messages on host/port
 * Request a list of devices from serialosc
 * Emit 'device:add' and 'device:remove' events
 *
 * The following options can be passed:
 *
 * opts.host -- the hostname to listen on (default: localhost)
 * opts.port -- the port to listen on (default: 4200);
 * opts.serialoscHost -- the hostname serialosc is listening on
 *                       (default localhost)
 * opts.serialoscPort -- the port serialosc is listening on
 *                       (default 12002)
 * 
 * @param {Object} opts options object
 */
SerialOSC.prototype.start = function (opts) {
  opts = opts || {};

  /**
   * The hostname this process listens on
   * default: localhost
   * @type {String}
   */
  this.host = opts.host || 'localhost';

  /**
   * The port number this process listens on
   * default: random port number
   * @type {Number}
   */
  this.port = opts.port || Math.floor(Math.random() * 64512) + 1024;

  /**
   * The hostname serialosc is listening on
   * default: localhost
   * @type {String}
   */
  this.serialoscHost = opts.serialoscHost || 'localhost';

  /**
   * The port serialosc is listening on
   * default: 12002
   * @type {Number}
   */
  this.serialoscPort = opts.serialoscPort || 12002;

  /**
   * Automatically start / initalize devices when discovered
   * default: true
   * @type {Boolean}
   */
  this.startDevices = true;
  if (typeof opts.startDevices != 'undefined') {
    this.startDevices = opts.startDevices;
  }

  if (!this.serialoscEmitter) {
    // create osc emitter to send to serialosc
    this.serialoscEmitter = new OscEmitter();
    // add the serialosc host/port to the emitter broadcast list
    this.serialoscEmitter.add(this.serialoscHost, this.serialoscPort);
  }

  // attach notify handler
  this.serialoscEmitter.emit('/serialosc/notify', this.host, this.port);
  // begin listening on osc receiver
  this.startOSCReceiver();
  // request a list of devices
  this.serialoscEmitter.emit('/serialosc/list', this.host, this.port);
};

SerialOSC.prototype.startOSCReceiver = function () {
  // receiver already active
  if (this.receiver) {
    return;
  }

  // create new instance of OscReceiver
  this.receiver = new OscReceiver();

  // begin listening on the app's serialosc listen host/port
  this.receiver.bind(this.port, this.host);

  // called when serialosc tells us about a device
  // ie. in response to /serialosc/list
  this.receiver.on('/serialosc/device', function () {
    // configure what we know about this device
    var deviceOpts = {
      id: arguments[0],
      model: arguments[1],
      host: this.host,
      deviceHost: this.serialoscHost,
      devicePort: arguments[2]
    };
    // check if we already know about this device
    var device = _.findWhere(this.devices, {
      id: deviceOpts.id,
      devicePort: deviceOpts.devicePort
    });
    // if not, create it, start it, add it to devices array
    if (!device) {
      var encoders = deviceOpts.model.match(/monome arc (\d)/);
      if (encoders) {
        device = new Arc();
        deviceOpts.type = 'arc';
        deviceOpts.encoders = parseInt(encoders[1], 10);
      } else {
        device = new Grid();
        deviceOpts.type = 'grid';
      }
      device.config(deviceOpts);
      this.devices.push(device);
      if (this.startDevices) {
        device.start();
        device.on('initialized', function () {
          this.emit(device.id + ':add', device);
          this.emit('device:add', device);
        }.bind(this));
      } else {
        this.emit(device.id + ':add', device);
        this.emit('device:add', device);
      }
    }
  }.bind(this));

  // when serialosc detects a device has been plugged in
  // send /serialosc/list and handle it from /serialosc/device
  // handler above
  this.receiver.on('/serialosc/add', function () {
    this.serialoscEmitter.emit('/serialosc/list', this.host, this.port);
    // reattach notify handler after every /serialosc/add request
    this.serialoscEmitter.emit('/serialosc/notify', this.host, this.port);
  }.bind(this));

  // when serialosc detects a device has been unplugged
  this.receiver.on('/serialosc/remove', function () {
    var id = arguments[0];
    var devicePort = arguments[2];
    // see if we know about this device (we should)
    var device = _.findWhere(this.devices, {
      id: id,
      devicePort: devicePort
    });
    // if we do, stop it (doesnt actually do much beyond set connected flag)
    // then let listeners know a device was removed
    if (device) {
      device.stop();
      this.emit(device.id + ':remove', device);
      this.emit('device:remove', device);
    }
    // reattach notify handler after every /serialosc/remove request
    this.serialoscEmitter.emit('/serialosc/notify', this.host, this.port);
  }.bind(this));
};

SerialOSC.prototype.stop = function () {
  // receiver not active
  if (!this.receiver) {
    return;
  }

  // remove all listeners and close the socket
  this.receiver.removeAllListeners();
  this.receiver._socket.close();
  this.receiver = null;
  this.devices = [];
};

module.exports = new SerialOSC();
