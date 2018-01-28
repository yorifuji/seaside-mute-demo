var vm = new Vue({
  el: "#vue-app",
  computed: {
    visible_users: function() {
      return this.users.filter(user => user.stream);
    },
    video_fill_class: function() {
      return { "video-fill-cover" : this.video_fill.using == "cover" }
    }
  },
  methods: {
    _dbg_trace_users: function() {
      this.users.forEach(user => console.log(user.peerId))
    },
    click_video: function(peerId) {
      let users = this.users.filter(user => user.peerId == peerId);
      this.users = users.concat(this.users.filter(user => user.peerId != peerId));
//      this.calc_layout();
    },
    select_mic: function(device) {
      console.log(device)
    },
    select_camera: function(device) {
      console.log(device)
    },
    select_video_fill: function(mode) {
      this.video_fill.using = mode;
    },
    select_video_layout: function(mode) {
      this.video_layout.using = mode;
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
              zIndex: 1,
            }
          }
          else {
            user.style = {
              bottom: "10px",
              right: 10 * index + 200 * (index - 1) + "px",
              width : "200px",
              height: "150px",
              zIndex: 2,
            }
          }
          Vue.set(this.users, index, user);
        });
      }
      else {
        this.users.forEach((user, index) => {
          if (index == 0) {
            user.style = {
              top: "0px",
              left: "0px",
              width: "50%",
              height: "100%",
              zIndex: 1,
            }
          }
          else {
            user.style = {
              bottom: "10px",
              right: 10 * index + 200 * (index - 1) + "px",
              width : "200px",
              height: "150px",
              zIndex: 2,
            }
          }
          Vue.set(this.users, index, user);
        });
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
  },
  data: {
    users: [],
    microphone: {
      device : [],
      using: null,
    },
    camera: {
      device : [],
      using: null,
    },
    video_fill: {
      mode : [
        {
          label: "Cover",
          value: "cover",
        },
        {
          label: "Contain",
          value: "contain",
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
          label: "Area",
          value: "area",
        },
      ],
      using: "pinp",
    }
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

