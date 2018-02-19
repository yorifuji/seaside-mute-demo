"use strict";

let _dtr = console.log;

var vm = new Vue({
  el: "#vue-app",
  computed: {
    rendererUsers: function () {
      return this.users.filter(user => user.stream);
    },
    styleCover: function () {
      return { "video cover": this.renderer.using.value == "cover" }
    },
    disabled_item: function () {
      return this.skyway.call || this.skyway.room ? { disabled: false } : { disabled: true };
    },
    is_online: function () {
      return this.skyway.call || this.skyway.room;
    },
    is_offline: function () {
      return !this.skyway.call && !this.skyway.room;
    },
    is_p2p: function() {
      return this.skyway.conn_type.using.value == "p2p";
    },
    is_mesh: function() {
      return this.skyway.conn_type.using.value == "mesh";
    },
    is_sfu: function() {
      return this.skyway.conn_type.using.value == "sfu";
    },
    is_codec_selectable: function () {
      return this.skyway.conn_type.using.value != "sfu" && (!this.skyway.call && !this.skyway.room);
    },
  },
  methods: {
    _dbg_trace_users: function () {
      this.users.forEach(user => console.log(user.peerId))
    },
    select_skyway_conntype: function (mode) {
      _dtr(`select_skyway_conntype:${mode.label}`)
      this.skyway.conn_type.using = mode;
    },
    call: function () {
      _dtr(`call:`)
      // disconnect
      if (this.skyway.call) {
        this.skyway.call.close();
        this.skyway.call = null;
        return;
      }
      else if (this.skyway.room) {
        this.skyway.room.close();
        this.skyway.room = null;
        return;
      }
    
      if (this.skyway.conn_type.using.value == "p2p") {

        // setup params
        let params = {};
        if (this.video.codec.using) {
          params.videoCodec = this.video.codec.using.value;
        }
        _dtr(params);

        // call
        this.skyway.call = this.skyway.peer.call(this.skyway.callto, this.skyway.stream, params);
        _dtr(this.skyway.call);

        this.step4(this.skyway.call);
      }
      else if (this.skyway.conn_type.using.value == "mesh") {
        let options = { mode: 'mesh', stream: this.skyway.stream };
        if (this.video.codec.using) {
          options.videoCodec = this.video.codec.using.value;
        }
        _dtr(options);

        this.skyway.room = this.skyway.peer.joinRoom('mesh_video_' + this.skyway.callto, options);
        _dtr(this.skyway.room);

        this.step3(this.skyway.room);
      }
      else if (this.skyway.conn_type.using.value == "sfu") {
        let options = { mode: 'sfu', stream: this.skyway.stream };
        _dtr(options);

        this.skyway.room = this.skyway.peer.joinRoom('sfu_video_' + this.skyway.callto, options);
        _dtr(this.skyway.room);

        this.step3(this.skyway.room);
      }
    },
    click_video: function (stream) {
      _dtr(`click_video:`)
      _dtr(stream)
      if (this.users.length <= 1) return;
      let users = this.users.filter(user => user.stream.id == stream.id);
      for (let i = 0; i < this.users.length; i++) {
        if (this.users[i].stream.id != stream.id) {
          users.push(this.users[i]);
        }
      }
      this.users = users;
      this.calc_layout();
    },
    select_codec: function (mode) {
      _dtr(`select_codec:${mode.label}`)
      console.log(mode)
      if (this.video.codec.using == mode) {
        this.video.codec.using = null;
      }
      else {
        this.video.codec.using = mode;
      }
    },
    select_size: function (mode) {
      _dtr(`select_size:${mode.label}`)
      console.log(mode)
      if (this.video.size.using == mode) {
        this.video.size.using = null;
      }
      else {
        this.video.size.using = mode;
      }
      this.step1(this.get_constraints());
    },
    select_fps: function (mode) {
      _dtr(`select_fps:${mode.label}`)
      console.log(mode)
      if (this.video.fps.using == mode) {
        this.video.fps.using = null;
      }
      else {
        this.video.fps.using = mode;
      }
      this.step1(this.get_constraints());
    },
    select_camera: function (device) {
      _dtr(`select_camera:${device.label}`)
      this.camera.using = device;
      this.step1(this.get_constraints());
    },
    select_mic: function (device) {
      _dtr(`select_mic:${device.label}`)
      console.log(device);
      this.microphone.using = device;
      this.step1(this.get_constraints());
    },
    select_renderer: function (mode) {
      _dtr(`select_renderer:${mode.label}`)
      this.renderer.using = mode;
    },
    select_layout: function (mode) {
      _dtr(`select_layout:${mode.label}`)
      this.layout.using = mode;
      this.calc_layout();
    },
    select_stats: function () {
      _dtr(`select_stats:`)
      if (this.skyway.stats) {
        clearInterval(window.timer_stats);
        this.skyway.stats = null;
      }
      else {
        window.timer_stats = setInterval(() => {
          if (this.skyway.call) getRTCStats(this.skyway.call._negotiator._pc.getStats());
        }, 2000);
      }
    },
    calc_layout: function () {
      _dtr(`calc_layout:`)
      if (this.layout.using.value == "pinp") {
        this.users.forEach((user, index) => {
          if (index == 0) {
            user.style = {
              top: "0px",
              left: "0px",
              width: "100%",
              height: "100%",
              position: "absolute",
              zIndex: 1,
            }
          }
          else {
            user.style = {
              bottom: "10px",
              right: 10 * index + 200 * (index - 1) + "px",
              width: "200px",
              height: "150px",
              position: "absolute",
              zIndex: 2,
            }
          }
          Vue.set(this.users, index, user);
        });
      }
      else {
        if (this.users.length == 1) {
          let user = this.users[0];
          user.style = {
            top: "0px",
            left: "0px",
            width: "100%",
            height: "100%",
            position: "absolute",
            zIndex: 1,
          }
          Vue.set(this.users, 0, user);
        }
        if (this.users.length == 2) {
          let user = this.users[0];
          user.style = {
            top: "0px",
            left: "0px",
            width: "50%",
            height: "100%",
            position: "absolute",
            zIndex: 1,
          }
          Vue.set(this.users, 0, user);

          user = this.users[1];
          user.style = {
            top: "0px",
            left: "50%",
            width: "50%",
            height: "100%",
            position: "absolute",
            zIndex: 1,
          }
          Vue.set(this.users, 1, user);
        }
        else if (this.users.length <= 16) {
          let d = 0;
          for (let i = 0; i < 4; i++) {
            if (i * i >= this.users.length) {
              d = i;
              break;
            }
          }
          let y = 0;
          let x = 0;
          for (let i = 0; i < this.users.length; i++) {
            if (i != 0 && i % d == 0) y++;
            x = (i % d);
            let user = this.users[i];
            user.style = {
              top: y * 100 / d + "%",
              left: x * 100 / d + "%",
              width: 100 / d + "%",
              height: 100 / d + "%",
              position: "absolute",
              zIndex: 1,
            }
            Vue.set(this.users, i, user);
          }
        }
      }
    },
    create_user: function (peerId) {
      _dtr(`create_user:${peerId}`)
      return {
        peerId: peerId,
        stream: null,
      }
    },
    set_stream: function (peerId, stream) {
      _dtr(`set_stream:${peerId}`)
      _dtr(stream)
      if (this.users.filter(user => user.peerId == peerId).length == 0) {
        let user = this.create_user(peerId);
        user.stream = stream;
        this.users.unshift(user);
      }
      else {
        this.users.forEach(user => {
          if (user.peerId == peerId) user.stream = stream;
        });
      }
      this.calc_layout();
    },
    remove_stream: function (peerId, stream) {
      _dtr(`remove_stream:${peerId}`)
      _dtr(stream)
      this.users.forEach(user => {
        if (user.peerId == peerId && user.stream == stream) user.stream = null;
      });
      this.calc_layout();
    },
    join_user: function (peerId) {
      _dtr(`join_user:${peerId}`)
      this.users.unshift(this.create_user(peerId));
      this.calc_layout();
    },
    leave_user: function (peerId) {
      _dtr(`leave_user:${peerId}`)
      this.users = this.users.filter(user => user.peerId != peerId);
      this.calc_layout();
    },
    leave_others: function () {
      _dtr(`leave_others:`)
      this.users = this.users.filter(user => user.peerId == this.skyway.peer.id);
      this.calc_layout();
    },
    get_constraints: function () {
      _dtr(`get_constraints:`)
      const ct = { video: false, audio: false };
      if (this.camera.device) {
        const fmt = {};
        if (this.camera.using) {
          fmt.deviceId = this.camera.using.deviceId;
        }
        if (this.video.size.using) {
          fmt.width  = this.video.size.using.value.width;
          fmt.height = this.video.size.using.value.height;
        }
        if (this.video.fps.using) {
          fmt.frameRate = this.video.fps.using.value;
        }
        if (Object.keys(fmt).length) {
          ct.video = fmt;
        }
        else {
          ct.video = true;
        }
      }
      if (this.microphone.device) {
        const fmt = {};
        if (this.microphone.using) {
          fmt.deviceId = this.microphone.using.deviceId;
        }
        if (Object.keys(fmt).length) {
          ct.audio = fmt;
        }
        else {
          ct.audio = true;
        }
      }
      return ct;
    },
    step1: function (constraints) {
      _dtr(`step1:`)
      _dtr(constraints)
      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        _dtr(stream)
        this.skyway.stream = stream;
        this.set_stream(this.skyway.peer.id, stream);

        if (this.skyway.call) {
          this.skyway.call.replaceStream(stream);
        }
        else if (this.skyway.room) {
          this.skyway.room.replaceStream(stream);
        }
        else {
          this.enumrate_media_devices();
        }
      }).catch(err => {
        _dtr(err)
        alert(`${err.name}:${err.message}:${err.constraintName}`);
      });
    },
    step3: function (room) {
      _dtr(`step3:`)
      _dtr(room)
      // Wait for stream on the call, then set peer video display
      room.on('stream', stream => {
        _dtr("room.on('stream'")
        _dtr(stream)
        this.set_stream(stream.peerId, stream);
      });

      room.on('removeStream', stream => {
        _dtr("room.on('removeStream'")
        _dtr(stream)
        this.remove_stream(stream.peerId, stream);
      });

      room.on('peerJoin', peerId => {
        _dtr("room.on('peerJoin'")
        _dtr(peerId)
        this.join_user(peerId);
      })

      room.on('peerLeave', peerId => {
        _dtr("room.on('peerLeave'")
        _dtr(peerId)
        this.leave_user(peerId);
      });

      room.on('close', () => {
        _dtr("room.on('close'")
        this.leave_others();
        this.skyway.room = null;
      });
    },
    step4: function (call) {
      _dtr(`step4:${call}`)
      // Wait for stream on the call, then set peer video display
      call.on('stream', stream => {
        _dtr("call.on('stream'")
        _dtr(stream)
        this.set_stream(this.skyway.call.remoteId, stream);
      });
      call.on('removeStream', stream => {
        _dtr("call.on('removeStream'")
        _dtr(stream)
      });
      call.on('close', () => {
        _dtr("call.on('close'")
        this.leave_user(this.skyway.call.remoteId);
      });
    },
    enumrate_media_devices: function () {
      _dtr(`enumrate_media_devices:`)
      let mic_old = this.microphone.using;
      let cam_old = this.camera.using;
      this.microphone.device = []
      this.microphone.using = null;
      this.camera.device = []
      this.camera.using = null;
      navigator.mediaDevices.enumerateDevices()
        .then(deviceInfos => {
          for (let i = 0; i !== deviceInfos.length; ++i) {
            console.log(deviceInfos[i])
            const deviceInfo = deviceInfos[i];
            if (deviceInfo.kind === 'audioinput') {
              this.microphone.device.push(deviceInfo)
            } else if (deviceInfo.kind === 'videoinput') {
              this.camera.device.push(deviceInfo)
            }
          }
          if (mic_old) {
            for (let i = 0; i < this.microphone.device.length; i++) {
              if (mic_old.deviceId == this.microphone.device[i].deviceId) {
                this.microphone.using = this.microphone.device[i];
              }
            }
          }
          // else {
          //   if (this.microphone.device.length) {
          //     this.microphone.using = this.microphone.device[0];
          //   }
          // }
          if (cam_old) {
            for (let i = 0; i < this.camera.device.length; i++) {
              if (cam_old.deviceId == this.camera.device[i].deviceId) {
                this.camera.using = this.camera.device[i];
              }
            }
          }
          // else {
          //   if (this.camera.device.length) {
          //     this.camera.using = this.camera.device[0];
          //   }
          // }
        })
        .catch(err => {
          _dtr(err)
          alert(`${err.name}:${err.message}`);
        });
    }
  },

  mounted: function () {
    // check API KEY
    if (!window.hasOwnProperty("__SKYWAY_KEY__") || window.__SKYWAY_KEY__ == "__SKYWAY_KEY__") {
      alert("Please set your API KEY to window.__SKYWAY_KEY__")
      return;
    }

    // Peer object
    this.skyway.peer = new Peer({
      key: window.__SKYWAY_KEY__,
      debug: 3,
    });

    this.skyway.peer.on('open', id => {
      _dtr("peer.on('open'")
      this.step1({ video: true, audio: true });
    });

    this.skyway.peer.on('error', err => {
      _dtr("peer.on('error'")
      _dtr(err);
      alert(err.message);
      this.skyway.call = null;
    });

    this.skyway.peer.on('disconnected', id => {
      _dtr("peer.on('disconnected'")
      _dtr(id);
      this.skyway.call = null;
    });

    this.skyway.peer.on('call', call => {
      _dtr("peer.on('call'")
      _dtr(call);

      this.skyway.call = call;

      let params = {};
      if (this.video.codec.using) {
        params.videoCodec = this.video.codec.using.value;
      }
      _dtr(params);

      this.skyway.call.answer(this.skyway.stream, params);
      this.step4(this.skyway.call);
    });
  },
  directives: {
    source: {
      bind(el, binding) {
        el.srcObject = binding.value
        el.play()
      },
      update(el, binding) {
        if (binding.value !== binding.oldValue) {
          el.srcObject = binding.value
          el.play()
        }
      }
    }
  },
  watch: {
    // users: function(users) {

    //     // Vue.nextTick().then(function () {
    //     //   this.apply_streams();
    //     // });

    //     // Vue.nextTick().then(function () {
    //     //     vm.users.forEach( user => {
    //     //     if (document.getElementById(user.peerId)) {
    //     //         document.getElementById(user.peerId).srcObject = user.stream;
    //     //     }
    //     //     })
    //     // })

    //     // Vue.nextTick()
    //     //         .then(function () {
    //     //             document.getElementById("foo").srcObject = vm.stream;
    //     //         })
    // },
    // streams: function(streams) {
    //   Vue.nextTick().then(function () {
    //     vm.streams.forEach( stream => {
    //       if (document.getElementById(stream.id)) {
    //         document.getElementById(stream.id).srcObject = stream.stream;
    //       }
    //     })
    //   })
    // }
  },
  data: {
    users: [],
    skyway: {
      conn_type: {
        mode: [
          { label: "P2P",  value: "p2p"  },
          { label: "Mesh", value: "mesh" },
          { label: "SFU",  value: "sfu"  },
        ],
        using: { label: "Mesh", value: "mesh" },
      },
      peer: null,
      call: null,
      room: null,
      stream: null,
      callto: null,
      stats: "",
    },
    microphone: {
      device: [],
      using: null,
    },
    camera: {
      device: [],
      using: null,
    },
    video: {
      codec: {
        mode: [
          { label: "VP8",  value: "VP8"  },
          { label: "VP9",  value: "VP9"  },
          { label: "H264", value: "H264" },
        ],
        using: null,
      },
      size: {
        mode: [
          { label: "1920 x 1080", value: { width: 1920, height: 1080 } },
          { label: "1280 x 960",  value: { width: 1280, height:  960 } },
          { label: "1280 x 720",  value: { width: 1280, height:  720 } },
          { label: " 960 x 720",  value: { width:  960, height:  720 } },
          { label: " 800 x 600",  value: { width:  800, height:  600 } },
          { label: " 640 x 480",  value: { width:  640, height:  480 } },
          { label: " 320 x 240",  value: { width:  320, height:  240 } },
        ],
        using: null,
      },
      fps: {
        mode: [
          { label: "30 fps", value: 30 },
          { label: "24 fps", value: 24 },
          { label: "20 fps", value: 20 },
          { label: "10 fps", value: 10 },
          { label: " 5 fps", value:  5 },
        ],
        using: null,
      },
    },
    renderer: {
      mode: [
        { label: "Cover",  value: "cover"  },
        { label: "Normal", value: "normal" },
      ],
      using: { label: "Cover", value: "cover" }
    },
    layout: {
      mode: [
        { label: "PinP", value: "pinp" },
        { label: "Grid", value: "grid" },
      ],
      using: { label: "PinP", value: "pinp" }
    }
  },
});

