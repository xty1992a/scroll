type point = {
  clientX: number;
  clientY: number;
  [key: string]: any;
};

export const getPoint = (event: MouseEvent & TouchEvent): point => {
  return event.touches && event.touches.length
    ? event.touches[0]
    : event.changedTouches
    ? event.changedTouches[0]
    : event;
};

export const isMobile: boolean = (() =>
  /(android)|(iphone)|(symbianos)|(windows phone)|(ipad)|(ipod)/i.test(
    navigator.userAgent
  ))();

export class Stack {
  size: number;
  bucket: any[];
  constructor(size: number) {
    this.size = size;
    this.bucket = [];
  }
  push(item: any) {
    this.bucket.push(item);
    if (this.bucket.length > this.size) {
      this.bucket.shift();
    }
  }

  first() {
    return this.bucket[0];
  }

  last() {
    return this.bucket[this.bucket.length - 1];
  }
  length() {
    return this.bucket.length;
  }
  clear() {
    this.bucket = [];
  }
}

type cachePoint = {
  clientX: number;
  clientY: number;
  timestamp: number;
};

export function getSpeed(first: cachePoint, last: cachePoint) {
  if (!first || !last)
    return {
      speedY: 0,
      speedX: 0,
      time: 0,
    };
  const time = last.timestamp - first.timestamp;
  return {
    speedX: (last.clientX - first.clientX) / time,
    speedY: (last.clientY - first.clientY) / time,
    time,
  };
}

export const sleep = (time: number) =>
  new Promise((resolve) => setTimeout(resolve, time));

export const frame = () =>
  new Promise((resolve) => requestAnimationFrame(resolve));

export const debounce = (fn: Function, time: number = 100) => {
  let timer: number = 0;
  return function () {
    const context = this;
    let args = arguments;
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      fn.apply(context, args);
    }, time);
  };
};

export function throttle(fn: Function, interval = 500) {
  let run = true;
  return function () {
    if (!run) return;
    run = false;
    const args = arguments;
    setTimeout(() => {
      fn.apply(this, args);
      run = true;
    }, interval);
  };
}

interface listener<K extends keyof HTMLElementEventMap> {
  (this: HTMLElement, ev: HTMLElementEventMap[K]): any;
}

// 保证输出为[小,大]
export const order = ([min, max]: number[]) =>
  min > max ? [max, min] : [min, max];

// 返回一个函数,用于将输入限制在预先存入的值之间
export const limit = (min: number, max: number) => (val: number) => {
  [min, max] = order([min, max]);
  return Math.min(Math.max(val, min), max);
};

export const listen = <K extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  event: K,
  callback: listener<K>,
  flag?: boolean | AddEventListenerOptions
) => el.addEventListener(event, callback, flag);

export const listenWheel = <K extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  callback: listener<K>
) => {
  ["mousewheel", "wheel", "DOMMouseScroll"].forEach((event: K) =>
    listen(el, event, callback)
  );
};

export const unListenWheel = <K extends keyof HTMLElementEventMap>(
  el: HTMLElement,
  callback: listener<K>
) => {
  ["mousewheel", "wheel", "DOMMouseScroll"].forEach((event: K) =>
    el.removeEventListener(event, callback)
  );
};

type TaskContainer = {
  [prop: string]: task;
};

type task = EventListener[];

export interface EventListener {
  (payload?: any): any;
}

export class EmitAble {
  protected _task: TaskContainer = {};

  on(event: string, callback: EventListener) {
    this._task[event] = this._task[event] || [];
    this._task[event].push(callback);
  }

  fire(event: string, payload?: any) {
    const task = this._task[event] || [];
    task.forEach((callback) => callback(payload));
  }

  off(event: string, callback: EventListener) {
    const task = this._task[event] || [];
    this._task[event] = task.filter((cb) => cb !== callback);
  }

  clear(event: string) {
    this._task[event] = null;
  }
}

export const Tween = {
  Linear: function (t: number, b: number, c: number, d: number) {
    return (c * t) / d + b;
  },
};
const dftOption = {
  duration: 300,
  start: 0,
  end: 0,
  easing: Tween.Linear,
};
export class TweenManager {
  $options: {
    easing: Function;
    duration: number;
    start: number;
    end: number;
  };
  stamp: number;
  get distance() {
    return this.$options.end - this.$options.start;
  }

  get now() {
    return Date.now ? Date.now() : new Date().getTime();
  }

  get currentStep() {
    return this.now - this.stamp;
  }

  get currentValue() {
    const { distance, currentStep } = this;
    const { duration, easing, start } = this.$options;
    return easing(currentStep, start, distance, duration);
  }

  constructor(opt = {}) {
    this.$options = { ...dftOption, ...opt };
    this.stamp = this.now;
  }

  next() {
    return this.$options.duration > this.currentStep;
  }

  static sleep = sleep;

  static frame() {
    return requestAnimationFrame
      ? new Promise(requestAnimationFrame)
      : TweenManager.sleep(16);
  }
}

export function insertStyle(cssStyle: string) {
  const style = document.createElement("style");
  style.innerHTML = cssStyle;
  document.head.appendChild(style);
}
