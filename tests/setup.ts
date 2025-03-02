import { JSDOM } from 'jsdom';

export default async function setup() {
  const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  // 模拟浏览器全局对象
  global.window = dom.window as unknown as Window & typeof globalThis;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;
  global.Element = dom.window.Element;
  global.Node = dom.window.Node;

  // 模拟事件
  global.Event = dom.window.Event;
  global.CustomEvent = dom.window.CustomEvent;

  // 模拟 navigator
  Object.defineProperty(global, 'navigator', {
    value: dom.window.navigator,
    writable: true,
    configurable: true
  });
}

// 清理函数
export const cleanup = () => {
  if (document.body) {
    document.body.innerHTML = '';
  }
}; 