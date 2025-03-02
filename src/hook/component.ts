import { isReactive } from '../reactive';
import { subscribe } from './index';
import { Props, ReactiveObject, UpdateCallback } from './types';

export class ComponentBase {
  static rootInstance: Component | null = null;
  static readonly instanceList: Component[] = [];

  // 开始构建hook依赖关系
  static readonly bindStart = (instance: Component) => {
    if (ComponentBase.instanceList.length === 0) {
      ComponentBase.instanceList.push(instance);
      ComponentBase.rootInstance = instance;
      return;
    }

    const currentInstance = ComponentBase.currentInstance();
    if (currentInstance) {
      instance.setParent(currentInstance);
      currentInstance.setChild(instance);
    }
    ComponentBase.instanceList.push(instance);
  };

  // 构建结束，最后一个hook出栈
  static readonly bindEnd = () => {
    ComponentBase.instanceList.pop();
  };

  // 当前hook实例(最后一个)
  static readonly currentInstance = (): Component | undefined => {
    return ComponentBase.instanceList[ComponentBase.instanceList.length - 1];
  };

  // 拦截hook内元素订阅响应式，记录到当前hook实例中，并且代理执行订阅
  static readonly interceptReactive = <T>(reactiveObject: ReactiveObject<T>, update: UpdateCallback): void => {
    const currentInstance = ComponentBase.currentInstance();
    if (currentInstance) {
      // 如果有hook捆绑，则执行劫持
      currentInstance.interceptReactive(reactiveObject, update);
    } else {
      reactiveObject.___bind(update);
    };
  };
};

const defaultShouldUpdate = (preProps: any, nextProps: any) => {
  // 如果引用相同，直接返回 false（不需要更新）
  if (preProps === nextProps) return false;

  // 如果其中一个是 null 或 undefined，另一个不是，则需要更新
  if (!preProps || !nextProps) return true;

  // 获取两个对象的所有键
  const preKeys = Object.keys(preProps);
  const nextKeys = Object.keys(nextProps);

  // 如果键的数量不同，需要更新
  if (preKeys.length !== nextKeys.length) return true;

  // 浅比较每个属性
  for (const key of preKeys) {
    if (preProps[key] !== nextProps[key]) {
      return true; // 有任何属性不同，就需要更新
    }
  }

  return false; // 所有属性都相同，不需要更新
};

export class Component extends ComponentBase {
  _parent: Component | null = null;
  _children = new Set<Component>();
  _render: any;
  _shouldUpdate: any;
  _propsSnapshot: any;
  _slots: HTMLElement[] = [];

  private _subscribes = new Map<UpdateCallback, ReactiveObject<any>>();
  private _element: HTMLElement | null = null;
  private _props: Props | null = {};

  constructor(_render: any, _shouldUpdate?: any) {
    super();
    this._render = _render;
    this._shouldUpdate = _shouldUpdate || defaultShouldUpdate;
  };

  bindStart = (): void => {
    ComponentBase.bindStart(this);
  };

  bindEnd = (): void => {
    ComponentBase.bindEnd();
  };

  setParent = (parent: Component): void => {
    this._parent = parent;
  };

  setChild = (child: Component): void => {
    this._children.add(child);
  };

  interceptReactive = <T>(reactiveObject: ReactiveObject<T>, update: UpdateCallback): void => {
    this._subscribes.set(update, reactiveObject);
    reactiveObject.___bind(update);
  };

  clear = () => {
    this._subscribes.forEach((reactiveObject, update) => reactiveObject.___unbind(update));
    this._children.forEach((child) => child.destroy());
    this._subscribes.clear();
    this._children.clear();
  };

  destroy = (): void => {
    this.clear();
    this._props = null;
    this._parent = null;
    this._propsSnapshot = null;
    this._slots.length = 0;
  };

  setElement = (element: HTMLElement): void => {
    if (this._element) {
      this._element.replaceWith(element);
      this._element = element;
    } else {
      this._element = element;
    }
  };

  getElement = (): HTMLElement | null => {
    return this._element;
  };

  getProps = (children: HTMLElement[]): Props => {
    return { ...this._props, children };
  };

  setProps = (key: string, value: any): void => {
    if (this._props) {
      if (isReactive(value)) subscribe(value, this.update);
      this._props[key] = value;
    };
  };

  setPropsSnapshot = (children: HTMLElement[]): void => {
    if (!this._props) return;
    const props = this._props;
    const snapshot = Object.keys(this._props).reduce((pre, key) => {
      const value = props[key];

      pre[key] = isReactive(value) ? value() : value;
      return pre;

    }, Object.create(null));

    this._propsSnapshot = { ...snapshot, children };
  };

  update = (): void => {
    if (this._shouldUpdate(this._propsSnapshot, this._props)) {
      this.render(this._props.children);
    };
  };

  render = (children: HTMLElement[]): HTMLElement | null => {
    const { _render } = this;
    // 清理上一次的订阅
    if (this._children?.size > 0) this.clear();
    // 更新props快照
    this.setPropsSnapshot(children);
    // 开始hook之间的依赖收集
    ComponentBase.bindStart(this);
    const element = _render(this.getProps(children));
    ComponentBase.bindEnd();
    this.setElement(element);
    return this.getElement();
  };
};