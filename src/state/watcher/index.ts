import { cloneDeep, safeSet } from '../object-helper';

type Path = (string | symbol)[];
type WatcherCallback<T = unknown> = (path: Path, oldValue: T, newValue?: T) => void;
type ComputedCallback<T = unknown> = (newValue: T, path: Path) => void;
type Computed<T = unknown> = (target: T, path: Path) => T;
type HandlerGet<T = unknown> = (target: T, key: string | symbol) => T[keyof T] | HandlerSet<T>;
type HandlerSet<T = unknown> = (target: T, key: string | symbol, value: T[keyof T]) => boolean;
type HandlerValue<T = unknown> = (computed: Computed<T>) => T;

const ARRAY_MUTATION_METHODS = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'] as const;
const BASE_DATE_TYPE_METHODS = ['set', 'get'] as const;

type MagicProxy<R, T> = {
  (): T;
} & T & DeepWatcher<R, T>;

export class DeepWatcher<R = unknown, T = unknown> {
  private static readonly proxyMap = new WeakMap<object, any>();
  private static readonly toRaw = new WeakMap<any, any>();
  private static readonly methodCallContext = new WeakMap<object, boolean>();
  
  rootTarget: R;
  target: T;
  proxy: MagicProxy<R, T>;
  private readonly path: Path;
  private readonly callback: WatcherCallback;

  static readonly isArrayMutationMethod(method: string): method is typeof ARRAY_MUTATION_METHODS[number] {
    return ARRAY_MUTATION_METHODS.includes(method);
  }

  static readonly isBaseDataTypeMethod(method: string): method is typeof BASE_DATE_TYPE_METHODS[number] {
    return BASE_DATE_TYPE_METHODS.includes(method);
  }

  static readonly isBaseDataType (data: any) {
    if (typeof data === 'string' || typeof data === 'number' || typeof data === 'boolean' || typeof data === 'bigint' || typeof data === 'symbol' || data === null || data === undefined) return true;
  };

  static readonly getValueOfKey(target: any, key: string | symbol): any {
    try {
      return Reflect.get(target, key);
    } catch {
      return target[key];
    }
  }

  static readonly setValueOfKey(target: any, key: string | symbol, value: any): boolean {
    try {
      return Reflect.set(target, key, value);
    } catch {
      target[key] = value;
      return true;
    }
  }

  static readonly setValueOfPath(target: any, path: Path, value: any): void {
    safeSet(target, path, value);
  }

  static readonly getNewPath(path: Path, key: string | symbol | number): Path {
    if (Number.isNaN(Number(key))) {
      return path.concat(key);
    };

    return path.concat(Number(key));
  };

  constructor(
    rootTarget: R,
    target: T,
    callback: WatcherCallback,
    path: Path = []
  ) {
    this.rootTarget = rootTarget || target as unknown as R;
    this.target = target;
    this.callback = callback;
    this.path = path;
    this.proxy = this.createProxy() as MagicProxy<R, T>;
    return this.proxy as MagicProxy<R, T>;
  }

  private readonly createProxy(): MagicProxy<R, T> {
    // 基础类型直接返回一个代理对象
    if (DeepWatcher.isBaseDataType(this.target)) return new Proxy(this.getValueWithComputed as any, this.createHandler());
    // 其他类型先从WeakMap中查找
    const existingProxy = DeepWatcher.proxyMap.get(this.target);
    if (existingProxy) return existingProxy;
    // 没查到则直接创建
    const proxy = new Proxy(this.target, this.createHandler());
    DeepWatcher.proxyMap.set(this.target, proxy);
    DeepWatcher.toRaw.set(proxy, this.target);
    return proxy;
  }

  private readonly getValue = (): T => this.target;

  // 创建一个泛型方法，用于创建一个代理处理器
  private createHandler = <T>(): ProxyHandler<HandlerValue<T>> => {
    // 返回一个代理处理器对象
    return {
      // 当代理对象被读取属性时，调用handleGet方法
      get: (target, key) => this.handleGet(target, key),
      // 当代理对象被设置属性时，调用handleSet方法
      set: (target, key, value) => this.handleSet(target, key, value),
      // 当代理对象被调用时，调用handleApply方法
      apply: (target, _, argArray) => this.handleApply(target as T, argArray),
      // 当代理对象被删除属性时，调用handleDelete方法
      deleteProperty: (target, key) => this.handleDelete(target, key)
    };
  }

  private readonly createBaseDataTypeHandler = (key: [keyof BASE_DATE_TYPE_METHODS]) => {
    switch(key) {
      case 'set': {
        return (value: any) => {
          const oldValue = cloneDeep(this.target);
          const newValue = this.target;
          this.callback(this.path, oldValue, newValue);
          this.target = value;
          DeepWatcher.setValueOfPath(this.rootTarget, this.path, this.target);
          return this.proxy;
        }
      }
      case 'get':
      default: {
        return this.getValueWithComputed
      }
    }
  }

  private createArrayMethodProxy(array: any[], method: string): Function {
    const originalMethod = array[method as keyof any[]];
    
    return (...args: any[]) => {
      const oldArray = cloneDeep(array);
      DeepWatcher.methodCallContext.set(array, true);
      
      const result = originalMethod.apply(array, args);
      
      DeepWatcher.methodCallContext.set(array, false);
      const proxyArray = DeepWatcher.proxyMap.get(array) || array;
      this.callback(this.path, oldArray, proxyArray);
      
      return result;
    };
  }

  private readonly handleGet = (target: T, key: string | symbol): unknown => {
    if (DeepWatcher.isArrayMutationMethod(key as string)) {
      // 数组方法处理
      return this.createArrayMethodProxy(this.target, key as string);
    } else if (DeepWatcher.isBaseDataTypeMethod(key as string)) {
      // 基础数据类型方法处理
      return this.createBaseDataTypeHandler(key)
    } else {
      const value = DeepWatcher.getValueOfKey(this.target, key);
      if (DeepWatcher.isBaseDataType(value)) return new DeepWatcher(this.rootTarget, value, this.callback, DeepWatcher.getNewPath(this.path, key));
      return this.getProxyOfTarget(value, key);
    };
  }

  private readonly handleSet = (target: T, key: string | symbol, value: any): boolean => {
    const oldValue = cloneDeep(this.target);
    const result = DeepWatcher.setValueOfKey(this.target, key, value);
    this.callback([...this.path, key as string], oldValue, value);
    return result;
  }

  private readonly handleApply = (target: T, argArray: any[]): any => {
    // 保持原有逻辑
    return (target as unknown as Function)(...argArray);
  }

  private readonly handleDelete = (target: T, key: string | symbol): boolean => {
    const oldValue = cloneDeep(target);
    const result = Reflect.deleteProperty(target, key);
    this.callback([...this.path, key as string], oldValue);
    return result;
  }

  private readonly getProxyOfTarget = <T> (target: T, key: string | symbol): MagicProxy<R, T> => {
    if (DeepWatcher.proxyMap.has(target)) return DeepWatcher.proxyMap.get(target);
    const proxy = new DeepWatcher<T, T>(this.rootTarget, target, this.callback, DeepWatcher.getNewPath(this.path, key));
    DeepWatcher.proxyMap.set(target, proxy);
    return proxy;
  };

  private readonly getValueWithComputed = (computed: ComputedCallback<T>) => {
    if (computed && computed instanceof Function) return computed(this.target);
    return this.target;
  }
}

export const watcher = function <T extends object>(target: T, callback: WatcherCallback): T & (() => T) {
  return new DeepWatcher(null, target, callback, []);
};