node-serialosc
==============

monome serialosc node interface

# simple example

```javascript
var SerialOSC = require('./app');
var serialosc = new SerialOSC();
serialosc.start();
serialosc.on('device:add', function (device) {
  device.on('key', function (data) {
    device.set(data);
  });
});
```
# configuration

you can pass configuration options to the SerialOSC constructor

```javascript
var serialosc = new SerialOSC({
  host: 'localhost',
  port: 4200,
  serialoscHost: 'locahost',
  serialoscPort: 12002
});
```

# events

you can listen for device:add or device:remove events

```javascript
serialosc.on('device:add', function (device) {
});

serialosc.on('device:remove', function (device) {
});
```

# devices

devices are passed through device:add events, you can also access an array of devices at serialosc.devices

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

you can listen for key events from devices, the press object has x, y, and s attributes


```javascript
device.on('key', function (press) {
  
});
```

you can send set, col, row, all, and map commands to a device


```javascript
device.set(4, 6, 1);
// alternate set syntax
device.set({ x: 4, y: 6, s: 1 });
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
