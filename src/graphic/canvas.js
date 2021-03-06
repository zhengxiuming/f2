const Util = require('../util/common');
const Container = require('./container');
const Group = require('./group');

class Canvas {
  get(name) {
    return this._attrs[name];
  }

  set(name, value) {
    this._attrs[name] = value;
  }

  constructor(cfg) {
    this._attrs = Util.mix({
      type: 'canvas',
      children: []
    }, cfg);
    this._initPixelRatio();
    this._initCanvas();
  }

  _initPixelRatio() {
    const pixelRatio = this.get('pixelRatio');
    if (!pixelRatio) {
      this.set('pixelRatio', Util.getPixelRatio());
    }
  }

  _beforeDraw() {
    const context = this._attrs.context;
    const el = this._attrs.el;
    !Util.isWx && !Util.isMy && context && context.clearRect(0, 0, el.width, el.height);
  }

  _initCanvas() {
    const self = this;
    const el = self.get('el');
    const context = self.get('context');
    let canvas;

    if (context) { // CanvasRenderingContext2D
      canvas = context.canvas;
    } else if (Util.isString(el)) { // HTMLElement's id
      canvas = Util.getDomById(el);
    } else { // HTMLElement
      canvas = el;
    }

    if (!canvas) {
      throw new Error('Please specify the id or el of the chart!');
    }

    if (context && canvas && !canvas.getContext) {
      canvas.getContext = function() {
        return context;
      };
    }

    let width = self.get('width');
    if (!width) {
      width = Util.getWidth(canvas);
    }

    let height = self.get('height');
    if (!height) {
      height = Util.getHeight(canvas);
    }

    self.set('canvas', this);
    self.set('el', canvas);
    self.set('context', context || canvas.getContext('2d'));
    self.changeSize(width, height);
  }

  /**
   * 改变 canvas 的宽高
   * @param  {Number} width  宽度
   * @param  {Number} height 高度
   */
  changeSize(width, height) {
    const pixelRatio = this.get('pixelRatio');
    const canvasDOM = this.get('el');

    if (Util.isBrowser) {
      canvasDOM.style.width = width + 'px';
      canvasDOM.style.height = height + 'px';
    }

    if (!Util.isWx && !Util.isMy) {
      canvasDOM.width = width * pixelRatio;
      canvasDOM.height = height * pixelRatio;

      if (pixelRatio !== 1) {
        const ctx = this.get('context');
        ctx.scale(pixelRatio, pixelRatio);
      }
    }

    this.set('width', width);
    this.set('height', height);
  }

  /**
   * 获取 canvas 对应 dom 元素的宽度
   * @return {Number} 返回宽度
   */
  getWidth() {
    const pixelRatio = this.get('pixelRatio');
    const width = this.get('width');
    return width * pixelRatio;
  }

  /**
   * 获取 canvas 对应 dom 元素的高度
   * @return {Number} 返回高度
   */
  getHeight() {
    const pixelRatio = this.get('pixelRatio');
    const height = this.get('height');
    return height * pixelRatio;
  }

  /**
   * 将窗口坐标转变成 canvas 坐标
   * @param  {Number} clientX 窗口x坐标
   * @param  {Number} clientY 窗口y坐标
   * @return {Object} canvas坐标
   */
  getPointByClient(clientX, clientY) {
    const el = this.get('el');
    const bbox = el.getBoundingClientRect();
    const width = bbox.right - bbox.left;
    const height = bbox.bottom - bbox.top;
    return {
      x: (clientX - bbox.left) * (el.width / width),
      y: (clientY - bbox.top) * (el.height / height)
    };
  }

  draw() {
    const self = this;
    if (self._attrs.destroyed) {
      return;
    }
    self._beforeDraw();
    try {
      const context = self._attrs.context;
      const children = self._attrs.children;
      for (let i = 0, len = children.length; i < len; i++) {
        const child = children[i];
        child.draw(context);
      }

      if (Util.isWx || Util.isMy) {
        context.draw();
      }
    } catch (ev) { // 绘制时异常，中断重绘
      console.warn('error in draw canvas, detail as:');
      console.warn(ev);
    }
  }

  destroy() {
    if (this.get('destroyed')) {
      return;
    }
    this.clear();
    this._attrs = {};
    this.set('destroyed', true);
  }
}

Util.mix(Canvas.prototype, Container, {
  getGroupClass() {
    return Group;
  }
});

module.exports = Canvas;
