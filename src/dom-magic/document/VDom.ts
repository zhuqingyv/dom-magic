import { VDom as VDomBase, VDomProps, VDomEventMap, IVDom } from './types';

export class VDom extends VDomBase {
  constructor(tagName: string = 'div', props: VDomProps = {}) {
    super(tagName, props);
    this._element = document.createElement(tagName);
    this.setProps(props);
  }

  // Props 相关方法
  setProps(props: VDomProps) {
    this._props = { ...this._props, ...props };
    this._updateElement();
    return this;
  }

  setProp(key: string, value: any) {
    this._props[key] = value;
    this._updateElement();
    return this;
  }

  getProp(key: string) {
    return this._props[key];
  }

  // 事件相关方法
  addEventListener(type: string, listener: (event: Event) => void) {
    this._events[type] = listener;
    this._element?.addEventListener(type, listener);
    return this;
  }

  removeEventListener(type: string) {
    const listener = this._events[type];
    if (listener) {
      this._element?.removeEventListener(type, listener);
      delete this._events[type];
    }
    return this;
  }

  // DOM 操作方法
  appendChild(child: IVDom) {
    child._parent = this;
    this._children.push(child);
    this._element?.appendChild(child.getElement());
    return this;
  }

  append(...nodes: (IVDom | string)[]) {
    nodes.forEach(node => {
      if (node instanceof VDomBase) {
        this.appendChild(node);
      } else if (typeof node === 'string') {
        const textNode = document.createTextNode(node);
        this._element?.appendChild(textNode);
      }
    });
    return this;
  }

  remove() {
    this._element?.remove();
    if (this._parent) {
      const index = this._parent._children.indexOf(this);
      if (index > -1) {
        this._parent._children.splice(index, 1);
      }
    }
    return this;
  }

  replaceWith(newChild: IVDom) {
    this._element?.replaceWith(newChild.getElement());
    if (this._parent) {
      const index = this._parent._children.indexOf(this);
      if (index > -1) {
        this._parent._children[index] = newChild;
      }
    }
    return this;
  }

  // 样式操作
  setStyle(styles: Partial<CSSStyleDeclaration>) {
    this._props.style = { ...this._props.style, ...styles };
    this._updateElement();
    return this;
  }

  addClass(className: string) {
    this._element?.classList.add(className);
    return this;
  }

  removeClass(className: string) {
    this._element?.classList.remove(className);
    return this;
  }

  // 属性操作
  setAttribute(name: string, value: string) {
    this._element?.setAttribute(name, value);
    return this;
  }

  getAttribute(name: string): string | null {
    return this._element?.getAttribute(name) || null;
  }

  removeAttribute(name: string) {
    this._element?.removeAttribute(name);
    return this;
  }

  // 内容操作
  setTextContent(text: string) {
    this._props.textContent = text;
    this._updateElement();
    return this;
  }

  setInnerHTML(html: string) {
    this._props.innerHTML = html;
    this._updateElement();
    return this;
  }

  // 获取真实 DOM 元素
  getElement(): HTMLElement {
    if (!this._element) {
      throw new Error('Element not initialized');
    }
    return this._element;
  }

  // 获取子元素
  getChildren(): IVDom[] {
    return this._children;
  }

  // 内部方法：更新元素
  protected _updateElement() {
    if (!this._element) return;

    // 更新 class
    if (this._props.className) {
      this._element.className = this._props.className;
    }

    // 更新 style
    if (this._props.style) {
      Object.assign(this._element.style, this._props.style);
    }

    // 更新 textContent
    if (this._props.textContent !== undefined) {
      this._element.textContent = this._props.textContent;
    }

    // 更新 innerHTML
    if (this._props.innerHTML !== undefined) {
      this._element.innerHTML = this._props.innerHTML;
    }

    // 更新其他属性
    Object.entries(this._props).forEach(([key, value]) => {
      if (!['className', 'style', 'children', 'textContent', 'innerHTML'].includes(key)) {
        if (value !== undefined && value !== null) {
          this._element?.setAttribute(key, String(value));
        } else {
          this._element?.removeAttribute(key);
        }
      }
    });
  }
} 