async function getRTCStats(statsObject){

  let trasportArray = [];
  let candidateArray = [];
  let candidatePairArray = [];
  let inboundRTPAudioStreamArray = [];
  let inboundRTPVideoStreamArray = [];
  let outboundRTPAudioStreamArray = [];
  let outboundRTPVideoStreamArray = [];
  let codecArray = [];
  let mediaStreamTrack_local_audioArray = [];
  let mediaStreamTrack_local_videoArray = [];
  let mediaStreamTrack_remote_audioArray = [];
  let mediaStreamTrack_remote_videoArray = [];
  let candidatePairId = '';
  let localCandidateId = '';
  let remoteCandidateId = '';
  let localCandidate = {};
  let remoteCandidate = {};
  let inboundAudioCodec = {};
  let inboundVideoCodec = {};
  let outboundAudioCodec = {};
  let outboundVideoCodec = {};

  let stats = await statsObject;
  stats.forEach(stat => {
      if(stat.id.indexOf('RTCTransport') !== -1){
          trasportArray.push(stat);
      }
      if(stat.id.indexOf('RTCIceCandidatePair') !== -1){
          candidatePairArray.push(stat);
      }
      if(stat.id.indexOf('RTCIceCandidate_') !== -1){
          candidateArray.push(stat);
      }
      if(stat.id.indexOf('RTCInboundRTPAudioStream') !== -1){
          inboundRTPAudioStreamArray.push(stat);
      }
      if(stat.id.indexOf('RTCInboundRTPVideoStream') !== -1){
          inboundRTPVideoStreamArray.push(stat);
      }
      if(stat.id.indexOf('RTCOutboundRTPAudioStream') !== -1){
          outboundRTPAudioStreamArray.push(stat);
      }
      if(stat.id.indexOf('RTCOutboundRTPVideoStream') !== -1){
          outboundRTPVideoStreamArray.push(stat);
      }
      if(stat.id.indexOf('RTCMediaStreamTrack_local_audio') !== -1){
          mediaStreamTrack_local_audioArray.push(stat);
      }
      if(stat.id.indexOf('RTCMediaStreamTrack_local_video') !== -1){
          mediaStreamTrack_local_videoArray.push(stat);
      }
      if(stat.id.indexOf('RTCMediaStreamTrack_remote_audio') !== -1){
          mediaStreamTrack_remote_audioArray.push(stat);
      }
      if(stat.id.indexOf('RTCMediaStreamTrack_remote_video') !== -1){
          mediaStreamTrack_remote_videoArray.push(stat);
      }
      if(stat.id.indexOf('RTCCodec') !== -1){
          codecArray.push(stat);
      }
  });

  trasportArray.forEach(transport => {
      if(transport.dtlsState === 'connected'){
          candidatePairId = transport.selectedCandidatePairId;
      }
  });
  candidatePairArray.forEach(candidatePair => {
      if(candidatePair.state === 'succeeded' && candidatePair.id === candidatePairId){
          localCandidateId = candidatePair.localCandidateId;
          remoteCandidateId = candidatePair.remoteCandidateId;
      }
  });
  candidateArray.forEach(candidate => {
      if(candidate.id === localCandidateId){
          localCandidate = candidate;
      }
      if(candidate.id === remoteCandidateId){
          remoteCandidate = candidate;
      }
  });

  inboundRTPAudioStreamArray.forEach(inboundRTPAudioStream => {
      codecArray.forEach(codec => {
          if(inboundRTPAudioStream.codecId === codec.id){
              inboundAudioCodec = codec;
          }
      });
  });
  inboundRTPVideoStreamArray.forEach(inboundRTPVideoStream => {
      codecArray.forEach(codec => {
          if(inboundRTPVideoStream.codecId === codec.id){
              inboundVideoCodec = codec;
          }
      });
  });
  outboundRTPAudioStreamArray.forEach(outboundRTPAudioStream => {
      codecArray.forEach(codec => {
          if(outboundRTPAudioStream.codecId === codec.id){
              outboundAudioCodec = codec;
          }
      });
  });
  outboundRTPVideoStreamArray.forEach(outboundRTPVideo => {
      codecArray.forEach(codec => {
          if(outboundRTPVideo.codecId === codec.id){
              outboundVideoCodec = codec;
          }
      });
  });

  let text = "";
  text += "Local Candidate\n";
  text += localCandidate.ip + ':' + localCandidate.port + '(' +localCandidate.protocol + ')' + '\ntype:' + localCandidate.candidateType;
  text += '\n'
  text += "Remote Candidate\n";
  text += remoteCandidate.ip + ':' + remoteCandidate.port + '(' +remoteCandidate.protocol + ')' + '\ntype:' + remoteCandidate.candidateType;
  text += '\n'
  text += "Inbound Codec\n";
  text += inboundVideoCodec.mimeType + '\n' + inboundAudioCodec.mimeType;
  text += '\n'
  text += "Outbound Codec\n";
  text += outboundVideoCodec.mimeType + '\n' + outboundAudioCodec.mimeType;
  text += '\n'
  text += "Inbound Audio\n";
  text += 'bytesReceived:' + inboundRTPAudioStreamArray[0].bytesReceived + '\njitter:' + inboundRTPAudioStreamArray[0].jitter + '\nfractionLost:' + inboundRTPAudioStreamArray[0].fractionLost;
  text += '\n'
  text += "Inbound Video\n";
  text += 'bytesReceived:' + inboundRTPVideoStreamArray[0].bytesReceived + '\nfractionLost:' + inboundRTPVideoStreamArray[0].fractionLost;
  text += '\n'
  text += "Outbound Audio\n";
  text += 'bytesReceived:' + outboundRTPAudioStreamArray[0].bytesSent;
  text += '\n'
  text += "Outbound Video\n";
  text += 'bytesReceived:' + outboundRTPVideoStreamArray[0].bytesSent;
  text += '\n'
  text += "Local Audio/Vidoe Track\n";
  text += 'audioLevel:' + mediaStreamTrack_local_audioArray[0].audioLevel + '\nframeHeight:' + mediaStreamTrack_local_videoArray[0].frameHeight + '\nframeWidth:' + mediaStreamTrack_local_videoArray[0].frameWidth + '\nframesSent:' + mediaStreamTrack_local_videoArray[0].framesSent;
  text += '\n'
  text += "Remote Audio/Video Track\n";
  text += 'audioLevel:' + mediaStreamTrack_remote_audioArray[0].audioLevel + '\nframeHeight:' + mediaStreamTrack_remote_videoArray[0].frameHeight + '\nframeWidth:' + mediaStreamTrack_remote_videoArray[0].frameWidth;
  vm.skyway.stats = text;
  console.log(text);
}

