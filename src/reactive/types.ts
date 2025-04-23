import { SUBSCRIBE_KEY, UN_SUBSCRIBE_KEY } from './const';
export type IsObjectType<T> = T extends object ? true : false;

export type ReactivePrimitive<T> = {
  (): T;
  set: (value: T) => T;
};

export type ReactiveArray<T> = {
  [K in keyof T]: T[K];
} & {
  (): T;
  set: (value: T) => T;
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
      [SUBSCRIBE_KEY]: (callback: (oldValue: T, newValue: T) => void) => boolean;
      [UN_SUBSCRIBE_KEY]: (callback: (oldValue: T, newValue: T) => void) => boolean;
    }
  : {
      (): T;
      set: (value: T) => T;
      [SUBSCRIBE_KEY]: (callback: (oldValue: T, newValue: T) => void) => boolean;
      [UN_SUBSCRIBE_KEY]: (callback: (oldValue: T, newValue: T) => void) => boolean;
    };

export type PathType<T extends string | symbol | number> = T[];

export type CreateHandlerType<T extends object> = () => ProxyHandler<T>;