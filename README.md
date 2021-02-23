# @redbuck/scroll

## 简介
一个简单的模拟滚动插件.iScroll,better-scroll的极简实现.  
支持手指滚动与鼠标滚轮事件.  
支持滚动条
支持事件派发

## 使用
```ecmascript 6
import Scroll from '@redbuck/scroll'  

new Scroll(document.getElementById('el'))
```
el下的子元素即可在其内部滚动(子元素的高度应超过父元素,且父元素应开启overflow: hidden);  
当子元素的高度变化时,调用实例的`refresh`方法更新可滚动范围.  

## 事件
通过`instance.on`方法监听实例派发事件,可以在合适时机实现逻辑.  

