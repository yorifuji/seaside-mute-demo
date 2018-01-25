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
    step2();
  });

  $('#make-call').on('submit', e => {
    e.preventDefault();
    // Initiate a call!
    const roomName = $('#join-room').val();
    if (!roomName) {
      return;
    }
    room = peer.joinRoom('sfu_video_' + roomName, {mode: 'sfu', stream: localStream});

    $('#room-id').text(roomName);
    step3(room);
  });

  $('#end-call').on('click', () => {
    room.close();
    step2();
  });

  // Retry if getUserMedia fails
  $('#step1-retry').on('click', () => {
    $('#step1-error').hide();
    step1();
  });

  // set up audio and video input selectors
  const audioSelect = $('#audioSource');
  const videoSelect = $('#videoSource');
  const selectors = [audioSelect, videoSelect];

  navigator.mediaDevices.enumerateDevices()
    .then(deviceInfos => {
      const values = selectors.map(select => select.val() || '');
	selectors.forEach(select => {
        const children = select.children(':first');
        while (children.length) {
          select.remove(children);
        }
      });
	for (let i = 0; i !== deviceInfos.length; ++i) {
	    console.log(deviceInfos[i])
        const deviceInfo = deviceInfos[i];
        const option = $('<option>').val(deviceInfo.deviceId);

        if (deviceInfo.kind === 'audioinput') {
          option.text(deviceInfo.label ||
            'Microphone ' + (audioSelect.children().length + 1));
          audioSelect.append(option);
        } else if (deviceInfo.kind === 'videoinput') {
          option.text(deviceInfo.label ||
            'Camera ' + (videoSelect.children().length + 1));
          videoSelect.append(option);
        }
      }

      selectors.forEach((select, selectorIndex) => {
        if (Array.prototype.slice.call(select.children()).some(n => {
          return n.value === values[selectorIndex];
        })) {
          select.val(values[selectorIndex]);
        }
      });

      videoSelect.on('change', step1);
      audioSelect.on('change', step1);
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

      // var video = document.createElement("video")
      // video.setAttribute("id", "video-stream-" + stream.id)
      // video.srcObject = stream
      // video.play()
      // // video.autoplay = true
      // // video.playsinline = true
      // // video.setAttribute("width", window.innerWidth);
      // video.setAttribute("height", window.innerHeight - 100);
      // document.body.insertBefore(video, document.getElementById("container"))

      // console.log(document.getElementById(peer.id))
      // document.getElementById(peer.id).srcObject = stream;

      // $('#my-video').get(0).srcObject = stream;
      localStream = stream;
      vm.set_stream(peer.id, stream);
      vm.add_stream(peer.id, stream);

      if (room) {
        room.replaceStream(stream);
        return;
      }

      // step2();

      const roomName = "room1";
      room = peer.joinRoom('sfu_video_' + roomName, {mode: 'sfu', stream: localStream});
      step3(room);

    }).catch(err => {
      $('#step1-error').show();
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
