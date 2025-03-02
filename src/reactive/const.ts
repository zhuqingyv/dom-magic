/**
 * 用以识别数组相关的操作
*/
type ArrayMutationMethods = {
  push: typeof Array.prototype.push;
  pop: typeof Array.prototype.pop;
  shift: typeof Array.prototype.shift;
  unshift: typeof Array.prototype.unshift;
  splice: typeof Array.prototype.splice;
  sort: typeof Array.prototype.sort;
  reverse: typeof Array.prototype.reverse
};

export const ARRAY_MUTATION_METHODS: ArrayMutationMethods = {
  push: Array.prototype.push,
  pop: Array.prototype.pop,
  shift: Array.prototype.shift,
  unshift: Array.prototype.unshift,
  splice: Array.prototype.splice,
  sort: Array.prototype.sort,
  reverse: Array.prototype.reverse
} as const;

/**
 * 用以识别通用操作
*/
export const BASE_DATE_TYPE_METHODS = ['set'] as const;

// 订阅
export const BIND_METHODS = ['___bind', '___unbind'];