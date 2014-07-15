var Device = require('./device');

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
