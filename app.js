var _ = require('underscore');
var OscReceiver = require('osc-receiver');
var OscEmitter = require('osc-emitter');
var EventEmitter = require('events').EventEmitter;
var Device = require('./lib/device');

var receiver = new OscReceiver();
var serialoscEmitter = new OscEmitter();

var SerialOSC = function (opts) {
  this.devices = [];
  opts = opts || {};
  this.host = opts.host || 'localhost';
  this.port = opts.port || 4200;
  this.serialoscHost = opts.serialoscHost || 'localhost';
  this.serialoscPort = opts.serialoscPort || 12002;
};

SerialOSC.prototype = Object.create(EventEmitter.prototype);

SerialOSC.prototype.start = function () {

  receiver.bind(this.port, this.host);

  var self = this;

  receiver.on('/serialosc/device', function () {
    var deviceOpts = {
      id: arguments[0],
      type: arguments[1],
      host: self.host,
      deviceHost: self.serialoscHost,
      devicePort: arguments[2]
    };
    var device = _.findWhere(self.devices, {
      id: deviceOpts.id,
      devicePort: deviceOpts.devicePort
    });
    if (!device) {
      device = new Device(deviceOpts);
      self.devices.push(device);
      device.start();
    }
    device.on('connected', function () {
      self.emit('device:add', device);
    });
  });

  receiver.on('/serialosc/add', function () {
    serialoscEmitter.emit('/serialosc/list', self.host, self.port);
    serialoscEmitter.emit('/serialosc/notify', self.host, self.port);
  });

  receiver.on('/serialosc/remove', function () {
    var id = arguments[0];
    var devicePort = arguments[2];
    var device = _.findWhere(self.devices, {
      id: id,
      devicePort: devicePort
    });
    if (device) {
      device.stop();
      self.emit('device:remove', device);
    }
    serialoscEmitter.emit('/serialosc/notify', self.host, self.port);
  });

  serialoscEmitter.add(self.serialoscHost, self.serialoscPort);
  serialoscEmitter.emit('/serialosc/notify', self.host, self.port);
  serialoscEmitter.emit('/serialosc/list', self.host, self.port);
};

module.exports = SerialOSC;
