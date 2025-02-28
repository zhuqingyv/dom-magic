# dom-magic

无需任何打包工具，即可在html中编写**响应式**的移动web应用，并且拥有非常简洁的语法以及极佳的性能体验。
在这里没有 `JSX`，没有 `Vue Template` ，这里只有纯粹的 **Javascript** ！

## Example

``` javascript
import { magicDom, useSignal, useComputed, Hook, render } from 'magic-dom';
const { div, span, button } = magicDom;

const ComponentA = Hook(({ count }) => {
  const onClick = () => count.set(count() + 1)

  return (
    div.class('content')(
      span(count),
      button.onclick(onClick)('点击我 count + 1')
    )
  )
});

const ComponentB = Hook(() => {
  const state = useSignal({
    count: 0,
    name: 'message from ComponentB Signal'
  });

  const count = useComputed(state.count, () => `From ComponentB -> count is: ${count()}`);

  return (
    div.class('container')(
      span(count),
      ComponentA.count(state.count)()
    )
  )
});

render(document.body, ComponentB);
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

如果想直接读取当前响应式数据的值，可以直接将 `count` 作为函数执行 `count()` ，得到的值即可为当前响应式数据的值。这种行为不会触发任何的副作用，仅仅是为了方便开发者直接获取当前响应式数据的值。

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

`useEffect`: 这个函数不返回任何的值，仅仅是为了监听响应式数据的变化，当响应式数据发生变化时，会触发传入的回调函数。`useComputed` 实际上就是依赖于 `useEffect` 实现的。

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

## 条件渲染

这里依赖一个工具函数 `Hook` ,这个函数内部会维护一套独立的Dom树，当外侧数据发生变更时，则会触发重新渲染。这种行为类似于React的Hooks。不过不用担心性能问题，因为Hooks内部的元素工厂对象会自动检测当前上下文中是否为Hooks环境并且检测是否已经存在Dom树，这里会做的Diff。

``` javascript
import { domMagic, Hook, useSignal, render } from 'dom-magic';

const { div, button } = domMagic;

const ComponentA = Hook(({ visible }) => {
  if (!vibible) return null;

  return (
    div.class('container')()
  );
});

const ComponentB = () => {
  const [visible, setVisible] = useSignal(true);
  const onClick = () => {
    setVisible(!visible())
  };

  return (
    div.class('container')(
      button.class('btn').onclick(onClick)('点击我'),
      ComponentA({ visible })
    )
  )
}

render(document.body, ComponentB);
```

## 组件

当然，这里也有组件的概念，方便逻辑以及视图服复用。这里的组件仅仅是通过函数将内部Dom结构拼接在一起。例如下面的两种情况是等价的。

```javascript
// 第一种写法
const ComponentA = () => {
  return (
    div.class('a-container')()
  )
};
div(ComponentA())

// 第二种写法
div((() => {
  return  div.class('a-container')()
})())

```

```javascript
import { domMagic, useSignal, useComputed, useEffect, Hook, render } from 'dom-magic'
const { div, span, button } = domMagic;

const ComponentA = (_count) => {
  const count = useComputed(_count, () => {
    return `count: ${count()}`
  })
  return (
    div.class('a-container')(
      span(count),
    )
  )
};

const ComponentB = () =>  {
  const [count, setCount] = useSignal(0);

  const onChangeCount = () => {
    setCount(count() + 1);
  }

  return (
    div.class('b-container')(
      ComponentA(count),
      button.class('b-button').onclick(onChangeCount)
    )
  )
};

```

## 渲染

同样是上面的场景，我们只需要调用 `render` 即可将组件渲染到指定的Dom节点上。
这里值得注意的是，这里不同于React的Hooks，数据每次更新，并不会触发整个函数的重新执行，而是仅仅触发响应式数据的变更，Dom的变更往往也是点对点的订阅以及响应。
原因是在元素递归执行的过程中，magic会自行收集动态数据依赖，也就意味着这个过程中顺便筛选掉了永远不会变的元素，后续的变更只会影响动态元素。
很多时候，这也避免了大量的Diff工作。

```javascript
import { domMagic, useSignal, useComputed, useEffect, Hook, render } from 'dom-magic'
const { div, span, button } = domMagic;

const ComponentA = (_count) => {
  const count = useComputed(_count, () => {
    return `count: ${count()}`
  })
  return (
    div.class('a-container')(
      span(count),
    )
  )
};

const ComponentB = () =>  {
  const [count, setCount] = useSignal(0);

  const onChangeCount = () => {
    setCount(count() + 1);
  }

  return (
    div.class('b-container')(
      ComponentA(count),
      button.class('b-button').onclick(onChangeCount)
    )
  )
};

render(document.body, ComponentB);

```

## 注释

因为整体都是基于Javascript的语法进行设计的，所以即使是Dom结构，也可以像Javascript一样写注释。

```javascript
const ComponentA = (_count) => {
  const count = useComputed(_count, () => {
    return `count: ${count()}`
  })
  return (
    div.class('a-container')( // A组件外包围盒子
      span(count), // 这里即将响应count的变更
    )
  )
};

const ComponentB = () =>  {
  const [count, setCount] = useSignal(0);

  const onChangeCount = () => {
    setCount(count() + 1);
  }

  return (
    div.class('b-container')( // 最外围包围盒
      ComponentA(count), // 显示变更的子组件
      button.class('b-button').onclick(onChangeCount) // 点击按钮
    )
  )
};

