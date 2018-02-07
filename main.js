
let _dtr = console.log;

var vm = new Vue({
  el: "#vue-app",
  computed: {
    rendererUsers: function () {
      return this.users.filter(user => user.stream);
    },
    styleCover: function () {
      return { "video cover": this.renderer.using == "cover" }
    },
    disabled_item: function () {
      return this.skyway.call || this.skyway.room ? { disabled: true } : { disabled: false };
    },
    is_online: function () {
      return this.skyway.call || this.skyway.room;
    },
    is_p2p: function() {
      return this.skyway.conn_type.using == "p2p";
    },
  },
  methods: {
    _dbg_trace_users: function () {
      this.users.forEach(user => console.log(user.peerId))
    },
    select_skyway_conntype: function (conn_type) {
      this.skyway.conn_type.using = conn_type.value;
    },
    call: function () {

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
    
      if (this.skyway.conn_type.using == "p2p") {

        // setup params
        let params = {};
        if (this.video.codec.using) {
          this.video.codec.mode.forEach(mode => {
            if (mode.value == this.video.codec.using) params.videoCodec = mode.value;
          });
        }
        _dtr(params);

        // call
        this.skyway.call = this.skyway.peer.call(this.skyway.callto, this.skyway.stream, params);
        _dtr(this.skyway.call);

        this.step4(this.skyway.call);
      }
      else if (this.skyway.conn_type.using == "mesh") {
        let options = { mode: 'mesh', stream: this.skyway.stream };
        if (this.video.codec.using) {
          this.video.codec.mode.forEach(mode => {
            if (mode.value == this.video.codec.using) options.videoCodec = mode.value;
          });
        }
        _dtr(options);

        this.skyway.room = this.skyway.peer.joinRoom('mesh_video_' + this.skyway.callto, options);
        _dtr(this.skyway.room);

        this.step3(this.skyway.room);
      }
      else if (this.skyway.conn_type.using == "sfu") {
        let options = { mode: 'sfu', stream: this.skyway.stream };
        _dtr(options);

        this.skyway.room = this.skyway.peer.joinRoom('sfu_video_' + this.skyway.callto, options);
        _dtr(this.skyway.room);

        this.step3(this.skyway.room);
      }
    },
    click_video: function (peerId) {
      if (this.users.length <= 1) return;
      let users = this.users.filter(user => user.peerId == peerId);
      for (i = 0; i < this.users.length; i++) {
        if (this.users[i].peerId != peerId) {
          users.push(this.users[i]);
        }
      }
      this.users = users;
      this.calc_layout();
    },
    select_codec: function (mode) {
      console.log(mode)
      for (i = 0; i < this.video.codec.mode.length; i++) {
        if (this.video.codec.mode[i].label == mode.label) {
          this.video.codec.using = this.video.codec.mode[i];
          break;
        }
      }
      this.step1(this.retrive_constraints());
    },
    select_size: function (mode) {
      console.log(mode)
      for (i = 0; i < this.video.size.mode.length; i++) {
        if (this.video.size.mode[i].label == mode.label) {
          this.video.size.using = this.video.size.mode[i];
          break;
        }
      }
      this.step1(this.retrive_constraints());
    },
    select_fps: function (mode) {
      console.log(mode)
      for (i = 0; i < this.video.fps.mode.length; i++) {
        if (this.video.fps.mode[i].label == mode.label) {
          this.video.fps.using = this.video.fps.mode[i];
          break;
        }
      }
      this.step1(this.retrive_constraints());
    },
    select_camera: function (device) {
      console.log(device)
      this.camera.using = device;
      this.step1(this.retrive_constraints());
    },
    select_mic: function (device) {
      console.log(device);
      this.microphone.using = device;
      this.step1(this.retrive_constraints());
    },
    select_renderer: function (mode) {
      this.renderer.using = mode;
    },
    select_layout: function (mode) {
      this.layout.using = mode;
      this.calc_layout();
    },
    calc_layout: function () {
      if (this.layout.using == "pinp") {
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
          user = this.users[0];
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
          user = this.users[0];
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
          for (i = 0; i < 4; i++) {
            if (i * i >= this.users.length) {
              d = i;
              break;
            }
          }
          y = 0;
          x = 0;
          for (i = 0; i < this.users.length; i++) {
            if (i != 0 && i % d == 0) y++;
            x = (i % d);
            user = this.users[i];
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
      return {
        peerId: peerId,
        stream: null,
      }
    },
    set_stream: function (peerId, stream) {
      if (this.users.filter(user => user.peerId == peerId).length == 0) {
        let user = this.create_user(peerId);
        user.stream = stream;
        this.users.push(user);
      }
      else {
        this.users.forEach(user => {
          if (user.peerId == peerId) user.stream = stream;
        });
      }
      this.calc_layout();
    },
    remove_stream: function (peerId, stream) {
      this.users.forEach(user => {
        if (user.peerId == peerId && user.stream == stream) user.stream = null;
      });
      this.calc_layout();
    },
    join_user: function (peerId) {
      this.users.push(this.create_user(peerId));
      this.calc_layout();
    },
    leave_user: function (peerId) {
      this.users = this.users.filter(user => user.peerId != peerId);
      this.calc_layout();
    },
    leave_others: function () {
      this.users = this.users.filter(user => user.peerId == this.skyway.peer.id);
      this.calc_layout();
    },
    retrive_constraints: function () {
      if (!this.video.size.using && !this.video.size.using) {
        return {
          video: true,
          audio: true
        }
      }
      let fmt = {
        video: { deviceId: this.camera.using ? this.camera.using.deviceId : true },
        audio: { deviceId: this.microphone.using ? this.microphone.using.deviceId : true },
      }
      if (this.video.size.using) {
        fmt.width = {
          min: this.video.size.using.value.width,
          max: this.video.size.using.value.width,
        }
        fmt.height = {
          min: this.video.size.using.value.height,
          max: this.video.size.using.value.height,
        }
      }
      // if (this.video.fps.using) {
      //   fmt.frameRate = {
      //     min: this.video.fps.using.value,
      //     max: this.video.fps.using.value,
      //   }
      // }
      return {
        video: fmt,
        audio: true
      };
    },
    step1: function (constraints) {
      console.log(constraints)
      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        console.log(stream);
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
        console.error(err);
      });
    },
    step3: function (room) {
      // Wait for stream on the call, then set peer video display
      room.on('stream', stream => {
        console.log(stream);
        this.set_stream(stream.peerId, stream);
      });

      room.on('removeStream', stream => {
        console.log(stream);
        this.remove_stream(stream.peerId, stream);
      });

      room.on('peerJoin', peerId => {
        console.log(peerId);
        this.join_user(peerId);
      })

      room.on('peerLeave', peerId => {
        console.log(peerId);
        this.leave_user(peerId);
      });

      room.on('close', () => {
        this.leave_others();
        this.skyway.room = null;
      });
    },
    step4: function (call) {
      // Wait for stream on the call, then set peer video display
      call.on('stream', stream => {
        console.log(stream);
        this.set_stream(this.skyway.call.remoteId, stream);
      });
      call.on('close', () => {
        this.leave_user(this.skyway.call.remoteId);
      });
    },
    enumrate_media_devices: function () {
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
          if (this.microphone.device.length) {
            this.microphone.using = this.microphone.device[0];
          }
          if (this.camera.device.length) {
            this.camera.using = this.camera.device[0];
          }
        })
        .catch(alert);
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
      // this.join_user(id);
      this.step1({ video: true, audio: true });
    });

    this.skyway.peer.on('error', err => {
      alert(err.message);
      // Return to step 2 if error occurs
    });

    this.skyway.peer.on('call', call => {

      this.skyway.call = call;

      let params = {};
      if (this.video.codec.using) {
        this.video.codec.mode.forEach(mode => {
          if (mode.value == this.video.codec.using) params.videoCodec = mode.value;
        });
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
      },
      update(el, binding) {
        if (binding.value !== binding.oldValue) {
          el.srcObject = binding.value
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
        using: "p2p",
      },
      peer: null,
      call: null,
      room: null,
      stream: null,
      callto: null,
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
          { label: "VP8",  value: "VP8" },
          { label: "VP9",  value: "VP9" },
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
      using: "cover",
    },
    layout: {
      mode: [
        { label: "PinP", value: "pinp" },
        { label: "Grid", value: "grid" },
      ],
      using: "pinp",
    }
  },
});

