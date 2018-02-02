/* eslint-disable require-jsdoc */
$(function() {
  // // check API KEY
  // if (!window.hasOwnProperty("__SKYWAY_KEY__") || window.__SKYWAY_KEY__ == "__SKYWAY_KEY__") {
  //   alert("Please set your API KEY to window.__SKYWAY_KEY__")
  //   return;
  // }

  // // Peer object
  // const peer = new Peer({
  //   key:   window.__SKYWAY_KEY__,
  //   debug: 3,
  // });

  // let room;
  // peer.on('open', id => {
  //   // Get things started
  //   vm.skyway.peer = peer;
  //   vm.join_user(id);
  //   step1({ video : true, audio : true });
  //   enumrate_media_devices();
  // });

  // peer.on('error', err => {
  //   alert(err.message);
  //   // Return to step 2 if error occurs
  // });

  // let room;

  // function room_close() {
  //   room.close();
  // }

  // function enumrate_media_devices() {
  //   vm.microphone.device = []
  //   vm.microphone.using = null;
  //   vm.camera.device = []
  //   vm.camera.using = null;
  //   navigator.mediaDevices.enumerateDevices()
  //     .then(deviceInfos => {
  //       for (let i = 0; i !== deviceInfos.length; ++i) {
  //         console.log(deviceInfos[i])
  //         const deviceInfo = deviceInfos[i];
  //         if (deviceInfo.kind === 'audioinput') {
  //           vm.microphone.device.push(deviceInfo)
  //         } else if (deviceInfo.kind === 'videoinput') {
  //           vm.camera.device.push(deviceInfo)
  //         }
  //       }
  //       if (vm.microphone.device.length) {
  //         vm.microphone.using = vm.microphone.device[0];
  //       }
  //       if (vm.camera.device.length) {
  //         vm.camera.using = vm.camera.device[0];
  //       }
  //     });
  // }

  // const constraints = {
  //   audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
  //   video: {deviceId: videoSource ? {exact: videoSource} : undefined},
  // };

  // function step1(constraints) {
  //   // Get audio/video stream

  //   navigator.mediaDevices.getUserMedia(constraints).then(stream => {
  //     console.log(stream);
  //     vm.set_stream(peer.id, stream);

  //     if (room) {
  //       room.replaceStream(stream);
  //       return;
  //     }

  //     const roomName = "room1";
  //     room = peer.joinRoom('sfu_video_' + roomName, {mode: 'sfu', stream: stream});
  //     vm.skyway.room = room;
  //     step3(room);

  //   }).catch(err => {
  //     console.error(err);
  //   });
  // }

  // function step3(room) {
  //   // Wait for stream on the call, then set peer video display
  //   room.on('stream', stream => {
  //     console.log(stream);
  //     const peerId = stream.peerId;
  //     vm.set_stream(peerId, stream);
  //   });

  //   room.on('removeStream', stream => {
  //     console.log(stream);
  //     const peerId = stream.peerId;
  //     vm.leave_user(peerId);
  //   });

  //   room.on('peerJoin', peerId => {
  //     console.log(peerId);
  //     vm.join_user(peerId);
  //   })

  //   room.on('peerLeave', peerId => {
  //     console.log(peerId);
  //     vm.leave_user(peerId);
  //   });

  //   room.on('close', () => {
  //   });
  // }
});
