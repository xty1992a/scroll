import * as utils from "./utils";
import Scrollbar from "./scrollbar";

// 速度系数
const SPEED_FACTOR = 8;
// 速度每帧降低比值 0-1
const SPEED_DISCOUNT = 0.96;
// 最大衰减速度,不能超过1
const MAX_SPEED_DISCOUNT = 0.98;
// 最大超限值
const MAX_OVER_LIMIT_RATIO = 0.3;

// region types
type touchPoint = {
  startX: number;
  startY: number;
  timestamp: number;
  lastX?: number;
  lastY?: number;
  overX?: number;
  overY?: number;
};
type Events = {
  [prop: string]: keyof GlobalEventHandlersEventMap;
};
const EVENTS: Events = {
  down: utils.isMobile ? "touchstart" : "mousedown",
  move: utils.isMobile ? "touchmove" : "mousemove",
  up: utils.isMobile ? "touchend" : "mouseup",
  leave: utils.isMobile ? "mouseleave" : "mouseleave",
};

type State = {
  onInertial: boolean;
  hasDown: boolean;
  [key: string]: any;
};

type Option = {
  direction?: "scroll-x" | "scroll-y" | "all";
  reachBottomOffset?: number;
  scrollbar?: boolean; // should add scroll bar ?
};
// endregion

const dftOption: Option = {
  direction: "scroll-y",
  reachBottomOffset: 100,
  scrollbar: true,
};

export default class Scroll extends utils.EmitAble {
  static MAX_OVER_LIMIT_RATIO = MAX_OVER_LIMIT_RATIO;
  static SPEED_DISCOUNT = SPEED_DISCOUNT;
  static SPEED_FACTOR = SPEED_FACTOR;

  private $scrollbar: Scrollbar;

  private destroyed = false;

  // region property
  $el: HTMLElement;
  $slide: HTMLElement;
  $option: Option;

  scrollY: number = 0;
  scrollX: number = 0;

  pointStack: utils.Stack = new utils.Stack(10);

  get allowX() {
    return ["scroll-x", "all"].includes(this.$option.direction);
  }
  get allowY() {
    return ["scroll-y", "all"].includes(this.$option.direction);
  }

  limit: {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } = {
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
  };

  // endregion

  // region runtime state

  point: touchPoint;

  state: State = {
    hasDown: false,
    onInertial: false,
    overX: false,
    overY: false,
  };

  domState: {
    slideHeight: number;
    wrapHeight: number;
    slideWidth: number;
    wrapWidth: number;
  };

  // endregion

  // region computed property

  get x() {
    return this.allowX ? this.scrollX : 0;
  }
  get y() {
    return this.allowY ? this.scrollY : 0;
  }

  get style() {
    return `
      transform: translate3d(${this.x}px, ${this.y}px,0)
    `;
  }

  // endregion

  constructor(el: HTMLElement, option: Option = {}) {
    super();
    this.$el = el;
    this.$option = { ...dftOption, ...option };
    if (!this.$el.children.length) throw "el expect one child";
    this.$slide = this.$el.children[0] as HTMLElement;
    this.setup();
  }

  private setup() {
    this.$option.scrollbar && (this.$scrollbar = new Scrollbar(this.$el));
    this.$el.style.position = "relative";
    this.listen();
    this.lazyEffectDom = utils.throttle(this.effectDom, 5);
    this.refresh();
  }

  refresh() {
    if (this.destroyed) return;
    const { $el, $slide } = this;
    this.limit.minX = $el.clientWidth - $slide.clientWidth;
    this.limit.minY = $el.clientHeight - $slide.clientHeight;
    this.domState = {
      slideHeight: $slide.clientHeight,
      slideWidth: $slide.clientWidth,
      wrapHeight: $el.clientHeight,
      wrapWidth: $el.clientWidth,
    };
    this.$scrollbar?.setContext(this.domState);
  }

  scrollTo = async ({ x, y }: { x: number; y: number }, duration = 300) => {
    const doc = document.body.scrollTop
      ? document.body
      : document.documentElement;
    const manager = new utils.TweenManager({ duration, start: this.y, end: y });
    while (manager.next()) {
      await utils.TweenManager.frame();
      this.scrollY = manager.currentValue;
      this.limitScroll();
      this.effectDom();
    }
  };

  // init listener
  private listen = () => {
    this.$el.addEventListener(EVENTS.down, this.onDown);
    this.$el.addEventListener(EVENTS.move, this.onMove);
    this.$el.addEventListener(EVENTS.up, this.onUp);
    this.$el.addEventListener(EVENTS.leave, this.onUp);
    utils.listenWheel(this.$el, this.onMouseWheel);
  };

