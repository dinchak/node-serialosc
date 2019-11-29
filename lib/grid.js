/**
 * @module node-serialosc
 * @author Tom Dinchak <dinchak@gmail.com>
 */

var util = require('util');
var Device = require('./device');

/**
 * Handler for grid devices
 * @constructor
 */
function Grid(serialosc) {
  this.serialosc = serialosc;
}

/**
 * Extend the Device prototype.
 */
util.inherits(Grid, Device);

/**
 * Remove existing prefix-based listeners
 * Called when the prefix is changed
 */
Grid.prototype.removeListeners = function () {
  this.oscReceiver.removeAllListeners(this.prefix + '/grid/key');
  this.oscReceiver.removeAllListeners(this.prefix + '/tilt');
};

/**
 * Add prefix-based listeners
 * Called when the prefix is changed
 */
Grid.prototype.addListeners = function () {
  var self = this;
  this.oscReceiver.on(this.prefix + '/grid/key', function () {
    // emit key event when /grid/key received
    self.emit('key', {
      x: arguments[0],
      y: arguments[1],
      s: arguments[2]
    });
  });
  this.oscReceiver.on(this.prefix + '/tilt', function () {
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
 * @param {Object} data press data {x: xcoord, y: ycoord, s: state}
 */
Grid.prototype.set = function (data) {
  if (typeof data == 'number') {
    data = {
      x: arguments[0],
      y: arguments[1],
      s: arguments[2]
    };
  }
  this.oscEmitter.emit(
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
Grid.prototype.all = function (s) {
  this.oscEmitter.emit(
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
 * @param  {Number} xOffset x offset of target quad in multiples of 8
 * @param  {Number} yOffset y offset of target quad in multiples of 8
 * @param  {Array}  arr     1 or 2 dimensional array of led values
 */
Grid.prototype.map = function (xOffset, yOffset, arr) {
  var state = [];
  for (var y = 0; y < 8; y++) {
    state[y] = {
      type: 'integer',
      value: 0
    };
    if (typeof arr[y] == 'number') {
      state[y].value = arr[y];
      continue;
    }
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
  this.oscEmitter.emit.apply(this.oscEmitter, args);
};

/**
 * Set a row of leds
 * You can send an optional 4th argument for the 2nd quad bitmask
 * 
 * @param  {Number} xOffset quad offset
 * @param  {Number} y       row number
 * @param  {Number} s       bitmask of first 8 led states
 */
Grid.prototype.row = function (xOffset, y, s) {
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
  this.oscEmitter.emit.apply(this.oscEmitter, args);
};

/**
 * Set a column of leds
 * You can send an optional 4th argument for the 2nd quad bitmask
 * 
 * @param  {Number} x       column number
 * @param  {Number} yOffset quad offset
 * @param  {Number} s       bitmask of first 8 led states
 */
Grid.prototype.col = function (x, yOffset, s) {
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
  this.oscEmitter.emit.apply(this.oscEmitter, args);
};

/**
 * Sets the grid led intensity
 * 
 * @param  {Number} i  intensity level (0-15)
 */
Grid.prototype.intensity = function (i) {
  var args = [
    this.prefix + '/grid/led/intensity',
    {
      type: 'integer',
      value: i
    }
  ];
  this.oscEmitter.emit.apply(this.oscEmitter, args);
};

/**
 * Sets a single led's intensity
 * Can be called two ways:
 *
 * set(x, y, l);
 * set({x: x, y: y, i: l});
 * 
 * @param  {Object} data  press data
 */
Grid.prototype.levelSet = function (data) {
  if (typeof data == 'number') {
    data = {
      x: arguments[0],
      y: arguments[1],
      l: arguments[2]
    };
  }
  this.oscEmitter.emit(
    this.prefix + '/grid/led/level/set',
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
      value: data.l
    }
  );
};

/**
 * Set all of device's led intensity levels to l
 * @param  {Number} l  intensity level
 */
Grid.prototype.levelAll = function (l) {
  this.oscEmitter.emit(
    this.prefix + '/grid/led/level/all',
    {
      type: 'integer',
      value: l
    }
  );
};

/**
 * Update the intensity of an 8x8 quad of leds, example:
 *
 * map(0, 0, [
 *   15, 15, 15, 15, 15, 15, 15, 15,
 *   15, 15, 15, 15, 15, 15, 15, 15,
 *   15, 15, 15, 15, 15, 15, 15, 15,
 *   15, 15, 15, 15, 15, 15, 15, 15,
 *   15, 15, 15, 15, 15, 15, 15, 15,
 *   15, 15, 15, 15, 15, 15, 15, 15,
 *   15, 15, 15, 15, 15, 15, 15, 15,
 *   15, 15, 15, 15, 15, 15, 15, 15
 * ]);
 *
 * or
 *
 * map(0, 0, [
 *   [ 15, 15, 15, 15, 15, 15, 15, 15 ],
 *   [ 15, 15, 15, 15, 15, 15, 15, 15 ],
 *   [ 15, 15, 15, 15, 15, 15, 15, 15 ],
 *   [ 15, 15, 15, 15, 15, 15, 15, 15 ],
 *   [ 15, 15, 15, 15, 15, 15, 15, 15 ],
 *   [ 15, 15, 15, 15, 15, 15, 15, 15 ],
 *   [ 15, 15, 15, 15, 15, 15, 15, 15 ],
 *   [ 15, 15, 15, 15, 15, 15, 15, 15 ]
 * ]);
 *
 * @param  {Number} xOffset x offset of target quad in multiples of 8
 * @param  {Number} yOffset y offset of target quad in multiples of 8
 * @param  {Array}  arr     array of 64 led level values (0-15)
 */
Grid.prototype.levelMap = function (xOffset, yOffset, arr) {
  var args = [
    this.prefix + '/grid/led/level/map',
    {
      type: 'integer',
      value: xOffset
    },
    {
      type: 'integer',
      value: yOffset
    }
  ];
  for (var i = 0; i < arr.length; i++) {
    if (typeof arr[i] == 'number') {
      args.push({
        type: 'integer',
        value: arr[i]
      });
      continue;
    }
    for (var x = 0; x < arr[i].length; x++) {
      args.push({
        type: 'integer',
        value: arr[i][x]
      });
    }
  }
  this.oscEmitter.emit.apply(this.oscEmitter, args);
};

/**
 * Set a row of led levels
 * You can send an optional 4th argument for the 2nd quad bitmask
 * 
 * @param  {Number} xOffset quad offset
 * @param  {Number} y       row number
 * @param  {Array}  levels  array of led levels
 */
Grid.prototype.levelRow = function (xOffset, y, levels) {
  var args = [
    this.prefix + '/grid/led/level/row',
    {
      type: 'integer',
      value: xOffset
    },
    {
      type: 'integer',
      value: y
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
 * Set a column of leds
 * You can send an optional 4th argument for the 2nd quad bitmask
 * 
 * @param  {Number} x       column number
 * @param  {Number} yOffset quad offset
 * @param  {Number} levels  array of led levels
 */
Grid.prototype.levelCol = function (x, yOffset, levels) {
  var args = [
    this.prefix + '/grid/led/level/col',
    {
      type: 'integer',
      value: x
    },
    {
      type: 'integer',
      value: yOffset
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
 * Enables or disables tilt sensor n
 * @param  {Number} n sensor number
 * @param  {Number} s 0 to disable, 1 to enable
 */
Grid.prototype.setTilt = function (n, s) {
  var args = [
    this.prefix + '/tilt/set',
    {
      type: 'integer',
      value: n
    },
    {
      type: 'integer',
      value: s
    }
  ];
  this.oscEmitter.emit.apply(this.oscEmitter, args);
};

module.exports = Grid;
