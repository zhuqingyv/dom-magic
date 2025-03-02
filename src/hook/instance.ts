import { Props } from './types';
import { Component } from './component';

// 创建组件实例，并设置属性和渲染
export const createInstance = <T extends any[]>(
  callback: (props: Props) => HTMLElement, 
  instance: Component,
  children?: any[]
): HTMLElement | null => {
  // 添加children到props
  if (children && children.length > 0) {
    instance.setProps('children', children);
  }
  
  // 开始绑定
  instance.bindStart();
  
  // 执行组件函数，传入props
  const element = callback(instance.getProps());
  
  // 结束绑定
  instance.bindEnd();
  
  // 设置DOM元素
  instance.setElement(element);
  
  // 返回渲染结果
  return instance.render();
}; 