render(document.body, ComponentB);

```

## 列表渲染

列表渲染也非常简单，只需要创建一个数组，然后循环遍历该数组即可完成列表的渲染。

``` javascript
import { domMagic, useSignal, useComputed, useEffect, Hook, render } from 'dom-magic'
const { div, span, button } = domMagic;

const ComponentA = () => {
  const array = [1,2,3,4,5];

  return array.map((item) => {
    return div(item)
  })
};

render(document.body, ComponentA)
```

当然，这里也可以使用响应式数据，例如下面这个例子。我基于useSignal封装了一个针对列表渲染的专属api，这样就可以在列表渲染的过程中，动态的变更列表的内容。

```javascript
import { domMagic, useList, Hook, render } from 'dom-magic'
const { div, span, button } = domMagic;

const ComponentA = () => {
  const [list, setList] = useList([1,2,3,4,5]);

  return list.map((item, i) => {
    return div(item);
  })
};

render(document.body, ComponentA)
```

当然因为list本身也是基于Signal实现的，所以item以及index也可以作为响应式数据使用，我们可以联想到将item以及index传递到子组件中，子组件就可以响应item以及index的变更。

```javascript
import { domMagic, useList, useComputed, Hook, render } from 'dom-magic'
const { div, span, button } = domMagic;

const Item = (item, index) => {
  // 这里可以通过computed将数据与index进行绑定
  const className = useComputed(index, () => `item-${index()}`);
  return div.class(className)(item); // 这里item会响应数据的变更
};

const ComponentA = () => {
  const [list, setList] = useList([1,2,3,4,5]);

  return list.map((item, i) => Item(item, index))
};

render(document.body, ComponentA)
```

## 状态管理

这里我主要介绍一下我们的状态管理，这可能区别于其他的框架，但是我相信你会喜欢上这种设计。首先，我们来看一下我们状态管理的核心api。下面我们回顾一下读取一个响应式数据的方式。

```javascript
import { domMagic, useSignal } from 'dom-magic'
const [state, setState] = useSignal({
  name: 'zhangsan',
});

state(); // 读取state的值

```
所以我们要有一个基本概念，那就是每一个响应式数据本身也是一个可执行的函数，同时又可以获取到该值本身的任何属性，在我看来这相比 **Vue** 中 `xxxx.value` 体验更好。正因为这种设计，所以基于Signal概念设计的状态管理可以实现非对象类型的响应式数据，例如字符串，数字等。

```javascript
import { domMagic, useSignal } from 'dom-magic'
const [state, setState] = useSignal({
  name: 'zhangsan',
});

state(); // 读取state的值

state.name(); // 读取state.name的值 -> 'zhangsan'

```

另外，响应式本身也支持set与get，当响应式数据执行set与get的方法的时候，会设置以及获取当前值的本身，这对于列表渲染飞铲有用，请看下面的例子：


```javascript
import { domMagic, useList, useComputed, Hook, render } from 'dom-magic'
const { div, span, button } = domMagic;

const Item = (item, index) => {
  // 这里可以通过computed将数据与index进行绑定
  const className = useComputed(index, () => `item-${index()}`);
  const onChangeItem = () => {
    item.set(item() + 1); // 这里可以直接调用item.set方法直接修改本身的值
  };
  return div.class(className).onclick(onChangeItem)(item); // 这里item会响应数据的变更
};

const ComponentA = () => {
  const [list, setList] = useList([1,2,3,4,5]);

  return list.map((item, i) => Item(item, index))
};

render(document.body, ComponentA)
```

不过值得注意的是，这将让我们的数据无法劫持原始数据键名为的set和get方法，例如下面这种数据：
``` javascript
const [state, setState] = useSignal({
  set: '张三',
  get: '李四'
});

state() // 这里依旧可以正常获取到值 { get: '张三', set: '李四' }

div(state.set) // 这里会导致异常，因为state.set()方法被劫持了
```

## 状态共享

由于借助Signal的原因，这里的状态共享将非常的简单。

*src/createStore.ts*

```javascript
import { useSignal, useEffect } from 'dom-magic';

export const createStore = (_state: any, watcher: Function) => {
  const [state, setState] = useSignal(_state);
  useEffect(state, () => {
    // do somthing...
    watcher(state())
  });
  return [state, setState];
};

```

*src/store.ts*

```javascript
import { createStore } from './createStore.ts';
export const store = createStore({
  name: 'store',
  list: [
    { name: '张三', age: 18 }
  ]
});
```

*src/main.ts*

```javascript
import { domMagic, useSignal, useComputed } from 'dom-magic'
import { store } from './store.ts';

const { div, span, button } = domMagic;

const ComponentA = () => {
  const [state] = store;

  const name = useComputed(state, () => {
    return `name in ComponentA is ${state.name()}`;
  });

  const onClick = () => {
    state.name.set('A');
  };

  return (
    div.class('a-container')(
      span.class('')(name),
      button.class('btn').onclick(onClick)('click change name')
    )
  )
};

const ComponentB = () => {
  const [state] = store;
  const onClick = () => {
    state.name.set('B');
  };

  return (
    div.class('b-container')(
      span.class('store-name')(state.name),
      ComponentA(),
      button.class('btn').onclick(onClick)('click change name')
    )
  );
};

render(document.body, ComponentB);
```

## 性能优化