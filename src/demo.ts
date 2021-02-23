// import Scroll from "./package/main";

// @ts-ignore
import Scroll from "../lib/scroll";

const sleep = (time: number) =>
  // @ts-ignore
  new Promise((resolve) => setTimeout(resolve, time));
// @ts-ignore
new window.Vue({
  data() {
    return {
      length: 20,
      loading: false,
      finished: false,
    };
  },
  computed: {
    list() {
      return [...Array(this.length)].map((n, i) => ({ key: i }));
    },
  },
  methods: {
    async fetchList() {
      if (this.finished) return;
      if (this.loading) return;
      this.loading = true;
      console.log("fetch list", this.length);
      await sleep(400);
      this.loading = false;
      this.length += 10;
      this.finished = this.length > 40;
    },
  },
  mounted() {
    const scroll = new Scroll(this.$el, {
      scrollbar: true,
      reachBottomOffset: 300,
    });

    scroll.on("scroll", (e: any) => {});
    scroll.on("reach-bottom", async (e: any) => {
      await this.fetchList();
      this.$nextTick(() => {
        scroll.refresh();
      });
    });

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
