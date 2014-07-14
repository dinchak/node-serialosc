var SerialOSC = require('./app');

var serialosc = new SerialOSC();
serialosc.start();
serialosc.on('device:add', function (device) {
  device.all(0);
  console.log(device);
  device.on('key', function (data) {
    device.set(data);
  });
});
