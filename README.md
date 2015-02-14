node-serialosc
==============

node-serialosc allows easy integration with monome grid and arc devices.  You can install it via npm:

```
npm install serialosc
```

# Simple Example

This example script will listen for devices and attach a key handler that sets the corresponding led:

```javascript
var serialosc = require('serialosc');
serialosc.start();
serialosc.on('device:add', function (device) {
  device.on('key', function (data) {
    device.set(data);
  });
});
```

# Configuration

You can pass configuration options to the start method:

```javascript
serialosc.start({
  host: 'localhost',         // ip/hostname to listen on
  port: 4200,                // port to listen on (default = random port number)
  serialoscHost: 'locahost', // ip/hostname where serialosc is running
  serialoscPort: 12002,      // port where serialosc is running
  startDevices: true         // auto-start devices
});
```

If startDevices is set to false you will need to start the device manually and listen for the initialized event.  This can be helpful if you want to run multiple applications but only initialize certain devices in each application.  For example:

```javascript
serialosc.start({
  startDevices: false
});
serialosc.on('m1000079:add', function (device) {
  device.start();
  device.on('initialized', function () {
    device.on('key', function (data) {
      device.set(data);
    });
  });
});
```

# Events

You can listen for device:add or device:remove events

```javascript
serialosc.on('device:add', function (device) {
});

serialosc.on('device:remove', function (device) {
});
```

You can also listen by device id:

```javascript
serialosc.on('m1000079:add', function (device) {
});

serialosc.on('m1000079:remove', function (device) {
});
```

# Devices

Devices are passed through device:add events.  You can also access an array of devices at serialosc.devices

```javascript
// an example device
{
  id: 'm40h0800',
  type: 'monome 40h',
  host: 'localhost',
  port: 14123,
  deviceHost: 'localhost',
  devicePort: 11109,
  connected: true
}
```

## Grid Devices

Use device.on('key', callback) to listen for key press events.  Press events are objects in the form: 

```
{x: ..., y: ..., s: ...}:
```

Example:

```javascript
device.on('key', function (press) {
  console.log(press); // {x: 1, y: 2, s: 1}
});
```

You can set the LEDs of a grid device using the following methods:

```javascript
device.set(4, 6, 1);
// alternate set syntax
device.set({x: 4, y: 6, s: 1});
device.col(3, 0, 255);
device.row(0, 3, 255);
device.all(1);
device.map(0, 0, [
  255, 255, 255, 255, 255, 255, 255, 255
]);
// alternate map syntax
device.map(0, 0, [
  [0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0],
  [0, 1, 0, 1, 0, 1, 0, 1],
  [1, 0, 1, 0, 1, 0, 1, 0]
]);
```

For varibright devices:

```javascript
device.levelSet(4, 6, 15);
// alternate set syntax
device.levelSet({x: 4, y: 6, l: 15});
device.levelCol(3, 0, [0, 1, 2, 3, 4, 5, 6, 7]);
device.levelRow(0, 3, [0, 1, 2, 3, 4, 5, 6, 7]);
device.levelAll(15);
device.levelMap(0, 0, [
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15
]);
```

## Arc Devices

Use device.on('key', callback) to listen for encoder press events.  Press events are objects in the form:

```
{n: ..., s: ...}:
```

Example:

```javascript
device.on('key', function (press) {
  console.log(press); // {n: 0, s: 1}
});
```

Use device.on('delta', callback) to listen for encoder delta events.  Delta events are objects in the form:

```
{n: ..., d: ...}:
```

Example:

```javascript
device.on('delta', function (delta) {
  console.log(delta); // {n: 0, d: -2}
});
```

You can set the LEDs of an arc device using the following methods:

```javascript
device.set(0, 32, 15);
// alternate set syntax
device.set({n: 0, x: 32, l: 15});
device.range(0, 10, 20, 15);
device.all(0, 15);
device.map(0, [
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15,
  15, 15, 15, 15, 15, 15, 15, 15
]);
```
