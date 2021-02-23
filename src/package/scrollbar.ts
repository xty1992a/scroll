import * as utils from "./utils";

const trackStyle = `
  position: absolute;
  bottom: 0;
  right: 0;
  top: 0;
  width: 4px;
`;
const slideStyle = `
  width: 100%;
  background: #333;
  border-radius: 1.5px;
`;

type ctxState = {
  slideHeight: number;
  wrapHeight: number;
  slideWidth: number;
  wrapWidth: number;
};

export default class Scrollbar {
  $parent: HTMLElement;
  $track: HTMLElement;
  $slide: HTMLElement;
  debounceFn: Function;
  parentCtxState: ctxState;
  scrollState: {
    x: number;
    y: number;
  } = {
    x: 0,
    y: 0,
  };

  constructor(parent: HTMLElement) {
    this.$parent = parent;
    this.debounceFn = utils.debounce(this.onChangeStop, 300);
    this.setup();
  }

  setup() {
    const track = (this.$track = document.createElement("div"));
    const slide = (this.$slide = document.createElement("div"));

    this.insertStyle();

    track.appendChild(slide);
    this.$parent.appendChild(track);
    this.setDomStyle = utils.throttle(this.setDomStyle, 5);
  }

  setContext(state: ctxState) {
    this.parentCtxState = state;
    this.setDomStyle();
  }

  insertStyle() {
    const { $track, $slide } = this;
    $track.className = "scrollbar__track";
    $slide.className = "scrollbar__slide";

    const cssStyle = `
      .${$track.className} {
        ${trackStyle}
      }
      .${$slide.className} {
        ${slideStyle}
      }
    `;
    utils.insertStyle(cssStyle);
  }

  setScrollState = (state: { x: number; y: number }) => {
    this.scrollState = state;
    this.setDomStyle();
  };

  setDomStyle = () => {
    const {
      $slide: slide,
      $track: track,
      parentCtxState: state,
      scrollState: scroll,
    } = this;
    const ratio = state.wrapHeight / state.slideHeight;
    const scrollRatio = -scroll.y / state.slideHeight;

    slide.style.height = ratio * state.wrapHeight + "px";
    slide.style.opacity = "0.6";
    slide.style.transition = "";
    slide.style.transform = `translate3d(0,${
      scrollRatio * state.wrapHeight
    }px,0)`;

    this.debounceFn();
  };

  onChangeStop() {
    this.$slide.style.opacity = "0";
    this.$slide.style.transition = "opacity .6s";
  }
}
