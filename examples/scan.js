var serialosc = require('../serialosc');
serialosc.start();
serialosc.on('device:add', function (device) {
  console.log('found ' + device.id + ' at ' + device.deviceHost + ':' + device.devicePort);
  if (device.type == 'grid') {
    device.setTilt(0, 1);
    device.setTilt(1, 1);
    console.log('  ' + device.sizeX + 'x' + device.sizeY + ' ' + device.model);
  } else {
    console.log('  ' + device.encoders + ' encoder ' + device.model);
  }
  console.log('  prefix is ' + device.prefix);
  console.log('  rotation is ' + device.rotation);
  device.on('delta', function (data) {
    console.log(device.id + ' delta n:' + data.n + ', d:' + data.d);
  });
  device.on('key', function (data) {
    if (device.type == 'grid') {
      console.log(device.id + ' key x:' + data.x + ', y: ' + data.y + ', s:' + data.s);
    } else {
      console.log(device.id + ' key n:' + data.n + ', s:' + data.s);
    }
  });
  device.on('tilt', function (data) {
    console.log(device.id + ' tilt x:' + data.x + ', y:' + data.y);
  });
  device.on('connected', function () {
    console.log(device.id + ' connected');
  });
  device.on('disconnected', function () {
    console.log(device.id + ' disconnected');
  });
});
