import { VDom } from './VDom';
import { handerProxy } from '@base';

const {
  createComment: _createComment,
  createTextNode: _createTextNode,
  createElement: _createElement
} = document;

export const createElement = handerProxy(_createElement.bind(document));
export const createComment = handerProxy(_createComment.bind(document));
export const createTextNode = handerProxy(_createTextNode.bind(document));
export const equallyElement = (a: Node, b: Node): boolean => {
  if (a instanceof HTMLElement && b instanceof HTMLElement) {
    return a.outerHTML === b.outerHTML;
  }
  else {
    return a.nodeValue === b.nodeValue;
  }
};

export const createVNode = (tagName: string = 'div', props: any = {}, children: any[] = []) => {
  return {
    tagName,
    props,
    children
  };
};

export { VDom };

