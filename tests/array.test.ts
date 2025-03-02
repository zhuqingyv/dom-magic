import { test, expect } from '@playwright/test';
import { useSignal, useDeepSignal, useComputed } from '../src/signal';

test.describe('基础 Signal 数组测试', () => {
  test('基础数组操作', () => {
    const state = useSignal([1, 2, 3]);
    let updateCount = 0;
    
    state.___bind(() => {
      updateCount++;
    });

    // 通过 set 方法修改数组
    state.set([...state(), 4]);
    expect(state()).toEqual([1, 2, 3, 4]);
    expect(updateCount).toBe(1);

    // 通过 set 方法删除元素
    state.set(state().slice(0, -1));
    expect(state()).toEqual([1, 2, 3]);
    expect(updateCount).toBe(2);

    // 通过 set 方法修改元素
    state.set(state().map(x => x * 2));
    expect(state()).toEqual([2, 4, 6]);
    expect(updateCount).toBe(3);
  });
});

test.describe('深度响应数组测试', () => {
  test('数组基础操作响应性', () => {
    const state = useDeepSignal({
      list: [1, 2, 3]
    });
    
    let updateCount = 0;
    
    state.effect(() => {
      updateCount++;
    });

    // push 操作
    state.list.push(4);
    expect(state.list).toEqual([1, 2, 3, 4]);
    expect(updateCount).toBe(1);

    // pop 操作
    state.list.pop();
    expect(state.list).toEqual([1, 2, 3]);
    expect(updateCount).toBe(2);

    // splice 操作
    state.list.splice(1, 1, 5);
    expect(state.list).toEqual([1, 5, 3]);
    expect(updateCount).toBe(3);
  });

  test('嵌套数组响应性', () => {
    const state = useDeepSignal({
      nested: [[1, 2], [3, 4]]
    });
    
    let updateCount = 0;
    
    state.effect(() => {
      updateCount++;
    });

    // 修改内层数组
    state.nested[0].push(5);
    expect(state.nested[0]).toEqual([1, 2, 5]);
    expect(updateCount).toBe(1);

    // 替换内层数组
    state.nested[0] = [6, 7];
    expect(state.nested[0]).toEqual([6, 7]);
    expect(updateCount).toBe(2);
  });
});

test.describe('计算属性数组测试', () => {
  test('基础计算属性', () => {
    const state = useDeepSignal({
      numbers: [1, 2, 3]
    });
    
    let computedUpdateCount = 0;
    
    const sum = useComputed(() => {
      computedUpdateCount++;
      return state.numbers.reduce((a: number, b: number) => a + b, 0);
    });

    expect(sum()).toBe(6);
    expect(computedUpdateCount).toBe(1);

    // 添加新元素
    state.numbers.push(4);
    expect(sum()).toBe(10);
    expect(computedUpdateCount).toBe(2);

    // 修改元素
    state.numbers[0] = 10;
    expect(sum()).toBe(19);
    expect(computedUpdateCount).toBe(3);
  });

  test('数组过滤和映射', () => {
    const state = useDeepSignal({
      items: [1, 2, 3, 4, 5]
    });
    
    let filterUpdateCount = 0;
    let mapUpdateCount = 0;

    const evens = useComputed(() => {
      filterUpdateCount++;
      return state.items.filter((n: number) => n % 2 === 0);
    });

    const doubled = useComputed(() => {
      mapUpdateCount++;
      return state.items.map((n: number) => n * 2);
    });

    expect(evens()).toEqual([2, 4]);
    expect(doubled()).toEqual([2, 4, 6, 8, 10]);

    // 添加新元素
    state.items.push(6);
    expect(evens()).toEqual([2, 4, 6]);
    expect(doubled()).toEqual([2, 4, 6, 8, 10, 12]);
    expect(filterUpdateCount).toBe(2);
    expect(mapUpdateCount).toBe(2);
  });
});

