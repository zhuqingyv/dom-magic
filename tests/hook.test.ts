import { test, expect } from '@playwright/test';
import { hook } from '../src/hook';
import { reactive } from '../src/reactive';
import { domMagic } from '../src/dom-magic/domMagic';

const { div, span, button } = domMagic;

test.describe('Hook系统测试', () => {
  test('基础组件渲染', async ({ page }) => {
    await page.goto('/');
    
    const TestComponent = hook((props) => {
      return div.class('test')(
        span('Hello World')
      );
    });
    
    const element = TestComponent();
    expect(element).toBeTruthy();
    expect(element?.tagName).toBe('DIV');
    expect(element?.className).toBe('test');
    expect(element?.textContent).toBe('Hello World');
  });

  test('组件Props传递', async ({ page }) => {
    await page.goto('/');
    
    const TestComponent = hook((props) => {
      return div.class('test')(
        span(props.text)
      );
    });
    
    const element = TestComponent.text('Hello Props')();
    expect(element).toBeTruthy();
    expect(element?.textContent).toBe('Hello Props');
  });

  test('组件响应式更新', async ({ page }) => {
    await page.goto('/');
    
    const count = reactive(0);
    const TestComponent = hook((props) => {
      return div.class('test')(
        span(count)
      );
    });
    
    const element = TestComponent();
    expect(element).toBeTruthy();
    expect(element?.textContent).toBe('0');
    
    count.set(1);
    expect(element?.textContent).toBe('1');
  });

  test('组件事件处理', async ({ page }) => {
    await page.goto('/');
    
    let clicked = false;
    const TestComponent = hook((props) => {
      return div.class('test')(
        button.onclick(() => {
          clicked = true;
        })('Click me')
      );
    });
    
    const element = TestComponent();
    expect(element).toBeTruthy();
    
    const btn = element?.querySelector('button');
    btn?.click();
    expect(clicked).toBe(true);
  });

  test('组件子元素传递', async ({ page }) => {
    await page.goto('/');
    
    const TestComponent = hook((props) => {
      return div.class('test')(
        ...(props.children || [])
      );
    });
    
    const element = TestComponent(
      span('Child 1'),
      span('Child 2')
    );
    
    expect(element).toBeTruthy();
    expect(element?.children.length).toBe(2);
    expect(element?.children[0].textContent).toBe('Child 1');
    expect(element?.children[1].textContent).toBe('Child 2');
  });

  test('组件链式调用', async ({ page }) => {
    await page.goto('/');
    
    const TestComponent = hook((props) => {
      return div.class(props.className)(
        span(props.text)
      );
    });
    
    const element = TestComponent
      .className('test-class')
      .text('Hello Chain')();
    
    expect(element).toBeTruthy();
    expect(element?.className).toBe('test-class');
    expect(element?.textContent).toBe('Hello Chain');
  });
}); 