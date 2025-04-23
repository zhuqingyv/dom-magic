import { elementSetter } from './propsSetter';
import { childrenSetter as _childrenSetter } from './childrenSetter';
import { subscribe as _subscribes, pushVNode } from '../hook';
import { createVNode, createElement } from './document';

type DOMFactoryFunction = {
  (...children: any[]): HTMLElement;
  [key: string]: any;
};

const childrenSetter = function(this: { tagName: string; }) {
  const vnode = createVNode(this.tagName, {}, []);
  const { tagName } = vnode;
  pushVNode(vnode);
  return function ( ...children: HTMLElement[]) {
    pushVNode(vnode);
    const element = createElement(tagName);
    return _childrenSetter.bind(element)(...children);
  }
}

export const domFactory = function (tagName: string): DOMFactoryFunction {
  // @ts-ignore
  return new Proxy(childrenSetter.bind({ tagName }), {
    get(_: any, propsName: string | symbol) {
      const elementSetterResult = elementSetter.bind(createVNode(tagName, {}, []))();
      return typeof propsName === 'string' ? elementSetterResult[propsName] : undefined;
    },
  });
};

export const subscribe = <T>(reactiveObject: () => T, update: () => void): void => {
  _subscribes(reactiveObject, update);
};