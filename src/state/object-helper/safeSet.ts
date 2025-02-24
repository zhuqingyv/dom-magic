type Primitive = string | number | boolean | symbol | bigint | null | undefined;

/**
 * 深度设置对象属性值（基础实现）
 */
function setProperty(
  obj: object,
  path: Array<string | number>,
  value: any,
  options: {
    createIfNotExist?: boolean;
    strictTypeCheck?: boolean;
  } = {}
): void {
  const { createIfNotExist = false, strictTypeCheck = true } = options;
  let current: any = obj;

  for (let i = 0; i < path.length; i++) {
    const rawKey = path[i];
    const isLast = i === path.length - 1;

    // 处理数组索引转换
    const key = typeof rawKey === 'string' && /^\d+$/.test(rawKey)
      ? parseInt(rawKey, 10)
      : rawKey;

    if (isLast) {
      current[key] = value;
      return;
    }

    // 中间路径处理
    if (current[key] === undefined) {
      if (!createIfNotExist) return;
      
      const nextKey = path[i + 1];
      const shouldCreateArray = typeof nextKey === 'number' || 
        (typeof nextKey === 'string' && /^\d+$/.test(nextKey));
      
      current[key] = shouldCreateArray ? [] : {};
    } else if (strictTypeCheck) {
      const isValidType = typeof current[key] === 'object' && current[key] !== null;
      const isArrayType = Array.isArray(current[key]);
      const nextKey = path[i + 1];
      
      if (typeof nextKey === 'number' && !isArrayType) {
        throw new Error(`Path conflict: ${key} is not an array`);
      }
      
      if (typeof nextKey === 'string' && isArrayType) {
        throw new Error(`Path conflict: ${key} is an array but got string key`);
      }

      if (!isValidType) {
        throw new Error(`Invalid type at path ${path.slice(0, i + 1).join('.')}`);
      }
    }

    current = current[key];
  }
}

/**
 * 类型安全的路径生成类型（优化递归）
 */
type Path<T> = (
  T extends Primitive
  ? []
  : T extends Array<infer U>
    ? [number, ...Path<U>] | [number]
    : {
        [K in keyof T]: [K, ...Path<T[K]>] | [K]
      }[keyof T]
) & string[];

/**
 * 类型安全的深度设置方法
 * @param path 必须使用as const断言
 */
export function safeSet<
  T extends object,
  P extends Path<T> extends infer Q ? Q extends Array<string | number> ? Q : never : never
>(
  obj: T,
  path: P,
  value: (P extends [...infer R, infer K] 
    ? K extends keyof (R extends any ? GetNestedType<T, R> : never)
      ? (R extends any ? GetNestedType<T, R> : never)[K]
      : never
    : never) | any,
  options?: Parameters<typeof setProperty>[3]
) {
  return setProperty(obj, path as Array<string | number>, value, options);
}

/**
 * 辅助类型：获取嵌套类型
 */
type GetNestedType<T, P extends any[]> = 
  P extends [infer K, ...infer Rest]
    ? K extends keyof T
      ? GetNestedType<T[K], Rest>
      : never
    : T;
