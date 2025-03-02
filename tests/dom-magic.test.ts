import { domMagic } from '../src/dom-magic/index';
import { cleanup } from './setup';

describe('domMagic', () => {
  beforeEach(() => {
    cleanup();
  });

  test('should create and append elements', () => {
    const div = domMagic('div')
      .class('test-class')
      .text('Hello World')
      .style('color', 'red');

    document.body.appendChild(div.element);

    const element = document.querySelector('.test-class') as HTMLElement;
    expect(element).toBeTruthy();
    expect(element?.textContent).toBe('Hello World');
    expect(element?.style.color).toBe('red');
  });

  test('should handle nested elements', () => {
    const container = domMagic('div')
      .class('container')
      .append(
        domMagic('span').text('Child 1'),
        domMagic('span').text('Child 2')
      );

    document.body.appendChild(container.element);

    const spans = document.querySelectorAll('span');
    expect(spans.length).toBe(2);
    expect(spans[0].textContent).toBe('Child 1');
    expect(spans[1].textContent).toBe('Child 2');
  });
}); 