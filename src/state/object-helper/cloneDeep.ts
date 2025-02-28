export const cloneDeep = <T>(source: T): T => {
  // 处理循环引用
  const seen = new WeakMap<any, any>();

  const baseClone = <U>(obj: U, depth: number): U => {
    // 处理基本类型
    if (typeof obj !== 'object' || obj === null) {
      return obj;
    }

    // 处理循环引用
    if (seen.has(obj)) {
      return seen.get(obj);
    }

    // 处理特殊对象类型
    switch (true) {
      case obj instanceof Date:
        return new Date(obj.valueOf()) as U;
      case obj instanceof RegExp:
        return new RegExp(obj) as U;
      case obj instanceof Map:
        const mapClone = new Map();
        seen.set(obj, mapClone);
        obj.forEach((v, k) => mapClone.set(baseClone(k, depth + 1), baseClone(v, depth + 1)));
        return mapClone as U;
      case obj instanceof Set:
        const setClone = new Set();
        seen.set(obj, setClone);
        obj.forEach(v => setClone.add(baseClone(v, depth + 1)));
        return setClone as U;
      case ArrayBuffer.isView(obj): // TypedArray 处理
        return new (obj.constructor as any)(obj) as U;
      case obj instanceof ArrayBuffer: // ArrayBuffer 处理
        return obj.slice(0) as U;
    }

    // 保持原型链
    const proto = Object.getPrototypeOf(obj);
    let copy: any;
    
    if (Array.isArray(obj)) {
      // 克隆数组及非索引属性
      copy = Array.from({ ...obj, length: obj.length });
      seen.set(obj, copy);
      copy = obj.map((item: any) => baseClone(item, depth + 1));
      // 复制额外属性
      const descriptors = Object.getOwnPropertyDescriptors(obj);
      for (const key of Object.keys(descriptors)) {
        if (!/^\d+$/.test(key)) {
          Object.defineProperty(copy, key, descriptors[key]);
        }
      }
    } else {
      // 普通对象处理
      copy = Object.create(proto);
      seen.set(obj, copy);
      
      // 处理所有自有属性（包括Symbol）
      Reflect.ownKeys(obj).forEach(key => {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          copy[key] = baseClone((obj as any)[key], depth + 1);
        }
      });
    }

    return copy;
  };

  return baseClone(source, 0);
};
