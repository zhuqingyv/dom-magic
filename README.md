# dom-magic

无需任何打包工具，即可在html中编写响应式的移动web应用，并且拥有非常简洁的语法以及极佳的性能体验。

## Example

``` javascript
import { domMagic, useSignal } from 'dom-magic'
const { div, span, button } = domMagic;

const Component = () => {
  const [count, setCount] = useSignal(0);

  const onChangeCount = () => {
    setCount(count() + 1);
  };

  return (
    div.class('container')(
      span.class('content')(count),
      button.class('content-button').onclick(onChangeCount)('click me count += 1')
    )
  )
};


```

## 利用Javascript创建清晰的Dom结构

domMagic是一个通过Proxy代理的Dom工厂创建器，在这里你可以任意命名元素，包括原生支持的元素以及任何自定义元素。

``` javascript
import { domMagic, useSignal } from 'dom-magic'
const { div, span, button, abc, xxx } = domMagic;

div.class('container')(
  span(),
  button(),
  abc(),
  xxx()
);

```
最终会输出这样一个结构（__当然这时候的元素还没有被渲染到页面上。因为仅仅为Dom对象。__）

``` html

<div class="container">
  <span></span>
  <button></button>
  <abc></abc>
  <xxx></xxx>
</div>

```

这里没有虚拟VDom的概念，函数递归执行的同时会生成Dom对象，这里的Dom对象就扮演着类似于VDom的角色，用以维系元素之间的树形结构，所以可以直接用 `appendChild` 将元素渲染到页面上。

``` javascript
const domTree = div.class('container')(
  span(),
  button(),
  abc(),
  xxx()
);

document.body.appendChild(domTree);
```

## 为Dom元素设置属性

每一个从domMagic导出的元素工厂对象，均支持**链式调用**以灵活配置元素的各种属性，包括style以及一些用户交互事件。不过需要注意的是，元素工厂对象最终一定要作为函数执行以后才会返回最终的Dom对象，否则会返回一个 `Proxy` 导致渲染报错！这里可以大致理解为html中每一个元素必须要闭合，例如:
`div()` -> `<div></div>`
`div(span())` -> `<div><span></span></div>`。
可以观察到，**元素之间的嵌套关系**，也是依赖于**函数的嵌套关系**来实现的。

``` javascript
import { domMagic, useSignal } from 'dom-magic'
const { div, span, button, abc } = domMagic;

div.class('container').id('container-id').style({
  coloe: 'red',
  backgroundColor: 'black'
})()
```

## 使用useSignal创建响应式数据

这里每一个useSignal接收一个入参作为响应式数据源，返回的参数为数组，第一项为数据源的`Proxy`代理对象，第二个为设置该值的函数。
（这里面并非React的函数式编程风格，整体更类似于**Vue的组合式API**，所以无需遵守类似React的Hooks原则，我们可以 *在任何Javascript能到达的地方创建Signal！*）

``` javascript
import { domMagic, useSignal } from 'dom-magic'

const [count, setCount] = useSignal(0);
```

如果想直接读取当前响应式数据的值，可以直接将 `count` 作为函数执行，得到的值即可为当前响应式数据的值。这种行为不会触发任何的副作用，仅仅是为了方便开发者直接获取当前响应式数据的值。

``` javascript
import { domMagic, useSignal } from 'dom-magic'

const [count, setCount] = useSignal(0);
console.log(count());// 输出 -> 0
```

修改响应式数据源，只需要调用 `setCount` 函数，并传入新的值即可。
这非常类似于 React 的 `useState` ，并且这里会发现，值立刻就可以响应变化，并且不会触发任何副作用。

``` javascript
import { domMagic, useSignal } from 'dom-magic'

const [count, setCount] = useSignal(0);
setCount(1);
count(); // 输出 -> 1
```

## 监听数据变更

`useComputed`: 监听传入的响应式对象，当对象发生变更时，如果最后一个参数是 `Function` ，则触发函数，函数的返回值为示例中 `value` 的值，同样 `value` 也是一个响应式对象，可以通过 `value()` 立即获取到当前计算属性的值。

``` javascript
import { domMagic, useSignal, useComputed, useEffect } from 'dom-magic'

const [count, setCount] = useSignal(0);

const value = useComputed(count, () => {
  return value() + 1;
});

```

当然这里面也允许监听多个响应式对象，可以传入一个数组，也可以依次传入。

``` javascript
import { domMagic, useSignal, useComputed } from 'dom-magic'

const [count, setCount] = useSignal(0);
const [message, setMessage] = useSignal('hello world');

// ...arguments, callback
const value1 = useComputed(count, message, () => {
  return value() + 1;
});

// array, callback
const value2 = useComputed([count, message], () => {
  return value() + 1;
});

```

`useEffect`: 这个函数不返回任何的值，仅仅是为了监听响应式数据的变化，当响应式数据发生变化时，会触发传入的回调函数。

``` javascript
import { domMagic, useSignal, useEffect } from 'dom-magic';

const [count, setCount] = useSignal(0);
const [message, setMessage] = useSignal('hello world');

// ...arguments, callback
useEffect(count, message, () => {
  return () => {
    // 副作用移除回调，do something ...
  };
});

// array, callback
useEffect([count, message], () => {
  return () => {
    // 副作用移除回调，do something ...
  };
});

```

## Dom属性与数据绑定

我们只需要将响应式对象作为属性值传入，即可实现响应式数据绑定。这里值得注意的是，响应式对象必须以未解包的形式传入，例如 `count` ，而不是 `count()` ，否则元素配置将无法响应数据的变更。

``` javascript
import { domMagic, useSignal, useComputed, useEffect } from 'dom-magic'

const [className, setClassName] = useSignal('container');

div.class(className)();

setClassName('container2'); // 这将触发div元素class的更新
```

当然这里也可以直接绑定文本到元素上，只需要将响应式对象作为文本内容传入即可。

``` javascript
import { domMagic, useSignal, useComputed, useEffect } from 'dom-magic'

const [message, setMessage] = useSignal('hello world');

div(message);

setMessage('hello dom-magic'); // 这将触发div元素文本内容的更新
```

## 事件绑定

Dom工厂对象会自动识别含有onxxx的字段，并尝试将该属性绑定到Dom对象上，例如：

```javascript
div.onclick(() => {})(); // 将会绑定onclick事件
```

事件绑定也支持响应式数据绑定，例如：

```javascript
import { domMagic, useSignal, useComputed, useEffect } from 'dom-magic'

const [clickHandler, setClickHandler] = useSignal(() => console.log('Original Handler'));

div.onclick(clickHandler)();

setClickHandler(() => { console.log('New Handler') }); // 这将改变元素的点击的回调函数
```

## 使用useEffect