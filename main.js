"use strict";

let _dtr = console.log;

var vm = new Vue({
  el: "#vue-app",
  data: {
    users: [],
    skyway: {
      mode: {
        item: consts.skyway.mode,
        using: { label: "Mesh", value: "mesh" },
      },
      peer: null,
      call: null,
      room: null,
      stream: null,
      peerId: null,
      callto: null,
      stats: "",
      login_automatically: false,
      ss: null, // screen share
    },
    microphone: {
      device: [],
      using: null,
    },
    speaker: {
      device: [],
      using: null,
    },
    camera: {
      device: [],
      using: null,
    },
    bandwidth: {
      item: consts.bandwidth,
      using: null,
    },
    video: {
      codec: {
        item: consts.video.codec,
        using: null,
      },
      size: {
        item: consts.video.size,
        using: null,
      },
      fps: {
        item: consts.video.fps,
        using: null,
      },
    },
    renderer: {
      item: consts.renderer,
      using: { label: "Cover", value: "cover" }
    },
    layout: {
      item: consts.layout,
      using: { label: "Auto", value: "auto" }
    }
  },
  methods: {
    select_skyway_mode: function (item) {
      _dtr(`select_skyway_mode:${item.label}`)
      this.skyway.mode.using = item;
      this.update_hash()
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

      if (this.skyway.mode.using.value == "p2p") {

        // setup options
        let options = {};
        if (this.video.codec.using) {
          options.videoCodec = this.video.codec.using.value;
        }
        if (this.bandwidth.using) {
          options.videoBandwidth = this.bandwidth.using.value
        }
        _dtr(options);

        // call
        this.skyway.call = this.skyway.peer.call(this.skyway.callto, this.skyway.stream, options);
        _dtr(this.skyway.call);

        this.step4(this.skyway.call);
      }
      else if (this.skyway.mode.using.value == "mesh") {
        let options = { mode: 'mesh', stream: this.skyway.stream };
        if (this.video.codec.using) {
          options.videoCodec = this.video.codec.using.value;
        }
        if (this.bandwidth.using) {
          options.videoBandwidth = this.bandwidth.using.value
        }
        _dtr(options);

        this.skyway.room = this.skyway.peer.joinRoom('mesh_video_' + this.skyway.callto, options);
        _dtr(this.skyway.room);

        this.step3(this.skyway.room);
      }
      else if (this.skyway.mode.using.value == "sfu") {
        let options = { mode: 'sfu', stream: this.skyway.stream };
        _dtr(options);

        this.skyway.room = this.skyway.peer.joinRoom('sfu_video_' + this.skyway.callto, options);
        _dtr(this.skyway.room);

        this.step3(this.skyway.room);
      }

    },
    update_hash: function () {
      let hash = "";
      if (this.is_p2p) {
        hash = `#p2p-${this.skyway.peer.id}`
      }
      else if (this.is_mesh && this.skyway.room) {
        hash = `#mesh-${this.skyway.callto}`
      }
      else if (this.is_sfu && this.skyway.room) {
        hash = `#sfu-${this.skyway.callto}`
      }
      location.hash = hash
    },
    click_video: function (stream) {
      _dtr(`click_video:`)
      _dtr(stream)
      if (this.users.length <= 1) return;
      let users = this.users.filter(user => user.stream.id == stream.id);
      this.users = users.concat(this.users.filter(user => user.stream.id != stream.id))
      this.calc_layout();
    },
    select_codec: function (item) {
      _dtr(`select_codec:${item.label}`)
      console.log(item)
      if (this.video.codec.using == item) {
        this.video.codec.using = null;
      }
      else {
        this.video.codec.using = item;
      }
    },
    select_size: function (item) {
      _dtr(`select_size:${item.label}`)
      console.log(item)
      if (this.video.size.using == item) {
        this.video.size.using = null;
      }
      else {
        this.video.size.using = item;
      }
      this.step1(this.get_constraints());
    },
    select_fps: function (item) {
      _dtr(`select_fps:${item.label}`)
      console.log(item)
      if (this.video.fps.using == item) {
        this.video.fps.using = null;
      }
      else {
        this.video.fps.using = item;
      }
      this.step1(this.get_constraints());
    },
    select_bandwidth: function (item) {
      _dtr(`select_bandwidth:${item.label}`)
      if (this.bandwidth.using == item) {
        this.bandwidth.using = null;
      }
      else {
        this.bandwidth.using = item;
      }
    },
    select_camera: function (device) {
      _dtr(`select_camera:${device.label}`)
      if (this.camera.using == device) {
        this.camera.using = null;
      }
      else {
        this.camera.using = device;
      }
      this.step1(this.get_constraints());
    },
    select_mic: function (device) {
      _dtr(`select_mic:${device.label}`)
      console.log(device);
      if (this.microphone.using == device) {
        this.microphone.using = null;
      }
      else {
        this.microphone.using = device;
      }
      this.step1(this.get_constraints());
    },
    select_spk: function (device) {
      _dtr(`select_spk:${device.label}`)
      console.log(device);
      if (this.speaker.using == device) {
        this.speaker.using = null;
      }
      else {
        this.speaker.using = device;
      }
    },
    select_renderer: function (item) {
      _dtr(`select_renderer:${item.label}`)
      this.renderer.using = item;
    },
    select_layout: function (item) {
      _dtr(`select_layout:${item.label}`)
      this.layout.using = item;
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
    select_screen_share: async function () {
      _dtr(`select_screen_share:`);

      if (this.skyway.ss) {
        _dtr("stop screen share");
        this.skyway.ss.stop();
        this.skyway.ss = null;
        // this.get_streams(this.skyway.peer.id).forEach(stream => stream && stream.getVideoTracks().forEach(track => track.stop()))
        this.get_streams(this.skyway.peer.id).forEach(stream => stream && stream.getTracks().forEach(track => track.stop()))

        this.set_stream(this.skyway.peer.id, new MediaStream(this.skyway.stream.getVideoTracks()));
        if (this.skyway.call) {
          this.skyway.call.replaceStream(this.skyway.stream);
        }
        else if (this.skyway.room) {
          this.skyway.room.replaceStream(this.skyway.stream);
        }
        else {
          _dtr("replace stream error.");
        }
      }
      else {
        this.skyway.ss = ScreenShare.create({ debug: true });
        if (!this.skyway.ss.isScreenShareAvailable()) {
          alert("Screen share is available in Firefox.")
          this.skyway.ss = null;
          return;
        };
        const stream = await this.skyway.ss.start({
          // width:     1600,
          // height:    1200,
          frameRate: 10,
        }).catch(error => {
          alert(error);
          console.log(error);
          this.skyway.ss = null;
          return;
        });

        _dtr(stream)

        // set screen share stream to self image
        this.set_stream(this.skyway.peer.id, stream);

        // make MediaStream for screen share with self audio
        const ss_with_audio = new MediaStream(stream.getVideoTracks());
        if (this.skyway.stream.getAudioTracks()) ss_with_audio.addTrack(this.skyway.stream.getAudioTracks()[0]);

        if (this.skyway.call) {
          this.skyway.call.replaceStream(ss_with_audio);
        }
        else if (this.skyway.room) {
          this.skyway.room.replaceStream(ss_with_audio);
        }
        else {
          _dtr("replace stream error.");
        }
      }
    },
    calc_layout: function () {
      _dtr(`calc_layout:`)
      if (this.layout.using.value == "pinp") {
        const w = window.innerWidth
        const h = window.innerHeight - $(".navbar").outerHeight()
        const thumbnail_h = h * 0.25;
        const thumbnail_w = thumbnail_h * 16 / 9;
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
              bottom: "0px",
              right: 10 * (index - 1) + thumbnail_w * (index - 1) + "px",
              width: `${thumbnail_w}px`,
              height: `${thumbnail_h}px`,
              position: "absolute",
              zIndex: 2,
            }
          }
          Vue.set(this.users, index, user);
        });
      }
      else if (this.layout.using.value == "grid") {
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
        else if (this.users.length == 2) {
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
      else if (this.layout.using.value == "auto") {
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
        else if (this.users.length == 2) {
          const w = window.innerWidth
          const h = window.innerHeight - $(".navbar").outerHeight()
          const thumbnail_h = h * 0.25;
          const thumbnail_w = thumbnail_h * 16 / 9;
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
                bottom: "0px",
                right: 10 * (index - 1) + thumbnail_w * (index - 1) + "px",
                width: `${thumbnail_w}px`,
                height: `${thumbnail_h}px`,
                position: "absolute",
                zIndex: 2,
              }
            }
            Vue.set(this.users, index, user);
          });
        }
        else if (this.users.length == 3) {
          const ratio = 0.65
          const w = window.innerWidth
          const h = window.innerHeight - $(".navbar").outerHeight()
          let v_t = 0
          let v_l = 0
          let v_w = 0
          let v_h = 0
          let user = null

          v_w = ratio * w
          v_h = h
          user = this.users[0];
          user.style = {
            top: "0px",
            left: "0px",
            width: `${v_w}px`,
            height: `${v_h}px`,
            position: "absolute",
            zIndex: 1,
          }
          Vue.set(this.users, 0, user);

          v_t = 0
          v_l = ratio * w
          v_w = (1.0 - ratio) * w
          v_h = 0.5 * h
          user = this.users[1];
          user.style = {
            top: "0px",
            left: `${v_l}px`,
            width: `${v_w}px`,
            height: `${v_h}px`,
            position: "absolute",
            zIndex: 1,
          }
          Vue.set(this.users, 1, user);

          v_t = 0.5 * h
          v_l = ratio * w
          v_w = (1.0 - ratio) * w
          v_h = 0.5 * h
          user = this.users[2];
          user.style = {
            top: `${v_t}px`,
            left: `${v_l}px`,
            width: `${v_w}px`,
            height: `${v_h}px`,
            position: "absolute",
            zIndex: 1,
          }
          Vue.set(this.users, 2, user);
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
    get_streams: function (peerId) {
      _dtr(`get_streams:${peerId}`)
      return this.users.filter(user => user.peerId == peerId).map(user => user.stream);
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
      if (this.camera.device && this.camera.device.length) {
        const fmt = {};
        if (this.camera.using) {
          fmt.deviceId = this.camera.using.deviceId;
        }
        if (this.video.size.using) {
          fmt.width = this.video.size.using.value.width;
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
      if (this.microphone.device && this.microphone.device.length) {
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
    step1: async function (constraints) {
      _dtr(`step1:`)
      _dtr(constraints)
      if (this.skyway.stream) {
        this.skyway.stream.getTracks().forEach(track => track.stop())
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints).catch(err=> {
        _dtr(err)
        alert(`${err.name}:${err.message}:${err.constraintName}`);
        return
      })

      _dtr(stream)
      stream.getTracks().forEach(console.log)

      this.skyway.stream = stream;
      this.set_stream(this.skyway.peer.id, new MediaStream(stream.getVideoTracks()));

      if (this.skyway.call) {
        this.skyway.call.replaceStream(stream);
      }
      else if (this.skyway.room) {
        this.skyway.room.replaceStream(stream);
      }
      else {
        this.enumrate_media_devices();
      }
    },
    step3: function (room) {
      _dtr(`step3:`)
      _dtr(room)

      this.update_hash()

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
        this.update_hash()
      });
    },
    step4: function (call) {
      _dtr(`step4:${call}`)

      this.update_hash()

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
    enumrate_media_devices: async function () {
      _dtr(`enumrate_media_devices:`)
      let mic_old = this.microphone.using;
      let spk_old = this.speaker.using;
      let cam_old = this.camera.using;
      this.microphone.device = []
      this.microphone.using = null;
      this.speaker.device = []
      this.speaker.using = null;
      this.camera.device = []
      this.camera.using = null;

      const devices = await navigator.mediaDevices.enumerateDevices().catch(err => {
        _dtr(err)
        alert(`${err.name}:${err.message}`);
        return
      })

      for (let i = 0; i !== devices.length; ++i) {
        console.log(devices[i])
        const deviceInfo = devices[i];
        if (deviceInfo.kind === 'audioinput') {
          this.microphone.device.push(deviceInfo)
        } else if (deviceInfo.kind === 'audiooutput') {
          this.speaker.device.push(deviceInfo)
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
      if (spk_old) {
        for (let i = 0; i < this.speaker.device.length; i++) {
          if (spk_old.deviceId == this.speaker.device[i].deviceId) {
            this.speaker.using = this.speaker.device[i];
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
      if (this.skyway.login_automatically) {
        this.skyway.login_automatically = false
        this.call()
      }
    }
  },
  computed: {
    rendererUsers: function () {
      return this.users.filter(user => user.stream);
    },
    styleCover: function () {
      return { "video cover": this.renderer.using.value == "cover" }
    },
    is_online: function () {
      return (this.skyway.call || this.skyway.room) ? true : false;
    },
    is_offline: function () {
      return !this.skyway.call && !this.skyway.room;
    },
    is_p2p: function () {
      return this.skyway.mode.using.value == "p2p";
    },
    is_mesh: function () {
      return this.skyway.mode.using.value == "mesh";
    },
    is_sfu: function () {
      return this.skyway.mode.using.value == "sfu";
    },
    is_codec_selectable: function () {
      return this.skyway.mode.using.value != "sfu" && (!this.skyway.call && !this.skyway.room);
    },
    has_camera: function () {
      return this.camera.device && this.camera.device.length
    },
    has_microphone: function () {
      return this.microphone.device && this.microphone.device.length
    },
    has_speaker: function () {
      return this.speaker.device && this.speaker.device.length
    }
  },
  mounted: function () {
    // check API KEY
    if (!window.hasOwnProperty("__SKYWAY_KEY__") || window.__SKYWAY_KEY__ == "__SKYWAY_KEY__") {
      alert("Please set your API KEY to window.__SKYWAY_KEY__")
      return;
    }

    const hash = location.hash.match(/^#(p2p|mesh|sfu)-([\w-]+)$/)
    if (hash) {
      for (let item of this.skyway.mode.item) {
        if (item.value == hash[1]) {
          this.skyway.mode.using = item
          if (this.is_p2p) {
            this.skyway.peerId = hash[2];
          }
          else if (this.is_mesh || this.is_sfu) {
            this.skyway.callto = hash[2];
            this.skyway.login_automatically = true
          }
          break;
        }
      }
    }

    // Peer object
    const options = {
      key: window.__SKYWAY_KEY__,
      debug: 3,
    }
    if (this.is_p2p && this.skyway.peerId) {
      this.skyway.peer = new Peer(this.skyway.peerId, options)
    }
    else {
      this.skyway.peer = new Peer(options)
    }

    this.skyway.peer.on('open', async (id) => {
      _dtr("peer.on('open'")
      this.update_hash()

      const devices = await navigator.mediaDevices.enumerateDevices().catch(err => {
        _dtr(err)
        alert(`${err.name}:${err.message}`);
        return
      })

      let has_camera = false;
      let has_audio = false;
      devices.forEach(device => {
        if (device.kind === 'audioinput') has_audio = true
        else if (device.kind === 'videoinput') has_camera = true
      })
      if (!has_audio && !has_camera) {
        alert("No audio and camera.")
      }
      else {
        this.step1({ video: has_camera, audio: has_audio })
      }
    })

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

      let options = {};
      if (this.video.codec.using) {
        options.videoCodec = this.video.codec.using.value;
      }
      if (this.bandwidth.using) {
        options.videoBandwidth = this.bandwidth.using.value
      }
      _dtr(options);

      this.skyway.call.answer(this.skyway.stream, options);
      this.step4(this.skyway.call);
    });

  },
  directives: {
    videostream: {
      bind(el, binding) {
        _dtr("bind")
        _dtr(binding)
        if (vm.speaker.using && binding.value.getAudioTracks().length) {
          const setspk = async () => { await el.setSinkId(vm.speaker.using.deviceId) }
          setspk()
        }
        el.srcObject = binding.value
        const play = async () => { await el.play() }
        play();
      },
      update(el, binding) {
        _dtr("update")
        _dtr(binding)
        if (vm.speaker.using && binding.value.getAudioTracks().length) {
          const setspk = async () => { await el.setSinkId(vm.speaker.using.deviceId) }
          setspk()
        }
        if (binding.value !== binding.oldValue) {
          el.srcObject = binding.value
          const play = async () => { await el.play() }
          play()
        }
      }
    }
  },
  watch: {
  },
});

