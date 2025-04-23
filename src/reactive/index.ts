import { ARRAY_MUTATION_METHODS, BASE_DATE_TYPE_METHODS, SUBSCRIBE_KEY, UN_SUBSCRIBE_KEY } from './const';
import { Reactive as TargetType } from './types';

const REACTIVE_PROXY = Symbol('REACTIVE_PROXY');

class ReactiveBase {
  static readonly contextMap = new WeakMap<object, Reactive<any>>;

  static readonly initTarget = <T>(target: T): T extends object ? T : { value: T } => {
    return (
      typeof target === "object" && target !== null
        ? target
        : { value: target }
    ) as T extends object ? T : { value: T };
  };

  static readonly createProxy = <T extends object>(target: T, createHandler: () => ProxyHandler<T>): T => {
    return new Proxy(target, createHandler()) as T;
  };

  static readonly createContext = <T extends object>(target: T, path: (string | symbol | number)[], parent: Reactive<any> | null): Reactive<T> => {
    const context = ReactiveBase.contextMap.get(target) || new Reactive<T>(target, path, parent);
    ReactiveBase.contextMap.set(target, context);
    return context;
  };

  static readonly isObject = (value: unknown): value is object | Function => {
    return value !== null && (typeof value === 'object' || typeof value === 'function');
  };

  static readonly isCallback = (callback: unknown): callback is Function => {
    return typeof callback === 'function';
  };

  static readonly isArrayMutationMethod = <T extends string>(
    method: T
  ): method is T & keyof typeof ARRAY_MUTATION_METHODS => {
    type ValidKeys = keyof typeof ARRAY_MUTATION_METHODS;
    const validMethods = Object.keys(ARRAY_MUTATION_METHODS) as Array<ValidKeys>;
    return validMethods.includes(method as ValidKeys);
  };

  static readonly isBaseDataTypeMethod = (method: string | symbol | number): method is typeof BASE_DATE_TYPE_METHODS[number] => {
    if (typeof method !== 'string') return false;
    return (BASE_DATE_TYPE_METHODS as readonly string[]).includes(method);
  }

  static readonly getNewPath = (path: (string | symbol | number)[], key: string | symbol | number): (string | symbol | number)[] => {
    if (Number.isNaN(Number(key))) {
      return path.concat(key);
    };

    return path.concat(Number(key));
  };

  static readonly getValueOfKey = <T extends object, K extends keyof T>(target: T, key: K): T[K] => {
    try {
      return Reflect.get(target, key);
    } catch {
      return target[key];
    }
  };

  static readonly setValueOfKey = <T extends object, K extends keyof T>(target: T, key: K, value: T[K]): boolean => {
    try {
      return Reflect.set(target, key, value);
    } catch {
      try { target[key] = value; } catch { return false; }
      return true;
    }
  };
};

class Reactive<T> extends ReactiveBase {
  [REACTIVE_PROXY] = true;
  private readonly subscribers = new Set<Function>();
  private readonly propsProxyMap = new Map<string | number, any>;

  #isObject: boolean;
  #target: T extends object ? T : { value: T };
  #path: (string | symbol | number)[];
  proxy: T;

  constructor(target: T, path: (string | symbol | number)[] = [], parent: (Reactive<T> | null) = null) {
    super()
    this.#target = ReactiveBase.initTarget(target);
    this.#path = path;
    this.#isObject = ReactiveBase.isObject(target);
    this.proxy = ReactiveBase.createProxy(this.getValue, this.createHandler) as T;
  };

  private readonly createHandler = <T extends object>(): ProxyHandler<T> => {
    return {
      get: this.handleGet,
      set: this.handleSet,
      deleteProperty: this.handleDelete,
    }
  };

  private readonly createBaseProxy = <T extends (number | string)>(key: T, state: T) => {

    if (this.propsProxyMap.has(key)) return this.propsProxyMap.get(key);

    const getValue = () => {
      return state;
    };

    const setter = (value: T) => {
      if (typeof key === 'string' || typeof key === 'number') {
        if (this.propsProxyMap.has(key)) {
          const oldValue = state;
          // @ts-ignore
          ReactiveBase.setValueOfKey(this.getValue() as object, key, value);
          const newValue = ReactiveBase.getValueOfKey(this.getValue() as object, key);
          state = newValue;
          this.dispatch(oldValue, newValue);
          return newValue;
        };
        const oldValue = state;
        state = value;
        this.dispatch(oldValue, value);
      };
    };

    const proxy = new Proxy(getValue, {
      get: (_: unknown, key: string | number | symbol) => {
        if (key === REACTIVE_PROXY) return this;
        if (key === SUBSCRIBE_KEY) return this[SUBSCRIBE_KEY];
        if (key === UN_SUBSCRIBE_KEY) return this[UN_SUBSCRIBE_KEY];
        if (ReactiveBase.isBaseDataTypeMethod(key)) return setter;
        // @ts-ignore
        return state[key] as any;
      }
    });

    this.propsProxyMap.set(key, proxy);
    return proxy;
  };

