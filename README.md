node-serialosc
==============

monome serialosc node interface

example

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
