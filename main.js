"use strict";

// debug trace
const startup_date = Date.now();
const dtr = (...params) => console.log(`TRACE:${Date.now() - startup_date}:`, params)
dtr("debug", "trace", 1,2,3,4,new Date, "test");

var vm = new Vue({
  el: "#vue-app",
  data: {
    users: [],    // everyone
    stream: null, // myself
    skyway: {
      mode: {
        item: consts.skyway.mode,
        using: { label: "Mesh", value: "mesh" },
      },
      peer: null,
      call: null,
      room: null,
      peerId: null,
      callto: null,
      stats: "",
      screenshare: null,
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
      dtr(`select_skyway_mode:${item.label}`)
      this.skyway.mode.using = item;
      this.update_hash()
    },
    call: function () {
      dtr(`call:`)
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
        const options = {};
        if (this.video.codec.using) {
          options.videoCodec = this.video.codec.using.value;
        }
        if (this.bandwidth.using) {
          options.videoBandwidth = this.bandwidth.using.value
        }
        dtr(options);

        // call
        this.skyway.call = this.skyway.peer.call(this.skyway.callto, this.stream, options);
        dtr(this.skyway.call);

        this.step4(this.skyway.call);
      }
      else if (this.skyway.mode.using.value == "mesh") {
        const options = { mode: 'mesh', stream: this.stream };
        if (this.video.codec.using) {
          options.videoCodec = this.video.codec.using.value;
        }
        if (this.bandwidth.using) {
          options.videoBandwidth = this.bandwidth.using.value
        }
        dtr(options);

        this.skyway.room = this.skyway.peer.joinRoom('mesh_video_' + this.skyway.callto, options);
        dtr(this.skyway.room);

        this.step3(this.skyway.room);
      }
      else if (this.skyway.mode.using.value == "sfu") {
        const options = { mode: 'sfu', stream: this.stream };
        dtr(options);

        this.skyway.room = this.skyway.peer.joinRoom('sfu_video_' + this.skyway.callto, options);
        dtr(this.skyway.room);

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
      dtr(`click_video:`)
      dtr(stream)
      if (this.users.length <= 1) return;
      const users = this.users.filter(user => user.stream && user.stream.id == stream.id);
      this.users = users.concat(this.users.filter(user => !user.stream || user.stream.id != stream.id))
      this.calc_layout();
    },
    select_codec: function (item) {
      dtr(`select_codec:${item.label}`)
      dtr(item)
      if (this.video.codec.using == item) {
        this.video.codec.using = null;
      }
      else {
        this.video.codec.using = item;
      }
    },
    select_size: function (item) {
      dtr(`select_size:${item.label}`)
      dtr(item)
      if (this.video.size.using == item) {
        this.video.size.using = null;
      }
      else {
        this.video.size.using = item;
      }
      this.step1(this.get_constraints());
    },
    select_fps: function (item) {
      dtr(`select_fps:${item.label}`)
      dtr(item)
      if (this.video.fps.using == item) {
        this.video.fps.using = null;
      }
      else {
        this.video.fps.using = item;
      }
      this.step1(this.get_constraints());
    },
    select_bandwidth: function (item) {
      dtr(`select_bandwidth:${item.label}`)
      if (this.bandwidth.using == item) {
        this.bandwidth.using = null;
      }
      else {
        this.bandwidth.using = item;
      }
    },
    select_camera: function (device) {
      dtr(`select_camera:${device.label}`)
      if (this.camera.using == device) {
        this.camera.using = null;
      }
      else {
        this.camera.using = device;
      }
      this.step1(this.get_constraints());
    },
    select_mic: function (device) {
      dtr(`select_mic:${device.label}`)
      dtr(device);
      if (this.microphone.using == device) {
        this.microphone.using = null;
      }
      else {
        this.microphone.using = device;
      }
      this.step1(this.get_constraints());
    },
    select_spk: function (device) {
      dtr(`select_spk:${device.label}`)
      dtr(device);
      if (this.speaker.using == device) {
        this.speaker.using = null;
      }
      else {
        this.speaker.using = device;
      }
    },
    select_renderer: function (item) {
      dtr(`select_renderer:${item.label}`)
      this.renderer.using = item;
    },
    select_layout: function (item) {
      dtr(`select_layout:${item.label}`)
      this.layout.using = item;
      this.calc_layout();
    },
    select_stats: function () {
      dtr(`select_stats:`)
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
      dtr(`select_screen_share:`);

      if (this.skyway.screenshare) {
        dtr("stop screen share");
        this.skyway.screenshare.stop();
        this.skyway.screenshare = null;
        // this.get_streams(this.skyway.peer.id).forEach(stream => stream && stream.getVideoTracks().forEach(track => track.stop()))
        this.get_streams(this.skyway.peer.id).forEach(stream => stream && stream.getTracks().forEach(track => track.stop()))

        this.set_stream(this.skyway.peer.id, new MediaStream(this.stream.getVideoTracks()));
        if (this.skyway.call) {
          this.skyway.call.replaceStream(this.stream);
        }
        else if (this.skyway.room) {
          this.skyway.room.replaceStream(this.stream);
        }
        else {
          dtr("replace stream error.");
        }
      }
      else {
        this.skyway.screenshare = ScreenShare.create({ debug: true });
        if (!this.skyway.screenshare.isScreenShareAvailable()) {
          alert("Screen share is available in Firefox.")
          this.skyway.screenshare = null;
          return;
        };
        const stream = await this.skyway.screenshare.start({
          // width:     1600,
          // height:    1200,
          frameRate: 10,
        }).catch(error => {
          alert(error);
          dtr(error);
          this.skyway.screenshare = null;
          return;
        });

        dtr(stream)

        // set screen share stream to self image
        this.set_stream(this.skyway.peer.id, stream);

        // make MediaStream for screen share with self audio
        const ss_with_audio = new MediaStream(stream.getVideoTracks());
        if (this.stream.getAudioTracks()) ss_with_audio.addTrack(this.stream.getAudioTracks()[0]);

        if (this.skyway.call) {
          this.skyway.call.replaceStream(ss_with_audio);
        }
        else if (this.skyway.room) {
          this.skyway.room.replaceStream(ss_with_audio);
        }
        else {
          dtr("replace stream error.");
        }
      }
    },
    calc_layout: function () {
      dtr(`calc_layout:`)
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
          const user = this.users[0];
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
          const user = this.users[0];
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
          const user = this.users[0];
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
      dtr(`create_user:${peerId}`)
      return {
        peerId: peerId,
        stream: null,
      }
    },
    set_stream: function (peerId, stream) {
      dtr(`set_stream:${peerId}`)
      dtr(stream)
      if (this.users.filter(user => user.peerId == peerId).length == 0) {
        const user = this.create_user(peerId);
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
      dtr(`get_streams:${peerId}`)
      return this.users.filter(user => user.peerId == peerId).map(user => user.stream);
    },
    remove_stream: function (peerId, stream) {
      dtr(`remove_stream:${peerId}`)
      dtr(stream)
      this.users.forEach(user => {
        if (user.peerId == peerId && user.stream == stream) user.stream = null;
      });
      this.calc_layout();
    },
    join_user: function (peerId) {
      dtr(`join_user:${peerId}`)
      this.users.unshift(this.create_user(peerId));
      this.calc_layout();
    },
    leave_user: function (peerId) {
      dtr(`leave_user:${peerId}`)
      this.users = this.users.filter(user => user.peerId != peerId);
      this.calc_layout();
    },
    leave_others: function () {
      dtr(`leave_others:`)
      this.users = this.users.filter(user => user.peerId == this.skyway.peer.id);
      this.calc_layout();
    },
    get_constraints: function () {
      dtr(`get_constraints:`)
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
      dtr(`step1:`)
      dtr(constraints)

      // stop stream
      if (this.stream) {
        this.stream.getTracks().forEach(track => track.stop())
      }

      // gUM
      this.stream = await navigator.mediaDevices.getUserMedia(constraints).catch(err => {
        dtr(err)
        alert(`${err.name}:${err.message}:${err.constraintName}`);
        return
      })
      dtr(this.stream)
      this.stream.getTracks().forEach(dtr)

      // set my steram(only video tracks)
      this.set_stream(this.skyway.peer.id, new MediaStream(this.stream.getVideoTracks()));

      // replace stream
      if (this.skyway.call) {
        this.skyway.call.replaceStream(this.stream);
      }
      else if (this.skyway.room) {
        this.skyway.room.replaceStream(this.stream);
      }
    },
    step3: function (room) {
      dtr(`step3:`)
      dtr(room)

      this.update_hash()

      // Wait for stream on the call, then set peer video display
      room.on('stream', stream => {
        dtr("room.on('stream'")
        dtr(stream)
        this.set_stream(stream.peerId, stream);
      });

      room.on('removeStream', stream => {
        dtr("room.on('removeStream'")
        dtr(stream)
        this.remove_stream(stream.peerId, stream);
      });

      room.on('peerJoin', peerId => {
        dtr("room.on('peerJoin'")
        dtr(peerId)
        this.join_user(peerId);
      })

      room.on('peerLeave', peerId => {
        dtr("room.on('peerLeave'")
        dtr(peerId)
        this.leave_user(peerId);
      });

      room.on('close', () => {
        dtr("room.on('close'")
        this.leave_others();
        this.skyway.room = null;
        this.update_hash()
      });
    },
    step4: function (call) {
      dtr(`step4:${call}`)

      this.update_hash()

      // Wait for stream on the call, then set peer video display
      call.on('stream', stream => {
        dtr("call.on('stream'")
        dtr(stream)
        this.set_stream(this.skyway.call.remoteId, stream);
      });
      call.on('removeStream', stream => {
        dtr("call.on('removeStream'")
        dtr(stream)
      });
      call.on('close', () => {
        dtr("call.on('close'")
        this.leave_user(this.skyway.call.remoteId);
      });
    },
    update_devicelist: async function () {
      dtr(`update_devicelist:`)

      const devices = await navigator.mediaDevices.enumerateDevices().catch(err => {
        dtr(err)
        alert(`${err.name}:${err.message}`);
        return
      })

      this.microphone.device = []
      this.speaker.device = []
      this.camera.device = []

      for (let i = 0; i !== devices.length; ++i) {
        dtr(devices[i])
        const deviceInfo = devices[i];
        if (deviceInfo.kind === 'audioinput') {
          this.microphone.device.push(deviceInfo)
        } else if (deviceInfo.kind === 'audiooutput') {
          this.speaker.device.push(deviceInfo)
        } else if (deviceInfo.kind === 'videoinput') {
          this.camera.device.push(deviceInfo)
        }
      }
      if (this.microphone.using) {
        for (let i = 0; i < this.microphone.device.length; i++) {
          if (this.microphone.using.deviceId == this.microphone.device[i].deviceId) break;
        }
        if (i == this.microphone.device.length) this.microphone.using = null;
      }
      if (this.speaker.using) {
        for (let i = 0; i < this.speaker.device.length; i++) {
          if (this.speaker.using.deviceId == this.speaker.device[i].deviceId) break;
        }
        if (i == this.speaker.device.length) this.speaker.using = null; 
      }
      if (this.camera.using) {
        for (let i = 0; i < this.camera.device.length; i++) {
          if (this.camera.using.deviceId == this.camera.device[i].deviceId) break;
        }
        if (i == this.camera.device.length) this.camera.using = null;
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
    dtr(`mounted`)
    // Check API KEY
    if (!window.hasOwnProperty("__SKYWAY_KEY__") || window.__SKYWAY_KEY__ == "__SKYWAY_KEY__") {
      alert("Please set your API KEY to window.__SKYWAY_KEY__")
      return;
    }

    // Check URL
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
          }
          break;
        }
      }
    }

    // Create Peer object
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

    const peer = this.skyway.peer; // alias

    peer.on('open', async (id) => {
      dtr("peer.on('open'")

      // Update location url on browser.
      this.update_hash()

      // Check media device
      await this.update_devicelist();
      if (this.microphone.device.length == 0 && this.camera.device.length == 0) {
        alert("Error, No microphone and camera.")
        return;
      }

      // gUM
      const constraints = { video: false, audio: false };
      if (this.microphone.device.length) constraints.audio = true;
      if (this.camera.device.length) constraints.video = true;
      this.step1(constraints);

      // rescan devices to get details(device name...).
      await this.update_devicelist();

      // call automatically
      if (this.skyway.callto) this.call()
    })

    peer.on('error', err => {
      dtr("peer.on('error'")
      dtr(err);
      alert(err.message);
      this.skyway.call = null;
    });

    peer.on('disconnected', id => {
      dtr("peer.on('disconnected'")
      dtr(id);
      this.skyway.call = null;
    });

    peer.on('call', call => {
      dtr("peer.on('call'")
      dtr(call);

      this.skyway.call = call;

      const options = {};
      if (this.video.codec.using) {
        options.videoCodec = this.video.codec.using.value;
      }
      if (this.bandwidth.using) {
        options.videoBandwidth = this.bandwidth.using.value
      }
      dtr(options);

      this.skyway.call.answer(this.stream, options);
      this.step4(this.skyway.call);
    });

  },
  directives: {
    videostream: {
      bind(el, binding) {
        dtr(`directives:videostream:bind:${binding}`)
        if (vm.speaker.using && binding.value.getAudioTracks().length) {
          const setspk = async () => { await el.setSinkId(vm.speaker.using.deviceId) }
          setspk()
        }
        el.srcObject = binding.value
        const play = async () => { await el.play() }
        play();
      },
      update(el, binding) {
        dtr(`directives:videostream:update:${binding}`)
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

