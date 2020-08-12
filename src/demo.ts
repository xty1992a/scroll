import Scroll from "./package/main";

// @ts-ignore
new window.Vue({
  data() {
    return {
      list: [...Array(30)].map((n, i) => ({ key: i })),
    };
  },
  methods: {},

  mounted() {
    const scroll = new Scroll(this.$el);

    scroll.on("scroll", (e) => {});

    console.log(Object.keys(Scroll), scroll);
  },

  template: `
    <div class="app">
      <ul class="list">
        <li class="item" v-for="it in list" :key="it.key">item {{it.key}}</li>
      </ul>
    </div>
  `,
}).$mount("#app");
