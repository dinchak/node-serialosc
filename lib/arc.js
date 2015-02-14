/**
 * @module node-serialosc
 * @author Tom Dinchak <dinchak@gmail.com>
 */

var Device = require('./device');

/**
 * Handler for arc devices
 * @constructor
 */
function Arc() {}

Arc.prototype = new Device();

/**
 * Remove existing prefix-based listeners
 * Called when the prefix is changed
 */
Arc.prototype.removeListeners = function () {
  this.oscReceiver.removeAllListeners(this.prefix + '/enc/key');
  this.oscReceiver.removeAllListeners(this.prefix + '/enc/delta');
};

/**
 * Add prefix-based listeners
 * Called when the prefix is changed
 */
Arc.prototype.addListeners = function () {
  var self = this;
  this.oscReceiver.on(this.prefix + '/enc/key', function () {
    // emit key event when /grid/key received
    self.emit('key', {
      n: arguments[0],
      s: arguments[1]
    });
  });
  this.oscReceiver.on(this.prefix + '/enc/delta', function () {
    // emit tilt event when /tilt received
    self.emit('delta', {
      n: arguments[0],
      d: arguments[1]
    });
  });
};

/**
 * Set one led, data format is:
 * {n: encoder number, x: led number, l: led level}
 * @param {Object} data {n: encoder, x: led, l: level}
 */
Arc.prototype.set = function (data) {
  if (typeof data == 'number') {
    data = {
      n: arguments[0],
      x: arguments[1],
      l: arguments[2]
    };
  }
  this.oscEmitter.emit(
    this.prefix + '/ring/set',
    {
      type: 'integer',
      value: data.n
    },
    {
      type: 'integer',
      value: data.x
    },
    {
      type: 'integer',
      value: data.l
    }
  );
};

/**
 * Set all leds on encoder n to level l
 * @param  {Number} n encoder
 * @param  {Number} l level
 */
Arc.prototype.all = function (n, l) {
  this.oscEmitter.emit(
    this.prefix + '/ring/all',
    {
      type: 'integer',
      value: n
    },
    {
      type: 'integer',
      value: l
    }
  );
};

/**
 * Set leds on encoder n to levels array
 * @param  {Number} n      encoder
 * @param  {Number} levels array of 64 led levels
 */
Arc.prototype.map = function (n, levels) {
  var args = [
    this.prefix + '/ring/map',
    {
      type: 'integer',
      value: n
    }
  ];
  for (var i = 0; i < levels.length; i++) {
    args.push({
      type: 'integer',
      value: levels[i]
    });
  }
  this.oscEmitter.emit.apply(this.oscEmitter, args);
};

/**
 * Sets leds x1 through x2 to level l on encoder n
 * @param  {Number} n  encoder
 * @param  {Number} x1 start led
 * @param  {Number} x2 end led
 * @param  {Number} l  level
 */
Arc.prototype.range = function (n, x1, x2, l) {
  this.oscEmitter.emit(
    this.prefix + '/ring/range',
    {
      type: 'integer',
      value: n
    },
    {
      type: 'integer',
      value: x1
    },
    {
      type: 'integer',
      value: x2
    },
    {
      type: 'integer',
      value: l
    }
  );
};

module.exports = Arc;
