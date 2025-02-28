import { ARRAY_MUTATION_METHODS, BASE_DATE_TYPE_METHODS } from './const';
import { Reactive as TargetType, PathType, CreateHendlerType } from './types';

let status: boolean = false;

class ReactiveBase {
  static readonly contextMap = new WeakMap<object, Reactive<any>>;

  static readonly initTarget = <T>(target: T) => {
    return (
      typeof target === "object" && target !== null
        ? target
        : { value: target }
    ) as T extends object ? T : { value: T };
  };

  static readonly createProxy = <T extends object>(target: TargetType<T>, createHandler: CreateHendlerType<TargetType<T>>): TargetType<T> => {
    return new Proxy(target, createHandler()) as TargetType<T>;
  };

  static readonly createContext = <T extends object>(target: T, path: (string | symbol | number)[], parent: Reactive<any> | null): Reactive<T> => {
    const context = ReactiveBase.contextMap.get(target) || new Reactive<T>(target, path, parent);
    ReactiveBase.contextMap.set(target, context);
    return context;
  };

  static readonly isObject = (value: unknown): value is object | Function => {
    return value !== null && (typeof value === 'object' || typeof value === 'function');
  };

  static readonly isCallback = (callback: any) => {
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
    // 通过 Array.prototype.includes 的类型重载
    return (BASE_DATE_TYPE_METHODS as readonly string[]).includes(method);
  }

  static readonly getNewPath = (path: (string | symbol | number)[], key: string | symbol | number): (string | symbol | number)[] => {
    if (Number.isNaN(Number(key))) {
      return path.concat(key);
    };

    return path.concat(Number(key));
  };

  static readonly getValueOfKey = (target: any, key: string | symbol | number): any => {
    try {
      return Reflect.get(target, key);
    } catch {
      return target[key];
    }
  };

  static readonly setValueOfKey = (target: any, key: string | symbol | number, value: any): boolean => {
    try {
      return Reflect.set(target, key, value);
    } catch {
      target[key] = value;
      return true;
    }
  };

  static readonly subscribe = (getValue: () => any, callback: () => any): boolean => {
    if (!callback) return false;

    if (ReactiveBase.isObject(getValue())) {
      const context = ReactiveBase.contextMap.get(getValue());
      if (context) {
        const proxy = context.proxy;
      };
    }
  };

  static readonly changeStatus = (_status: boolean): boolean => {
    return status = !status;
  };

  static readonly status = () => {
    return status;
  };

  static readonly canSubscribe = () => {
    return status === true;
  };
};

class Reactive<T> extends ReactiveBase {
  private readonly subscribers = new Set<Function>();
  private readonly reactives = new Map<string, Reactive<any>>;
  private readonly propsProxyMap = new Map<string | number, any>;

  #isObject: boolean;
  #target: T extends object ? T : { value: T };
  #path: PathType<number | string | symbol>;
  #parent: Reactive<T> | null;
  proxy: TargetType<T>;

  constructor(target: T, path: (string | symbol | number)[] = [], parent: (Reactive<T> | null) = null) {
    super()
    this.#target = ReactiveBase.initTarget(target);
    this.#path = path;
    this.#parent = parent;
    this.#isObject = ReactiveBase.isObject(target);
    this.proxy = ReactiveBase.createProxy(this.getValue, this.createHandler) as TargetType<T>;
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

    const getValue = <F extends Function>(callback?: F, immediately = false) => {
      // 这里执行订阅
      if (ReactiveBase.canSubscribe() && callback && ReactiveBase.isCallback(callback)) {
        this.subscribers.add(callback);
        if (immediately) {
          callback(state, state);
        };
        return true;
      };
  
      return state;
    }

    const setter = (value: T) => {
      if (this.propsProxyMap.has(key)) {
        const oldValue = state;
        ReactiveBase.setValueOfKey(this.getValue(), key, value);
        const newValue = ReactiveBase.getValueOfKey(this.getValue(), key);
        state = newValue;
        this.dispatch(oldValue, newValue);
        return newValue;
      };
      const oldValue = state;
      state = value;
      this.dispatch(oldValue, value);
      
    };

    const proxy = new Proxy(getValue, {
      get(_: any, key: string | number | symbol) {
        if (ReactiveBase.isBaseDataTypeMethod(key)) {
          return setter;
        };
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
    if (ReactiveBase.isBaseDataTypeMethod(key) && !Reactive.isObject(this.getValue())) {
      return this.handleSetSelf;
    }
    else if (Array.isArray(this.#target) && typeof key === 'string' && ReactiveBase.isArrayMutationMethod(key)) {
      return this.createArrayMethodProxy(this.#target, key);
    }
    else {
      const value = ReactiveBase.getValueOfKey(this.#target, key);
      // 非对象返回代理
      if (!ReactiveBase.isObject(value)) return this.createBaseProxy(key, value);

      const path = ReactiveBase.getNewPath(this.#path, key);
      const reactive = ReactiveBase.createContext(value, path, this);

      return reactive.proxy;
    };
  };

  private readonly handleSet = (_: unknown, key: string | symbol | number, value: any): true => {
    const oldValue = this.getValue()[key];
    ReactiveBase.setValueOfKey(this.#target, key, value);
    this.dispatch(oldValue, this.getValue()[key]);
    return true;
  };

  private readonly handleSetSelf = (value: any) => {
    const oldValue = this.getValue();
    this.#target = ReactiveBase.initTarget(value);
    this.#isObject = ReactiveBase.isObject(value);
    if (this.#parent) this.#parent.handleSet(null, this.#path[this.#path.length - 1], this.getValue());
    this.dispatch(oldValue, this.getValue());
    return this.getValue();
  };

  private readonly handleDelete = (_: unknown, key: string | number | symbol): boolean => {
    const oldValue = this.getValue();
    if (!ReactiveBase.isObject(oldValue[key]) && typeof key === 'string') this.deleteBaseProxy(key);

    const result = Reflect.deleteProperty(this.getValue(), key);
    this.dispatch(oldValue, this.getValue());
    return result
  };

  private readonly dispatch = (oldValue: any, newValue: any) => {
    this.subscribers.forEach(cb => cb(oldValue, newValue))
  };

  // 这里获取的是真实的值
  getValue = <F extends Function>(callback?: F, immediately = false) => {
    // 这里执行订阅
    if (ReactiveBase.canSubscribe() && callback && ReactiveBase.isCallback(callback)) {
      this.subscribers.add(callback);
      if (immediately) {
        const value = this.getValue();
        callback(value, value);
      };
      return true;
    };

    if (this.#isObject) return this.#target;
    // @ts-ignore
    return this.#target?.value;
  };
};

// 开始绑定
export const startSubscribe = (callback: any) => {
  if (ReactiveBase.isCallback(callback)) {
    ReactiveBase.changeStatus(true);
    callback();
    ReactiveBase.changeStatus(false);
  };
};

export const reactive = <T>(state: T): TargetType<T> => {
  if (ReactiveBase.isObject(state)) {
    return ReactiveBase.createContext(state, [], null).proxy;
  } else {
    return new Reactive(state, [], null).proxy;
  };
};