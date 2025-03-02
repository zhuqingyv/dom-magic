// VDom 属性接口
export interface VDomProps {
  [key: string]: any;
  children?: IVDom[];
  className?: string;
  style?: Partial<CSSStyleDeclaration>;
  id?: string;
  innerHTML?: string;
  textContent?: string;
}

// VDom 事件映射接口
export interface VDomEventMap {
  [key: string]: (event: Event) => void;
}

// VDom 内部属性接口
export interface IVDomInternals {
  _parent: IVDom | null;
  _children: IVDom[];
  _element: HTMLElement | null;
  _props: VDomProps;
  _events: VDomEventMap;
}

// VDom 类接口
export interface IVDom extends IVDomInternals {
  // Props 相关方法
  setProps(props: VDomProps): this;
  setProp(key: string, value: any): this;
  getProp(key: string): any;

  // 事件相关方法
  addEventListener(type: string, listener: (event: Event) => void): this;
  removeEventListener(type: string): this;

  // DOM 操作方法
  appendChild(child: IVDom): this;
  append(...nodes: (IVDom | string)[]): this;
  remove(): this;
  replaceWith(newChild: IVDom): this;

  // 样式操作
  setStyle(styles: Partial<CSSStyleDeclaration>): this;
  addClass(className: string): this;
  removeClass(className: string): this;

  // 属性操作
  setAttribute(name: string, value: string): this;
  getAttribute(name: string): string | null;
  removeAttribute(name: string): this;

  // 内容操作
  setTextContent(text: string): this;
  setInnerHTML(html: string): this;

  // 获取元素
  getElement(): HTMLElement;
  getChildren(): IVDom[];
}

// VDom 抽象类
export abstract class VDom implements IVDom {
  _element: HTMLElement | null = null;
  _props: VDomProps = {};
  _events: VDomEventMap = {};
  _children: IVDom[] = [];
  _parent: IVDom | null = null;

  constructor(tagName: string, props: VDomProps) {
    // 实现移到 index.ts
  }

  abstract setProps(props: VDomProps): this;
  abstract setProp(key: string, value: any): this;
  abstract getProp(key: string): any;
  abstract addEventListener(type: string, listener: (event: Event) => void): this;
  abstract removeEventListener(type: string): this;
  abstract appendChild(child: IVDom): this;
  abstract append(...nodes: (IVDom | string)[]): this;
  abstract remove(): this;
  abstract replaceWith(newChild: IVDom): this;
  abstract setStyle(styles: Partial<CSSStyleDeclaration>): this;
  abstract addClass(className: string): this;
  abstract removeClass(className: string): this;
  abstract setAttribute(name: string, value: string): this;
  abstract getAttribute(name: string): string | null;
  abstract removeAttribute(name: string): this;
  abstract setTextContent(text: string): this;
  abstract setInnerHTML(html: string): this;
  abstract getElement(): HTMLElement;
  abstract getChildren(): IVDom[];

  protected abstract _updateElement(): void;
}

// 工厂函数类型
export type CreateElement = (tagName: string, props?: VDomProps) => IVDom;

// DOM 比较函数类型
export type EquallyElement = (a: Node, b: Node) => boolean;
