/* eslint-disable require-jsdoc */
$(function() {
  // check API KEY
  if (!window.hasOwnProperty("__SKYWAY_KEY__") || window.__SKYWAY_KEY__ == "__SKYWAY_KEY__") {
    alert("Please set your API KEY to window.__SKYWAY_KEY__")
    return;
  }

  // Peer object
  const peer = new Peer({
    key:   window.__SKYWAY_KEY__,
    debug: 3,
  });

  let localStream;
  let room;
  peer.on('open', id => {
    $('#my-id').text(peer.id);
    // Get things started
    vm.join_user(id);
    vm.add_peer(id);
    step1();
  });

  peer.on('error', err => {
    alert(err.message);
    // Return to step 2 if error occurs
  });

  function make_call(roomName) {
    room = peer.joinRoom('sfu_video_' + roomName, {mode: 'sfu', stream: localStream});
  }

  function room_close() {
    room.close();
  }

  // set up audio and video input selectors
  const audioSelect = $('#audioSource');
  const videoSelect = $('#videoSource');
  const selectors = [audioSelect, videoSelect];

  navigator.mediaDevices.enumerateDevices()
    .then(deviceInfos => {
	    for (let i = 0; i !== deviceInfos.length; ++i) {
	      console.log(deviceInfos[i])
        const deviceInfo = deviceInfos[i];
        if (deviceInfo.kind === 'audioinput') {
          vm.microphone.device.push(deviceInfo)
        } else if (deviceInfo.kind === 'videoinput') {
          vm.camera.device.push(deviceInfo)
        }
      }
    });

  function step1() {
    // Get audio/video stream

    // const audioSource = $('#audioSource').val();
    // const videoSource = $('#videoSource').val();
    // const constraints = {
    //   audio: {deviceId: audioSource ? {exact: audioSource} : undefined},
    //   video: {deviceId: videoSource ? {exact: videoSource} : undefined},
    // };

    const constraints = { video : true, audio : true };
    navigator.mediaDevices.getUserMedia(constraints).then(stream => {
      console.log(stream);

      localStream = stream;
      vm.set_stream(peer.id, stream);
      vm.add_stream(peer.id, stream);

      if (room) {
        room.replaceStream(stream);
        return;
      }

      const roomName = "room1";
      room = peer.joinRoom('sfu_video_' + roomName, {mode: 'sfu', stream: localStream});
      step3(room);

    }).catch(err => {
      console.error(err);
    });
  }

  function step3(room) {
    // Wait for stream on the call, then set peer video display
    room.on('stream', stream => {
      console.log(stream);
      const peerId = stream.peerId;
      vm.set_stream(peerId, stream);
      vm.add_stream(peerId, stream);
    });

    room.on('removeStream', stream => {
      const peerId = stream.peerId;
      vm.leave_user(peerId);
      vm.del_stream(peerId);
    });

    room.on('peerJoin', peerId => {
      vm.join_user(peerId);
    })

    room.on('peerLeave', peerId => {
      vm.leave_user(peerId);
      vm.del_peer(peerId);
    });

    room.on('close', () => {
    });
  }
});
