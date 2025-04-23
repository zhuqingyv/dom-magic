import { domFactory } from './domFactory';

type DOMFactoryFunction = ReturnType<typeof domFactory>;

type DOMElements = {
  [K in keyof HTMLElementTagNameMap]: DOMFactoryFunction;
} & {
  (tagName: string): DOMFactoryFunction;
};

const proxyHandler: ProxyHandler<typeof domFactory> = {
  get(_: typeof domFactory, tagName: string | symbol = 'div'): DOMFactoryFunction {
    return typeof tagName === 'string' ? domFactory(tagName) : domFactory('div');
  }
};

export const domMagic: DOMElements = new Proxy(domFactory, proxyHandler) as unknown as DOMElements;