  private readonly deleteBaseProxy = <T extends (number | string)>(key: T) => {
    return this.propsProxyMap.delete(key);
  };

  private createArrayMethodProxy = <T extends any[]>(array: T, method: keyof typeof ARRAY_MUTATION_METHODS) => {
    const originalMethod = ARRAY_MUTATION_METHODS[method];

    return (...args: any[]) => {
      const oldValue = this.getValue();
      const result = originalMethod.apply(array, args);
      const newValue = this.getValue();
      this.dispatch(oldValue, newValue);
      return result;
    };
  };

  private readonly handleGet = (_: unknown, key: string | symbol | number) => {
    // 特殊标志符号，用于识别是否为响应式数据
    if (key === REACTIVE_PROXY) return this;
    // 用于订阅和取消订阅
    if (key === SUBSCRIBE_KEY) return this[SUBSCRIBE_KEY];
    if (key === UN_SUBSCRIBE_KEY) return this[UN_SUBSCRIBE_KEY];
    // 基础操作
    if (ReactiveBase.isBaseDataTypeMethod(key)) {
      return this.handleSetSelf;
    }
    // 数组操作
    else if (Array.isArray(this.#target) && typeof key === 'string' && ReactiveBase.isArrayMutationMethod(key)) {
      return this.createArrayMethodProxy(this.#target, key);
    }
    // 内置属性
    else if (typeof key === 'symbol' || (typeof key === 'string' && key.startsWith('__'))) {
      return Reflect.get(this.getValue(), key);
    }
    // 属性获取
    else {
      const value = ReactiveBase.getValueOfKey(
        this.getValue() as object,
        key as string | number | symbol
      );
      // 非对象返回代理
      if (!ReactiveBase.isObject(value)) return this.createBaseProxy(key as string | number, value);

      const path = ReactiveBase.getNewPath(this.#path, key);
      const reactive = ReactiveBase.createContext(value, path, this);

      return reactive.proxy;
    };
  };

  private readonly handleSet = (_: unknown, key: string | symbol | number, value: unknown): true => {
    const oldValue = (this.getValue() as any)[key];
    ReactiveBase.setValueOfKey(this.getValue() as object, key as string | number | symbol, value as any);
    this.dispatch(oldValue, (this.getValue() as any)[key]);
    return true;
  };

  private readonly handleSetSelf = (value: T): T => {
    const oldValue = this.getValue();
    this.#target = ReactiveBase.initTarget(value);
    this.#isObject = ReactiveBase.isObject(value);
    this.dispatch(oldValue, this.getValue());
    return this.getValue() as T;
  };

  private readonly handleDelete = (_: unknown, key: string | number | symbol): boolean => {
    const oldValue = this.getValue();
    if (!ReactiveBase.isObject((oldValue as any)[key]) && typeof key === 'string') this.deleteBaseProxy(key as string | number);

    const result = Reflect.deleteProperty(this.getValue(), key);
    this.dispatch(oldValue, this.getValue());
    return result
  };

  private readonly dispatch = (oldValue: unknown, newValue: unknown) => {
    const subscribers = Array.from(this.subscribers);

    for (let i = subscribers.length - 1; i >= 0; i--) {
      subscribers[i](oldValue, newValue);
    };
  };

  private readonly [SUBSCRIBE_KEY] = (callback: Function) => {
    if (ReactiveBase.isCallback(callback)) this.subscribers.add(callback);
  };
  private readonly [UN_SUBSCRIBE_KEY] = (callback: Function) => {
    if (ReactiveBase.isCallback(callback)) this.subscribers.delete(callback);
  };

  getValue = (): T => {
    if (this.#isObject) return this.#target as T;
    return (this.#target as { value: T }).value;
  };
};

export const reactive = <T>(state: T): TargetType<T> => {
  if (!ReactiveBase.isObject(state)) {
    // @ts-ignore
    return new Reactive({ value: state }).proxy.value;
  };

  return ReactiveBase.createContext(state, [], null).proxy as TargetType<T>;
};

export const isReactive = (target: any): boolean => {
  try {
    const instance = target[REACTIVE_PROXY];
    if (instance) return true;
    return false;
  } catch {
    return false
  };
};

export const subscribe = <T>(target: TargetType<T>, callback: (oldValue: T, newValue: T) => void): boolean => {
  if (!isReactive(target)) return false;
  target[SUBSCRIBE_KEY](callback);
  return true;
};

export const unsubscribe = <T>(target: TargetType<T>, callback: (oldValue: T, newValue: T) => void): boolean => {
  if (!isReactive(target)) return false;
  target[UN_SUBSCRIBE_KEY](callback);
  return true;
};

export * from './types';