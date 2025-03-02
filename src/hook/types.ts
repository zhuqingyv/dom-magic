import { Reactive } from '../reactive';

export interface UpdateCallback {
  (): void;
}

export interface ReactiveObject<T> {
  (): T;
  ___bind: (callback: UpdateCallback) => void;
  ___unbind: (callback: UpdateCallback) => void;
}

// 定义Props接口
export interface Props {
  [key: string]: any;
  children?: any[];
}

// 定义HookComponent类型
export type HookComponent<P extends Props = Props> = {
  (children?: any[]): HTMLElement | null;
  [key: string]: any;
}; 

export type PropFunction = {
  (...args: any[]): any;
  render: (children?: any[]) => HTMLElement | null;
};