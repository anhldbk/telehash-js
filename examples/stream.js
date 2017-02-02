var es = require('event-stream'),
  telehash = require('telehash'),
  EventEmitter = require('events').EventEmitter,
  trigger = new EventEmitter(),
  meshA,
  meshB,
  confA = {
    id: {
      "keys": {
        "1a": "akndnx5kbansip6xphxymwckpqkjj26fcm"
      },
      "secrets": {
        "1a": "ksxslm5mmtymnbph7nvxergb7oy3r35u"
      },
      "hashname": "5uegloufcyvnf34jausszmsabbfbcrg6fyxpcqzhddqxeefuapvq"
    }
  },
  confB = {
    id: {
      "keys": {
        "1a": "apkoh54rkobkeela6d62hblhqd7grqd5dm"
      },
      "secrets": {
        "1a": "ljfm3ov42x2fl6gsg6bxiqgtstnxls7r"
      },
      "hashname": "fvifxlr3bsaan2jajo5qqn4au5ldy2ypiweazmuwjtgtg43tirkq"
    }
  };

trigger.on('create-meshA', () => {
  telehash.mesh(confA, (err, mesh) => {
    if (err) {
      return console.log('!> Error in creating mesh A');
    }
    console.log('!> Mesh A created successfully.');
    meshA = mesh;
    trigger.emit('create-meshB');
  });
})

trigger.on('create-meshB', () => {
  telehash.mesh(confB, (err, mesh) => {
    if (err) {
      return console.log('!> Error in creating mesh B');
    }
    console.log('!> Mesh B created successfully.');
    meshB = mesh;
    trigger.emit('connect-meshes');
  });
});

trigger.on('connect-meshes', () => {
  console.log("!> Connecting two meshes (for same-process testing only)...")
  meshA.mesh(meshB)
    .then(
      (success) => {
        console.log('!> Two meshes are connected successfully.');
        trigger.emit('simulate');
      },
      (failed) => {
        console.log('!> Failed to connect two meshes');
      }
    );
});

trigger.on('simulate', () => {
  console.log('!> Simulating...');

  // accept a stream of items
  meshB.stream(function (link, req, accept) {
    var streamBA = accept();
    streamBA.pipe(es.writeArray(function (err, items) {
      console.log('!> Receiving items...');
      console.log(items);
      process.exit(0);
    }));
  })

  // stream objects from A to B
  var streamAB = meshA
    .link(meshB.hashname)
    .stream();
  console.log('!> Sending items...');
  es.readArray([1, 2, true, {
    all: 42
  }]).pipe(streamAB);
});

// start
trigger.emit('create-meshA');
