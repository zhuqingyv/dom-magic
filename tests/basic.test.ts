import { test, expect } from '@playwright/test';
import { reactive } from '../src/reactive';
import { useSignal, useComputed } from '../src/signal';
import { hook } from '../src/hook';
import { domMagic } from '../src/dom-magic/domMagic';

const { div, span, button } = domMagic;

test.beforeEach(() => {
  // 每次测试前清理 DOM
  if (document.body) {
    document.body.innerHTML = '';
  }
});

test.describe('响应式系统测试', () => {
  test('reactive 基础类型', () => {
    const count = useSignal(0);
    expect(count()).toBe(0);
    
    count.set(1);
    expect(count()).toBe(1);
  });

  test('reactive 对象属性', () => {
    const user = useSignal({ name: 'John', age: 25 });
    expect(user().name).toBe('John');
    expect(user().age).toBe(25);

    user.set({ name: 'Jane', age: 30 });
    expect(user().name).toBe('Jane');
    expect(user().age).toBe(30);
  });

  test('reactive 数组操作', () => {
    const list = useSignal([1, 2, 3]);
    expect(list()).toEqual([1, 2, 3]);

    list().push(4);
    expect(list()).toEqual([1, 2, 3, 4]);

    list().pop();
    expect(list()).toEqual([1, 2, 3]);
  });

  test('reactive 订阅更新', () => {
    const count = useSignal(0);
    let updated = false;
    
    count.___bind(() => {
      updated = true;
    });

    count.set(1);
    expect(updated).toBe(true);
  });
});

test.describe('DOM 操作测试', () => {
  test('DOM 环境', () => {
    expect(window).toBeDefined();
    expect(document).toBeDefined();
    expect(document.createElement('div')).toBeInstanceOf(HTMLElement);
  });

  test('hook 组件创建', () => {
    const count = useSignal(0);
    
    const Counter = hook(() => {
      return div.class('counter')(
        span(count),
        button.onclick(() => count.set(count() + 1))('Add')
      );
    });

    const element = Counter();
    expect(element).toBeDefined();
    expect(element?.className).toBe('counter');
    expect(element?.querySelector('span')?.textContent).toBe('0');

    // 模拟点击
    element?.querySelector('button')?.click();
    expect(element?.querySelector('span')?.textContent).toBe('1');
  });

  test('组件属性和子元素', () => {
    const Card = hook((props: { title: string }) => {
      return div.class('card')(
        div.class('title')(props.title)
      );
    });

    const element = Card.title('Hello World')();
    expect(element?.className).toBe('card');
    expect(element?.querySelector('.title')?.textContent).toBe('Hello World');
  });

  test('动态属性更新', () => {
    const visible = useSignal(true);
    const computedVisible = useComputed(visible, () => visible() ? 'show' : 'hide');
    
    const Toggle = hook(() => {
      return div.class(computedVisible)('Content');
    });

    const element = Toggle();
    expect(element?.className).toBe('show');

    visible.set(false);
    expect(element?.className).toBe('hide');
  });
}); 