  private unListen = () => {
    this.$el.removeEventListener(EVENTS.down, this.onDown);
    this.$el.removeEventListener(EVENTS.move, this.onMove);
    this.$el.removeEventListener(EVENTS.up, this.onUp);
    this.$el.removeEventListener(EVENTS.leave, this.onUp);
    utils.unListenWheel(this.$el, this.onMouseWheel);
  };

  private onDown = (e: MouseEvent & TouchEvent) => {
    if (this.destroyed) return;
    this.state.hasDown = true;
    const { clientX, clientY } = utils.getPoint(e);
    this.point = {
      startX: clientX,
      startY: clientY,
      timestamp: Date.now(),
      lastY: this.scrollY,
      lastX: this.scrollX,
    };
    this.fire("on-down", e);
  };

  private onMove = (e: MouseEvent & TouchEvent) => {
    if (this.destroyed) return;
    if (!this.state.hasDown || this.state.onInertial) return;
    e.preventDefault();
    const { clientX, clientY } = utils.getPoint(e);
    const deltaY = clientY - this.point.startY;
    const deltaX = clientX - this.point.startX;
    this.scrollY = this.point.lastY + deltaY;
    this.scrollX = this.point.lastX + deltaX;
    this.limitScroll();
    // 记录最后10次滚动值
    this.pointStack.push({ clientY, clientX, timestamp: Date.now() });
    this.lazyEffectDom();
    this.fire("on-move", e);
    this.fire("scroll", { x: this.x, y: this.y });
    this.$scrollbar?.setScrollState({ x: this.x, y: this.y });
  };

  private onUp = (e: MouseEvent & TouchEvent) => {
    if (this.destroyed) return;
    if (!this.state.hasDown || this.state.onInertial) return;
    this.state.hasDown = false;
    const stack = this.pointStack;
    const { speedY, speedX } = utils.getSpeed(stack.first(), stack.last());
    stack.clear();
    if (!speedY) return;
    this.inertial(speedY);
  };

  private onMouseWheel = (e: MouseWheelEvent) => {
    if (this.destroyed) return;
    e.preventDefault();
    const direction = utils.limit(-1, 1)(e.deltaY || e.detail);
    this.scrollY += Math.ceil(Scroll.SPEED_FACTOR * -direction * 2.6);
    this.limitScroll();
    this.$scrollbar?.setScrollState({ x: this.x, y: this.y });
    if (
      Math.abs(this.limit.minY - this.scrollY) < this.$option.reachBottomOffset
    ) {
      this.fire("reach-bottom", { x: this.x, y: this.y });
    }
    this.effectDom();
  };

  // 计算移动量 computed delta move
  private limitScroll() {
    // 超过限值
    const overY =
      this.scrollY > this.limit.maxY
        ? this.scrollY - this.limit.maxY
        : this.scrollY < this.limit.minY
        ? this.scrollY - this.limit.minY
        : 0;
    const overX =
      this.scrollX > this.limit.maxX
        ? this.scrollX - this.limit.maxX
        : this.scrollX < this.limit.minX
        ? this.scrollX - this.limit.minX
        : 0;

    this.state.overX = overX !== 0;
    this.state.overY = overY !== 0;

    this.scrollY -= overY;
  }

  // 惯性滚动 inertial scroll
  private inertial = async (speed: number) => {
    this.state.onInertial = true;
    while (speed && !this.state.hasDown) {
      await utils.frame();
      // 每帧降速10%,凑合用了
      speed *= Math.min(Scroll.SPEED_DISCOUNT, MAX_SPEED_DISCOUNT);
      if (Math.abs(speed) < 0.5) {
        speed = 0;
      }
      this.scrollY = +(
        this.scrollY + +(speed * Scroll.SPEED_FACTOR).toFixed(2)
      ).toFixed(2);
      this.limitScroll();
      if (this.state.overY) break;
      this.fire("scroll", { x: this.x, y: this.y });
      this.$scrollbar?.setScrollState({ x: this.x, y: this.y });
      this.effectDom();
    }

    // 防止滚动到小数值导致模糊
    this.scrollY = Math.floor(this.scrollY);
    this.effectDom();

    this.fire("scroll-end", { x: this.x, y: this.y });

    if (
      Math.abs(this.limit.minY - this.scrollY) < this.$option.reachBottomOffset
    ) {
      this.fire("reach-bottom", { x: this.x, y: this.y });
    }

    this.state.overY = false;
    this.state.onInertial = false;
  };

  // 将计算结果作用到dom force dom scroll
  private effectDom = () => {
    this.$slide.style.cssText = this.style;
  };

  // 节流的EffectDom
  private lazyEffectDom = this.effectDom;

  destroy = () => {
    this.destroyed = true;
    this.unListen();
  };
}
