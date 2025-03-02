import { test, expect } from '@playwright/test';
import { reactive } from '../src/reactive';

test.describe('响应式系统测试', () => {
  test('基础类型响应式', async () => {
    const count = reactive(0);
    let changed = false;
    
    count.___bind(() => {
      changed = true;
    });
    
    expect(count()).toBe(0);
    count.set(1);
    expect(count()).toBe(1);
    expect(changed).toBe(true);
  });

  test('对象响应式', async () => {
    const state = reactive({ name: 'test', count: 0 });
    let nameChanged = false;
    let countChanged = false;
    
    state.name.___bind(() => {
      nameChanged = true;
    });
    
    state.count.___bind(() => {
      countChanged = true;
    });
    
    expect(state().name).toBe('test');
    expect(state().count).toBe(0);
    
    state.name.set('new test');
    expect(state().name).toBe('new test');
    expect(nameChanged).toBe(true);
    expect(countChanged).toBe(false);
    
    state.count.set(1);
    expect(state().count).toBe(1);
    expect(countChanged).toBe(true);
  });

  test('数组响应式', async () => {
    const list = reactive([1, 2, 3]);
    let changed = false;
    
    list.___bind(() => {
      changed = true;
    });
    
    expect(list()).toEqual([1, 2, 3]);
    list.push(4);
    expect(list()).toEqual([1, 2, 3, 4]);
    expect(changed).toBe(true);
  });

  test('嵌套对象响应式', async () => {
    const state = reactive({
      user: {
        name: 'test',
        profile: {
          age: 18
        }
      }
    });
    
    let nameChanged = false;
    let ageChanged = false;
    
    state.user.name.___bind(() => {
      nameChanged = true;
    });
    
    state.user.profile.age.___bind(() => {
      ageChanged = true;
    });
    
    expect(state.user.name()).toBe('test');
    expect(state.user.profile.age()).toBe(18);
    
    state.user.name.set('new test');
    expect(state.user.name()).toBe('new test');
    expect(nameChanged).toBe(true);
    
    state.user.profile.age.set(20);
    expect(state.user.profile.age()).toBe(20);
    expect(ageChanged).toBe(true);
  });
}); 