test.describe('边界情况测试', () => {
  test('深度响应式边界情况', () => {
    const state = useDeepSignal({
      list: [1, 2, 3]
    });
    
    let updateCount = 0;
    
    state.effect(() => {
      updateCount++;
    });

    // 清空数组
    state.list = [];
    expect(state.list).toEqual([]);
    expect(updateCount).toBe(1);

    // 稀疏数组
    state.list = [1, , 3];
    expect(state.list.length).toBe(3);
    expect(updateCount).toBe(2);

    // 越界访问
    expect(state.list[5]).toBe(undefined);
  });
});

test('数组原生方法响应式测试', async () => {
  const list = useSignal([1, 2, 3]);
  let updateCount = 0;
  
  list.___bind(() => {
    updateCount++;
  });

  // 1. push
  list.push(4);
  expect(list()).toEqual([1, 2, 3, 4]);
  expect(updateCount).toBe(1);

  // 2. pop
  const popped = list.pop();
  expect(popped).toBe(4);
  expect(list()).toEqual([1, 2, 3]);
  expect(updateCount).toBe(2);

  // 3. shift
  const shifted = list.shift();
  expect(shifted).toBe(1);
  expect(list()).toEqual([2, 3]);
  expect(updateCount).toBe(3);

  // 4. unshift
  list.unshift(1);
  expect(list()).toEqual([1, 2, 3]);
  expect(updateCount).toBe(4);

  // 5. splice
  const spliced = list.splice(1, 1, 4);
  expect(spliced).toEqual([2]);
  expect(list()).toEqual([1, 4, 3]);
  expect(updateCount).toBe(5);

  // 6. reverse
  list.reverse();
  expect(list()).toEqual([3, 4, 1]);
  expect(updateCount).toBe(6);

  // 7. sort
  list.sort((a, b) => a - b);
  expect(list()).toEqual([1, 3, 4]);
  expect(updateCount).toBe(7);

  // 8. fill
  list.fill(0, 1, 2);
  expect(list()).toEqual([1, 0, 4]);
  expect(updateCount).toBe(8);
});

test('数组非变异方法响应式测试', async () => {
  const list = useSignal([1, 2, 3, 4, 5]);
  let updateCount = 0;
  
  list.___bind(() => {
    updateCount++;
  });

  // 1. map (通过 set)
  list.set(list().map(x => x * 2));
  expect(list()).toEqual([2, 4, 6, 8, 10]);
  expect(updateCount).toBe(1);

  // 2. filter (通过 set)
  list.set(list().filter(x => x > 5));
  expect(list()).toEqual([6, 8, 10]);
  expect(updateCount).toBe(2);

  // 3. slice (通过 set)
  list.set(list().slice(1));
  expect(list()).toEqual([8, 10]);
  expect(updateCount).toBe(3);

  // 4. concat (通过 set)
  list.set(list().concat([12]));
  expect(list()).toEqual([8, 10, 12]);
  expect(updateCount).toBe(4);

  // 5. reduce
  const sum = list().reduce((acc, curr) => acc + curr, 0);
  expect(sum).toBe(30);
  // reduce 不触发更新
  expect(updateCount).toBe(4);

  // 6. some
  const hasLargeNumber = list().some(x => x > 10);
  expect(hasLargeNumber).toBe(true);
  // some 不触发更新
  expect(updateCount).toBe(4);

  // 7. every
  const allLargeNumbers = list().every(x => x > 5);
  expect(allLargeNumbers).toBe(true);
  // every 不触发更新
  expect(updateCount).toBe(4);

  // 8. find
  const found = list().find(x => x > 10);
  expect(found).toBe(12);
  // find 不触发更新
  expect(updateCount).toBe(4);

  // 9. findIndex
  const foundIndex = list().findIndex(x => x > 10);
  expect(foundIndex).toBe(2);
  // findIndex 不触发更新
  expect(updateCount).toBe(4);
});

test('数组边界情况测试', async () => {
  const list = useSignal([1, 2, 3]);
  let updateCount = 0;
  
  list.___bind(() => {
    updateCount++;
  });

  // 1. 空数组操作
  list.set([]);
  expect(list()).toEqual([]);
  expect(updateCount).toBe(1);

  // 2. 越界访问
  list.push(1);
  expect(list()[5]).toBe(undefined);
  expect(updateCount).toBe(2);

  // 3. 稀疏数组
  list.set([1, , 3]); // 创建稀疏数组
  expect(list().length).toBe(3);
  expect(1 in list()).toBe(false);
  expect(updateCount).toBe(3);

  // 4. 数组长度操作
  list.length = 1;
  expect(list()).toEqual([1]);
  expect(updateCount).toBe(4);

  // 5. 非法操作
  expect(() => {
    // @ts-ignore
    list.invalidMethod();
  }).toThrow();
});

