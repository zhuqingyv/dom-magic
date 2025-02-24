import { watcher } from './state/watcher';

const obj = {
  name: 'John',
  count: 0
};

const objProxy = watcher(obj, (path, old, value) => {
  console.log('更新', path, old, value);
});

// 属性获取
console.log(`objProxy() 预期 { name: 'John', count: 0 } ->`, objProxy());

// 属性修改
console.log(`objProxy.name = 'mike' 预期结果 mike ->`, (objProxy.name = 'mike'));

// 再次检查属性
console.log(`objProxy() 预期 { name: 'mike', count: 0 } ->`, objProxy());

// 属性值单独获取
const { count } = objProxy;
console.log(`count() 预期是 0 ->`, count());

// 属性值单独修改
const count1 = count.set(1);
console.log(`count.set(1) 预期 1 ->`, count());

// 检查set方法返回count1
console.log(`count1() 预期 1 ->`, count1());

// 添加数组方法
console.log(`objProxy.list = [1,{ name: 'list2Name' },3] 预期 [1,{ name: 'list2Name' },3] ->`, objProxy.list = [1,{ name: 'list2Name' },3]);

// 数组内容读取
console.log(`objProxy.list[1].name 预期 'list2Name' ->`, objProxy.list[1].name())

// 单独设置数组内容
objProxy.list[0] = 999
console.log(`objProxy.list[0] = 999 预期 999 ->`, objProxy.list[0]())

// 单独设置元素
const item = objProxy.list[0];
item.set(0);
console.log(`item.set(0) 预期 0 ->`, item());

// 检查原数组的值
console.log(`objProxy.list[0]() 预期 0 -> `, objProxy.list[0]());
