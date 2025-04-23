import { eventSetter } from "./eventsSetter";
import { childrenSetter } from "./childrenSetter";
import { createElement } from './document';
import { subscribe } from "./domFactory";
import { isReactive } from "../reactive";
import { pushVNode } from "../hook";

type ElementProxy = {
  (...children: any[]): HTMLElement;
  [key: string]: (value: string | number | boolean | (() => string | number | boolean) | ((event: Event) => void)) => ElementProxy;
};

export const elementSetter = function (this: { tagName: string; props: any; children: any[] }): ElementProxy {
  const element = createElement(this.tagName);
  pushVNode(this);

  const finish = (...children: any[]): HTMLElement => {
    pushVNode(this);
    childrenSetter.bind(element)(...children);
    return element;
  };

  const propSetter = (propName: string) => {
    return (value: any): ElementProxy => {
      if (isReactive(value)) {
        const update = () => {
          const computedValue = value();
          element.setAttribute(propName, String(computedValue));
        };

        subscribe(value, update);
        update();
      } else {
        element.setAttribute(propName, String(value));
      };

      return proxy;
    };
  };

  const setter = (propName: string) => {
    // 事件
    if (propName.startsWith('on')) {
      const eventHandler = eventSetter.bind(element)(propName);
      return (callback: (event: Event) => void): ElementProxy => {
        eventHandler(callback);
        return proxy;
      };
    } else {
      return propSetter(propName);
    }
  };

  const proxy = new Proxy(finish, {
    get(_: any, propName: string | symbol): any {
      return typeof propName === 'string' ? setter(propName) : undefined;
    }
  }) as ElementProxy;

  return proxy;
};