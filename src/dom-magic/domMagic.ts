import { domFactory } from './domFactory';

type DOMFactoryFunction = ReturnType<typeof domFactory>;

type DOMElements = {
  [K in keyof HTMLElementTagNameMap]: DOMFactoryFunction;
} & {
  (tagName: string): DOMFactoryFunction;
};

const proxyHandler: ProxyHandler<typeof domFactory> = {
  get(_: typeof domFactory, tagName: string | symbol): DOMFactoryFunction {
    return typeof tagName === 'string' ? domFactory(tagName) : domFactory('div');
  },
  apply(target: typeof domFactory, _: any, args: any[]): DOMFactoryFunction {
    return target(args[0]);
  }
};

export const domMagic: DOMElements = new Proxy(domFactory, proxyHandler) as unknown as DOMElements;