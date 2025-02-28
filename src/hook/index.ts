import { domMagic, useEffect, useHookEffect, useSignal, useComputed } from 'domMagic';
import { useElementStatus, useElementDiffTree } from './elementGlobalSignal';

const { div } = domMagic;

// const HookCore = function () {
//   const [status] = useElementStatus();
//   const [tree] = useElementDiffTree();
//   let domTree: any = null;

//   const toRender = (...arg) => {};

//   const toDiff = (...arg) => {
//     status.set('Diff')
//     tree.set(domTree);
//     const newDomTree = hook(...arg);
//     status.set('Render');
//     tree.set(null);

//     domTree = newDomTree;
//     return newDomTree;
//   };

//   return function (...arg: any[]) {
//     if (domTree === null) {
//       return toRender(...arg);
//     } else {
//       return toDiff(...arg);
//     };
//   }
// };

// const Hook = function (hook: any) {
//   return (props = {}) => {

//     let domTree: any = null;
//     const status = useElementStatus();
//     const signalList = Object.keys(props).map(v => v);

//     const stillAlive = () => {
//       if (!domTree) return true;
//       return document.documentElement.contains(domTree);
//     };

//     const clearSignal = () => {
      
//     };

//     const refresh = () => {
//       // 元素已经不处于活跃状态则不会触发后续的更新
//       if (!stillAlive()) return;
//       // 这里说明父元素正在进行Diff
      
//       if (!parentDiff) status.set('Diff');
//       const newDomTree = hook(props);
//       domTree = newDomTree;
//       if (!parentDiff) status.set('Render');
//       // 清理Hooks信号
//       clearSignal();
//     };
    
//     useHookEffect(signalList, refresh);

//     return hook(props);
//   };
// };

const Hook = function (hook: any) {
  const waitForSubscribe = () => {};
  const unsubscribe = () => {};

  return (props: any = {}) => {
    const watcher = useComputed(props, () => {});


  };
};


const Component = Hook(() => {

  return (
    div.class('container')(
      div.class('row')()
    )
  )
});

const Parent = Hook(() => {
  return (
    div.class('container')(
      Component()
    )
  )
});

const reactive = (_state) => {

  const presetState = () => {
    if (isNotObject(_state)) {
      return {
        value: _state
      }
    };

    return _state
  };

  let target = presetState(_state);

  const getValue = () => {
    return target.value;
  };

  return new Proxy(getValue, {
    get() {
      return getValue();
    },
    set(_, key, value) {

      if (isNotObject(target)) {
        target = presetState(value);
      } else {
        Reflect.set(target, key, value);
      }
    }
  })
};