import { test, expect } from '@playwright/test';
import { hook } from '../src/hook';
import { reactive } from '../src/reactive';
import { domMagic } from '../src/dom-magic/domMagic';

const { div, span, button } = domMagic;

test.describe('集成测试', () => {
  test('计数器应用', async ({ page }) => {
    await page.goto('/');
    
    const count = reactive(0);
    const Counter = hook((props) => {
      return div.class('counter')(
        span(count),
        button.onclick(() => count.set(count() + 1))('Increment')
      );
    });
    
    const element = Counter();
    expect(element).toBeTruthy();
    
    // 初始状态
    expect(element?.querySelector('span')?.textContent).toBe('0');
    
    // 点击按钮
    element?.querySelector('button')?.click();
    expect(element?.querySelector('span')?.textContent).toBe('1');
    
    // 再次点击
    element?.querySelector('button')?.click();
    expect(element?.querySelector('span')?.textContent).toBe('2');
  });

  test('嵌套组件通信', async ({ page }) => {
    await page.goto('/');
    
    const message = reactive('Hello');
    
    const Child = hook((props) => {
      return div.class('child')(
        span(message),
        button.onclick(() => message.set('Updated'))('Update')
      );
    });
    
    const Parent = hook((props) => {
      return div.class('parent')(
        Child()
      );
    });
    
    const element = Parent();
    expect(element).toBeTruthy();
    
    // 初始状态
    expect(element?.querySelector('.child span')?.textContent).toBe('Hello');
    
    // 点击子组件按钮
    element?.querySelector('.child button')?.click();
    expect(element?.querySelector('.child span')?.textContent).toBe('Updated');
  });

  test('动态属性和子元素', async ({ page }) => {
    await page.goto('/');
    
    const Card = hook((props) => {
      return div.class(\`card \${props.theme || 'light'}\`)(
        ...(props.children || [])
      );
    });
    
    const element = Card
      .theme('dark')(
        span('Title'),
        div('Content')
      );
    
    expect(element).toBeTruthy();
    expect(element?.className).toBe('card dark');
    expect(element?.children.length).toBe(2);
    expect(element?.children[0].textContent).toBe('Title');
    expect(element?.children[1].textContent).toBe('Content');
  });

  test('响应式属性更新', async ({ page }) => {
    await page.goto('/');
    
    const title = reactive('Initial Title');
    const content = reactive('Initial Content');
    
    const Card = hook((props) => {
      return div.class('card')(
        div.class('title')(title),
        div.class('content')(content)
      );
    });
    
    const element = Card();
    expect(element).toBeTruthy();
    
    // 初始状态
    expect(element?.querySelector('.title')?.textContent).toBe('Initial Title');
    expect(element?.querySelector('.content')?.textContent).toBe('Initial Content');
    
    // 更新响应式值
    title.set('New Title');
    content.set('New Content');
    
    expect(element?.querySelector('.title')?.textContent).toBe('New Title');
    expect(element?.querySelector('.content')?.textContent).toBe('New Content');
  });
}); 