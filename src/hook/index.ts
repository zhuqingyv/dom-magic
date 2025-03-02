import { Component, ComponentBase } from './component';

export const hook = (render: any, shouldUpdate?: any) => {
  // 这里创建实例
  const createInstance = () => {
    const instance = new Component(render, shouldUpdate);

    const proxy = new Proxy(render, {
      get(_: any, prop: string) {
        return (value: any) => {
          instance.setProps(prop, value);
          return proxy;
        };
      },
      apply(_: any, __: any, args: any[]) {
        return instance.render(args);
      }
    });

    return proxy;
  };

  return new Proxy(render, {
    get(_: any, prop: string) {
      return createInstance()[prop]
    },
    apply(_: any, __: any, args: any[]) {
      return createInstance()(args);
    }
  });
};

export const subscribe = (reactiveObject: any, updateHandler: any) => {
  ComponentBase.interceptReactive(reactiveObject, updateHandler);
};