test('大规模数组操作测试', async () => {
  const largeArray = useSignal(Array.from({ length: 1000 }, (_, i) => i));
  let updateCount = 0;

  largeArray.___bind(() => {
    updateCount++;
  });

  // 1. 大规模修改
  largeArray.set(largeArray().map(x => x * 2));
  expect(largeArray()[0]).toBe(0);
  expect(largeArray()[999]).toBe(1998);
  expect(updateCount).toBe(1);

  // 2. 大规模过滤
  largeArray.set(largeArray().filter(x => x % 100 === 0));
  expect(largeArray().length).toBe(20);
  expect(updateCount).toBe(2);

  // 3. 大规模拼接
  const newArray = Array.from({ length: 1000 }, (_, i) => i);
  largeArray.set(largeArray().concat(newArray));
  expect(largeArray().length).toBe(1020);
  expect(updateCount).toBe(3);

  // 4. 性能测试：连续操作
  for (let i = 0; i < 100; i++) {
    largeArray.push(i);
  }
  expect(largeArray().length).toBe(1120);
  expect(updateCount).toBe(103); // 初始3次 + 100次push
});

test('深度响应式数组测试', async () => {
  const nested = useDeepSignal({
    list: [
      { list: [1, 2] },
      { list: [3, 4] }
    ]
  });
  
  let updateCount = 0;
  const callback = () => {
    updateCount++;
  };
  
  // 监听整个对象的变化
  nested.effect = callback;
  
  // 1. 修改内部数组
  nested.list[0].list.push(5);
  expect(nested.list[0].list).toEqual([1, 2, 5]);
  expect(updateCount).toBe(1);
  
  // 2. 替换内部数组
  nested.list[0].list = [6, 7];
  expect(nested.list[0].list).toEqual([6, 7]);
  expect(updateCount).toBe(2);
  
  // 3. 修改多层嵌套
  nested.list[0].list.push(8);
  nested.list[1].list.unshift(0);
  expect(nested.list[0].list).toEqual([6, 7, 8]);
  expect(nested.list[1].list).toEqual([0, 3, 4]);
  expect(updateCount).toBe(4);
});

test('深度响应式计算属性测试', async () => {
  const numbers = useDeepSignal({
    numbers: [1, 2, 3, 4, 5]
  });
  let computedUpdateCount = 0;
  
  // 计算属性：过滤偶数
  const evenNumbers = useComputed(() => 
    numbers.numbers.filter(n => n % 2 === 0)
  );
  
  evenNumbers.effect = () => {
    computedUpdateCount++;
  };
  
  expect(evenNumbers()).toEqual([2, 4]);
  
  // 数组变异方法触发计算属性
  numbers.numbers.push(6);
  expect(evenNumbers()).toEqual([2, 4, 6]);
  expect(computedUpdateCount).toBe(1);
  
  // 数组替换触发计算属性
  numbers.numbers = [1, 3, 5, 7, 9];
  expect(evenNumbers()).toEqual([]);
  expect(computedUpdateCount).toBe(2);
});

test('深度响应式边界情况测试', async () => {
  const list = useDeepSignal([1, 2, 3]);
  let updateCount = 0;
  
  list.effect = () => {
    updateCount++;
  };
  
  // 1. 空数组操作
  list.length = 0;
  expect(list).toEqual([]);
  expect(updateCount).toBe(1);
  
  // 2. 稀疏数组
  list[2] = 3;
  expect(list.length).toBe(3);
  expect(1 in list).toBe(false);
  expect(updateCount).toBe(2);
  
  // 3. 数组方法
  list.push(4);
  expect(list).toEqual([, , 3, 4]);
  expect(updateCount).toBe(3);
  
  list.sort();
  expect(list).toEqual([3, 4, , ]);
  expect(updateCount).toBe(4);
}); 