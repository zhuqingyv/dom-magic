export type IsObjectType<T> = T extends object ? true : false;

export type ReactivePrimitive<T> = {
  (): T;
  set: (value: T) => T;
  ___bind: (callback: () => void) => void;
  ___unbind: (callback: () => void) => void;
};

export type ReactiveArray<T> = {
  [K in keyof T]: T[K];
} & {
  (): T;
  set: (value: T) => T;
  ___bind: (callback: () => void) => void;
  ___unbind: (callback: () => void) => void;
};

export type ReactiveObject<T> = {
  [K in keyof T]: T[K] extends object ? ReactiveObject<T[K]> : T[K];
};

export type Reactive<T> = T extends object
  ? {
      [K in keyof T]: Reactive<T[K]>;
    } & {
      (): T;
      set: (value: T) => T;
      ___bind: (callback: () => void) => void;
      ___unbind: (callback: () => void) => void;
    }
  : {
      (): T;
      set: (value: T) => T;
      ___bind: (callback: () => void) => void;
      ___unbind: (callback: () => void) => void;
    };

export type PathType<T extends string | symbol | number> = T[];

export type CreateHandlerType<T extends object> = () => ProxyHandler<T>;