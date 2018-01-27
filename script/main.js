var vm = new Vue({
  el: "#vue-app",
  computed: {
  },
  methods: {
    formatted_user: function(user) {
      return `user.peerId:${user.peerId}`;
    },
    calc_layout: function() {
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
            top: "100px",
            left: 100 * index + "px",
            width : "160px",
            height: "120px",
            zIndex: 2,
          }
        }
      });
    },
    create_user: function(peerId) {
      return {
        peerId: peerId,
        stream: null,
        style: {
          top: "100px",
          left: "100px",
          width : "320px",
          height: "240px",
        }
      }
    },
    set_stream: function(peerId, stream) {
      this.users.forEach(user => {
        if (user.peerId == peerId) user.stream = stream;
      });
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
    add_peer: function(peerId, peer) {
      this.peers.push({
        id: peerId,
        peer: peer
      })
    },
    del_peer: function(peerId) {
      this.peers = this.peers.filter(peer => peer.id != peerId);
    },
    add_stream: function(peerId, stream) {
      this.streams.push({
        id: peerId,
        stream: stream,
        style: {
          top: 0,
          left: 0,
        }
      })
    },
    del_stream: function(peerId) {
      this.streams = this.streams.filter(stream => stream.id != peerId);
    }
  },
  data: {
    users: [],
    peers: [],  // { id : "foo", peer   : obj } 
    streams: [] // { id : "foo", stream : obj }
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
      streams: function(streams) {
        Vue.nextTick().then(function () {
          vm.streams.forEach( stream => {
            if (document.getElementById(stream.id)) {
              document.getElementById(stream.id).srcObject = stream.stream;
            }
          })
        })
      }
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

