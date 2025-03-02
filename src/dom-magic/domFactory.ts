import { elementSetter } from './propsSetter';
import { childrenSetter as _childrenSetter } from './childrenSetter';
import { subscribe as _subscribes } from '../hook';

const _createElement = document.createElement.bind(document);

type DOMFactoryFunction = {
  (...children: any[]): HTMLElement;
  [key: string]: any;
};

const childrenSetter = function(this: { tagName: string }) {
  const { tagName } = this;
  return function ( ...children: HTMLElement[]) {
    const element = _createElement(tagName);
  return _childrenSetter.bind(element)(...children);
  }
}

export const domFactory = function (tagName: string): DOMFactoryFunction {
  // @ts-ignore
  return new Proxy(childrenSetter.bind({ tagName }), {
    get(_: DOMFactoryFunction, propsName: string | symbol) {
      const elementSetterResult = elementSetter.bind(tagName)();
      return typeof propsName === 'string' ? elementSetterResult[propsName] : undefined;
    }
  });
};

export const subscribe = <T>(reactiveObject: () => T, update: () => void): void => {
  _subscribes(reactiveObject, update);
};