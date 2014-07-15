var SerialOSC = require('./index');

var serialosc = new SerialOSC();
serialosc.start();
serialosc.on('device:add', function (device) {
  console.log('found ' + device.id + ' at ' + device.deviceHost + ':' + device.devicePort);
  console.log('  a ' + device.sizeX + 'x' + device.sizeY + ' ' + device.type + ' grid');
  console.log('  prefix is ' + device.prefix);
  console.log('  rotation is ' + device.rotation);
});
setTimeout(function () {
  process.exit();
}, 250);
