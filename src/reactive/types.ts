export type IsObjectType<T> = T extends object ? true : false;

// 类型定义
type ReactivePrimitive<T> = T & {
  set: (value: T) => void;
  (callback?: Function, immediately?: boolean): T;
  readonly _brand: unique symbol;
};

export type Reactive<T> = T extends object
  ? (T extends any[] ? { [K in keyof T]: T[K] }[] : { [K in keyof T]: Reactive<T[K]> })
  : T extends string | number | boolean
  ? ReactivePrimitive<T>
  : T;

export type PathType<T extends string | symbol | number> = T[];

export type CreateHendlerType<T extends object> = {
  (): ProxyHandler<T>;
};