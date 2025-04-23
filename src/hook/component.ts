import { isReactive, subscribe as subscribeReactive, unsubscribe as unsubscribeReactive } from '../reactive';
import { subscribe } from './index';
import { HOOK_STATUS } from './const';
import { Props, ReactiveObject, UpdateCallback, VDomType } from './types';

export class ComponentBase {
  // 渲染状态
  static status: keyof typeof HOOK_STATUS = HOOK_STATUS.INIT;
  static rootInstance: Component | null = null;
  static readonly instanceList: Component[] = [];
  static readonly domPool: Map<string, HTMLElement[]> = new Map();

  // 开始构建hook依赖关系
  static readonly bindStart = (instance: Component) => {
    if (ComponentBase.instanceList.length === 0) {
      ComponentBase.instanceList.push(instance);
      ComponentBase.rootInstance = instance;
      return;
    };

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
      subscribeReactive(reactiveObject, update);
    };
  };

  static readonly setStatus = (status: keyof typeof HOOK_STATUS) => {
    if (HOOK_STATUS[status]) {
      this.status = status;
    };
  };

  static readonly requestVdom = (vdom: VDomType) => {
    const { tagName } = vdom;
    const pool = ComponentBase.domPool.get(tagName);

    if (pool) {
      // 取出数组第一项，改变原数组
      const element = pool.shift();
    };
  };

  static readonly getElementProps = () => {};
};

const isEqual = (preProps: any, nextProps: any): boolean => {
  const preKeys = Object.keys(preProps);
  const nextKeys = Object.keys(nextProps);

  if (preKeys.length !== nextKeys.length) return false;

  for (const key of preKeys) {
    const prevValue = isReactive(preProps[key]) ? preProps[key]() : preProps[key];
    const nextValue = isReactive(nextProps[key]) ? nextProps[key]() : nextProps[key];
    if (prevValue !== nextValue) return false;
  };

  return true;
};

const defaultShouldUpdate = (preProps: any, nextProps: any) => {
  // 如果引用相同，直接返回 false（不需要更新）
  if (isEqual(preProps, nextProps)) return false;

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
  _preRenderResult: HTMLElement | null = null;

  private _subscribes = new Map<UpdateCallback, ReactiveObject<any>>();
  private _props: Props | null = {};
  private readonly _treeStack: any[] = [];
  private readonly _shadowTreeStack: any[] = [];

  constructor(_render: any, _shouldUpdate?: any) {
    super();
    this._render = _render;
    this._shouldUpdate = _shouldUpdate || defaultShouldUpdate;
  };

  setParent = (parent: Component): void => {
    this._parent = parent;
  };

  setChild = (child: Component): void => {
    this._children.add(child);
  };

  interceptReactive = <T>(reactiveObject: ReactiveObject<T>, update: UpdateCallback): void => {
    this._subscribes.set(update, reactiveObject);
    subscribeReactive(reactiveObject, update)
  };

  clear = () => {
    // this._subscribes.forEach((reactiveObject, update) => reactiveObject.___unbind(update));unsubscribeReactive
    this._subscribes.forEach((reactiveObject, update) => unsubscribeReactive(reactiveObject, update));
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

  getProps = (children: HTMLElement[]): Props => {
    return { ...this._props, children };
  };

  setProps = (key: string, value: any): void => {
    if (this._props) {
      if (isReactive(value)) subscribe(value, this.update);
      this._props[key] = value;
    };
  };

  setPropsSnapshot = (): void => {
    if (!this._props) return;
    const props = this._props;
    const snapshot = Object.keys(this._props).reduce((pre, key) => {
      const value = props[key];

      pre[key] = isReactive(value) ? value() : value;
      return pre;

    }, Object.create(null));

    this._propsSnapshot = { ...snapshot };
  };

  update = (): HTMLElement | null | undefined => {
    if (this._shouldUpdate(this._propsSnapshot, this._props)) {
      // 设置为更新状态
      ComponentBase.setStatus(HOOK_STATUS.UPDATE);
      return this.render(this._props.children);
    };
    return this._preRenderResult;
  };

  render = (children: HTMLElement[]): HTMLElement | null => {
    const { _render } = this;
    // 清理上一次的订阅
    if (this._children?.size > 0) this.clear();
    // 更新props快照
    this.setPropsSnapshot();
    pushVNode(this);
    // 开始hook之间的依赖收集
    ComponentBase.bindStart(this);
    const element = _render(this.getProps(children));
    this._preRenderResult = element;
    ComponentBase.bindEnd();
    console.log(this._treeStack);
    return element;
  };

  pushVNode = (vnode: any) => {
    const length = this._shadowTreeStack.length;
    const preVnode = this._shadowTreeStack[length - 1];
    if (preVnode === vnode) {
      this._shadowTreeStack.pop();
    } else {
      this._shadowTreeStack.push(vnode);
    };
    this._treeStack.push(vnode);
  };
};

// 元素入栈
export const pushVNode = (vnode: any) => {
  ComponentBase.currentInstance()?.pushVNode(vnode);
};