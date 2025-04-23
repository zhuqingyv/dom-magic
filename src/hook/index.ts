import { Component, ComponentBase, pushVNode } from './component';

export const hook = (render: any, shouldUpdate?: any) => {
  const renderProxy = (...args: any) => {
    // // 检查当前父hook是否走缓存
    // const memo = ComponentBase.useMemo(renderProxy);

    // if (memo) {
    //   const result = memo.update();
    //   if (result) return result;
    // };

    // return render(...args);
  };

  // 这里创建实例
  const createInstance = () => {
    const instance = new Component(render, shouldUpdate);
    pushVNode(instance);

    const proxy = new Proxy(renderProxy, {
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

  return new Proxy(renderProxy, {
    get(_: any, prop: string) {
      return createInstance()[prop]
    },
    apply(_: any, __: any, ...args: any[]) {
      return createInstance()(...args);
    }
  });
};

export const subscribe = (reactiveObject: any, updateHandler: any) => {
  ComponentBase.interceptReactive(reactiveObject, updateHandler);
};

export { pushVNode } from './component';