type Path = string[];// 这里需要修改
type WatcherCallback<T = any> = (path: Path, oldValue: T, newValue: T) => void;
const ARRAY_MUTATION_METHODS = ['push', 'pop', 'shift', 'unshift', 'splice', 'sort', 'reverse'] as const;

class DeepWatcher<T extends object> {
  private static readonly proxyMap = new WeakMap<object, any>();
  private static readonly toRaw = new WeakMap<any, any>();
  private static readonly methodCallContext = new WeakMap<object, boolean>();
  
  private readonly path: Path;
  private readonly callback?: WatcherCallback;

  constructor(
    private readonly target: T,
    callback?: WatcherCallback,
    path: Path = []
  ) {
    this.path = path;
    this.callback = callback;
  }

  static create<T extends object>(target: T, callback?: WatcherCallback): T {
    return new DeepWatcher(target, callback).createProxy();
  }

  private createProxy(): T {
    if (typeof this.target !== 'object' || this.target === null) {
      return this.target;
    }

    const existingProxy = DeepWatcher.proxyMap.get(this.target);
    if (existingProxy) return existingProxy;

    const proxy = new Proxy(this.target, this.createHandler());
    DeepWatcher.proxyMap.set(this.target, proxy);
    DeepWatcher.toRaw.set(proxy, this.target);
    return proxy;
  }

  private createHandler(): ProxyHandler<T> {
    return {
      get: (target, key) => this.handleGet(target, key),
      set: (target, key, value) => this.handleSet(target, key, value),
      apply: (target, _, argArray) => this.handleApply(target as T, argArray),
      deleteProperty: (target, key) => this.handleDelete(target, key)
    };
  }

  private handleGet(target: T, key: string | symbol): any {
    const value = target[key as keyof T];

    if (Array.isArray(target) && typeof key === 'string') {
      if (this.isArrayMutationMethod(key)) {
        return this.createArrayMethodProxy(target, key);
      }
    }

    if (typeof value === 'object' && value !== null) {
      return new DeepWatcher(value, this.callback, [...this.path, String(key)]).createProxy();
    }

    return value;
  }

  private handleSet(target: T, key: string | symbol, value: any): boolean {
    const rawValue = DeepWatcher.toRaw.get(value) ?? value;
    // 数据未修改，不触发回调
    if (rawValue === value) return true;

    const oldValue = this.cloneDeep(target[key as keyof T]);
    target[key as keyof T] = rawValue;

    if (!DeepWatcher.methodCallContext.get(target)) {
      const newValue = this.handleGet(target, key);
      this.triggerCallback([...this.path, String(key)], oldValue, newValue);
    }

    return true;
  }

  private handleDelete(target: T, key: string | symbol): boolean {
    const oldValue = this.cloneDeep(target[key as keyof T]);
    const deleted = Reflect.deleteProperty(target, key);

    if (deleted && !DeepWatcher.methodCallContext.get(target)) {
      this.triggerCallback([...this.path, String(key)], oldValue);
    }

    return deleted;
  }

  private handleApply(_: T, __: any, argArray?: any[]): any {
    return typeof argArray?.[0] === 'function' 
      ? argArray[0](this.target)
      : this.target;
  }

  private isArrayMutationMethod(method: string): method is typeof ARRAY_MUTATION_METHODS[number] {
    return ARRAY_MUTATION_METHODS.includes(method as any);
  }

  private createArrayMethodProxy(array: any[], method: string): Function {
    const originalMethod = array[method as keyof any[]];
    
    return (...args: any[]) => {
      const oldArray = this.cloneDeep(array);
      DeepWatcher.methodCallContext.set(array, true);
      
      const result = originalMethod.apply(array, args);
      
      DeepWatcher.methodCallContext.set(array, false);
      const proxyArray = DeepWatcher.proxyMap.get(array) || array;
      this.triggerCallback(this.path, oldArray, proxyArray);
      
      return result;
    };
  }

  private triggerCallback<T>(path: Path, oldValue: T, newValue?: T) {
    if (this.callback) {
      this.callback(path, oldValue, newValue);
    }
  }

  private cloneDeep<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') {
      return obj;
    }

    if (Array.isArray(obj)) {
      const copy = [] as any[];
      for (const item of obj) {
        copy.push(this.cloneDeep(item));
      }
      return copy as T;
    }

    const copy = {} as T;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        copy[key as keyof T] = this.cloneDeep(obj[key]);
      }
    }
    return copy;
  }
}


// 导出工厂函数
export const watch = <T extends object>(target: T, callback?: WatcherCallback): T => {
  return DeepWatcher.create(target, callback);
};

