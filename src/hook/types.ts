export type { Reactive as ReactiveObject } from '../reactive/types';

export interface UpdateCallback {
  (): void;
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

export enum HookStatus {
  INIT = 'init',
  UPDATE = 'update',
};

export type VDomType = {
  tagName: string;
  propss: object;
  events: {
    [key: string]: (event: Event) => void;
  }
};