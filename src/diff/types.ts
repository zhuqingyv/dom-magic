// 临时使用 any 类型
export type VNode = any;

export type DiffActionType = 
  | 'PROPS_COLLECTING'  // 开始收集属性
  | 'PROPS_COLLECTED'   // 属性收集完毕
  | 'NODE_COMPLETE'     // 节点完成

export interface DiffAction {
  type: DiffActionType;
  target: VNode;
  payload?: {
    props?: Record<string, any>;
    key?: string | number;
  };
}

export type DiffEventCallback = (action?: DiffAction) => void; 