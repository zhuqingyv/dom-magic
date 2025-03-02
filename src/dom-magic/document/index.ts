import { VDom } from './VDom';

const {
  createComment: _createComment,
  createTextNode: _createTextNode,
  createElement: _createElement
} = document;

// 创建 VDom 实例的工厂函数
export const createElement = _createElement.bind(document);

export const createComment = _createComment.bind(document);
export const createTextNode = _createTextNode.bind(document);
export const equallyElement = (a: Node, b: Node): boolean => {
  if (a instanceof HTMLElement && b instanceof HTMLElement) {
    return a.outerHTML === b.outerHTML;
  }
  else {
    return a.nodeValue === b.nodeValue;
  }
};

export { VDom };