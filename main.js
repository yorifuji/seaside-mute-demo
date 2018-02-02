var vm = new Vue({
  el: "#vue-app",
  computed: {
    visible_users: function() {
      return this.users.filter(user => user.stream);
    },
    is_using_cover: function() {
      return { "video cover" : this.video_fill.using == "cover" }
    },
    disabled_item: function() {
      return this.skyway.peer ? {disabled : false} : {disabled : true};
    }
  },
  methods: {
    _dbg_trace_users: function() {
      this.users.forEach(user => console.log(user.peerId))
    },
    click_video: function(peerId) {
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
    select_mic: function(device) {
      console.log(device);
      this.microphone.using = device;
      const constraints = {
        audio: {deviceId: this.microphone.using ? this.microphone.using.deviceId : false},
        video: {deviceId: this.camera.using     ? this.camera.using.deviceId     : false},
      };
      this.step1(constraints);
    },
    select_camera: function(device) {
      console.log(device)
      this.camera.using = device;
      const constraints = {
        audio: {deviceId: this.microphone.using ? this.microphone.using.deviceId : false},
        video: {deviceId: this.camera.using     ? this.camera.using.deviceId     : false},
      };
      this.step1(constraints);
    },
    select_video_fill: function(mode) {
      this.video_fill.using = mode;
    },
    select_video_layout: function(mode) {
      this.video_layout.using = mode;
      this.calc_layout();
    },
    formatted_user: function(user) {
      return `user.peerId:${user.peerId}`;
    },
    calc_layout: function() {
      if (this.video_layout.using == "pinp") {
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
              width : "200px",
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
              top:    y * 100 / d + "%",
              left:   x * 100 / d + "%",
              width:  100 / d + "%",
              height: 100 / d + "%",
              position: "absolute",
              zIndex: 1,
            }
            Vue.set(this.users, i, user);
          }
        }
      }
    },
    create_user: function(peerId) {
      return {
        peerId: peerId,
        stream: null,
      }
    },
    set_stream: function(peerId, stream) {
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
    join_user: function(peerId) {
      this.users.push(this.create_user(peerId));
      this.calc_layout();
    },
    leave_user: function(peerId) {
      this.users = this.users.filter(user => user.peerId != peerId);
      this.calc_layout();
    },

    step1: function (constraints) {
      // Get audio/video stream
  
      navigator.mediaDevices.getUserMedia(constraints).then(stream => {
        console.log(stream);
        this.set_stream(this.skyway.peer.id, stream);
  
        if (this.skyway.room) {
          this.skyway.room.replaceStream(stream);
          return;
        }
        else {
          this.enumrate_media_devices();
        }
  
        const roomName = "room1";
        this.skyway.room = this.skyway.peer.joinRoom('sfu_video_' + roomName, {mode: 'sfu', stream: stream});

        this.step3(this.skyway.room);
  
      }).catch(err => {
        console.error(err);
      });
    },
    step3: function(room) {
      // Wait for stream on the call, then set peer video display
      room.on('stream', stream => {
        console.log(stream);
        const peerId = stream.peerId;
        this.set_stream(peerId, stream);
      });
  
      room.on('removeStream', stream => {
        console.log(stream);
        const peerId = stream.peerId;
        this.leave_user(peerId);
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
      });
    },
    enumrate_media_devices: function() {
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
        });
    }
  },
  data: {
    users: [],
    skyway: {
      peer: null,
      stream: null,
      room: null,
    },
    microphone: {
      device : [],
      using: null,
    },
    camera: {
      device : [],
      using: null,
    },
    video_quality : {
      size: [
        {
          label: "1280 x 960",
          value: "1280x960",
        },
        {
          label: "640 x 480",
          value: "640x480",
        },
        {
          label: "320 x 240",
          value: "320x240",
        },
      ],
      fps: [
        {
          label: "30 fps",
          value: "30",
        },
        {
          label: "15 fps",
          value: "15",
        },
        {
          label: "10 fps",
          value: "10",
        },
        {
          label: "5 fps",
          value: "5",
        },
        {
          label: "1 fps",
          value: "1",
        },
      ]
    },
    video_fill: {
      mode : [
        {
          label: "Cover",
          value: "cover",
        },
        {
          label: "Normal",
          value: "normal",
        },
      ],
      using: "cover",
    },
    video_layout: {
      mode: [
        {
          label: "PinP",
          value: "pinp",
        },
        {
          label: "Grid",
          value: "grid",
        },
      ],
      using: "pinp",
    }
  },
  mounted: function() {
    // check API KEY
    if (!window.hasOwnProperty("__SKYWAY_KEY__") || window.__SKYWAY_KEY__ == "__SKYWAY_KEY__") {
      alert("Please set your API KEY to window.__SKYWAY_KEY__")
      return;
    }

    // Peer object
    this.skyway.peer = new Peer({
      key:   window.__SKYWAY_KEY__,
      debug: 3,
    });

    this.skyway.peer.on('open', id => {
      this.join_user(id);
      this.step1({ video : true, audio : true });
    });

    this.skyway.peer.on('error', err => {
      alert(err.message);
      // Return to step 2 if error occurs
    });

  },
  watch:{
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
  directives: {
    source: {
      bind(el, binding) {
        el.srcObject = binding.value
      },
      update(el, binding) {
        if(binding.value !== binding.oldValue) {
          el.srcObject = binding.value
        }
      }
    }
  }
});

