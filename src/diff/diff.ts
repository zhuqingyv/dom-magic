export class Diff {
  private stack = [];
  private events = new Map();
  private rootNode;

  constructor(rootNode) {
    this.rootNode = rootNode;
    this.events.set('commit', []);
    this.events.set('diffEnd', []);
  }

  addEvent(event, callback) {
    const callbacks = this.events.get(event) || [];
    callbacks.push(callback);
    this.events.set(event, callbacks);
  }

  private emit(event, action) {
    const callbacks = this.events.get(event) || [];
    callbacks.forEach(cb => cb(action));
  }

  push(node) {
    // 如果栈为空，说明是根节点
    if (this.stack.length === 0) {
      const oldRoot = this.rootNode;
      if (!oldRoot) {
        // 旧树为空，直接创建新树
        this.createTree(node);
      } else if (oldRoot.tagName !== node.tagName) {
        // 根节点类型变了，先删除整棵旧树，再创建整棵新树
        this.removeTree(oldRoot);
        this.createTree(node);
      } else {
        const diffs = this.diffNode(oldRoot, node);
        if (diffs.length > 0) {
          diffs.forEach(diff => {
            this.emit('commit', diff);
          });
        }
      }
    } else {
      // 非根节点，找到旧树中对应位置的节点
      const parentNode = this.stack[this.stack.length - 1];
      const oldNode = this.findOldNode(parentNode, node);

      if (!oldNode) {
        // 旧树中没有对应节点，说明是新增
        this.emit('commit', {
          type: 'CREATE',
          target: node,
          payload: node.props
        });
      } else {
        // 对比新旧节点
        const diffs = this.diffNode(oldNode, node);
        if (diffs.length > 0) {
          diffs.forEach(diff => {
            this.emit('commit', diff);
          });
        }
      }
    }

    // 将新节点入栈
    this.stack.push(node);
  }

  pop() {
    const node = this.stack.pop();
    
    // 如果栈空了，说明整个diff过程结束
    if (this.stack.length === 0) {
      this.emit('diffEnd');
    }
  }

  setRootNode(node) {
    this.rootNode = node;
  }

  private findOldNode(parentNode, newNode) {
    const oldChildren = parentNode ? parentNode.children : [this.rootNode];
    return oldChildren.find(child => child.key === newNode.key);
  }

  private diffNode(oldNode, newNode) {
    const diffs = [];

    if (oldNode.tagName !== newNode.tagName) {
      // 节点类型变了，先删除旧节点和它的子节点，再创建新节点
      diffs.push({
        type: 'REMOVE',
        target: oldNode
      });
      this.removeTree(oldNode);
      diffs.push({
        type: 'CREATE',
        target: newNode,
        payload: newNode.props
      });
    } else {
      // 节点类型没变，检查属性和子节点
      const propsDiff = this.diffProps(oldNode, newNode);
      propsDiff.forEach(diff => {
        diffs.push(diff);
      });

      // 对比子节点
      const childrenDiff = this.diffChildren(oldNode.children || [], newNode.children || []);
      childrenDiff.forEach(diff => {
        diffs.push(diff);
      });
      
      // 根据 diff 结果决定是否生成 UPDATE
      if (propsDiff.length > 0 || childrenDiff.length > 0) {
        if (!diffs.some(diff => diff.type === 'UPDATE' && diff.target === newNode)) {
          diffs.push({
            type: 'UPDATE',
            target: newNode,
            payload: newNode.props
          });
        }
      }
    }

    return diffs;
  }

  private diffProps(oldNode, newNode) {
    const oldProps = oldNode.props || {};
    const newProps = newNode.props || {};
    
    const diffs = [];
    const keys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)]);
    keys.forEach(key => {
      if (key === 'children') {
        return;
      }
      const oldValue = oldProps[key];
      const newValue = newProps[key];
      if (oldValue === newValue) {
        return;
      }
      if (key === 'style') {
        const styleDiff = this.diffStyle(oldValue, newValue);
        if (styleDiff.length > 0) {
          diffs.push({
            type: 'STYLE',
            target: newNode,
            payload: styleDiff
          });
        }
      } else if (key === 'className') {
        const oldClass = (oldValue || '').split(' ').filter(Boolean);
        const newClass = (newValue || '').split(' ').filter(Boolean);
        const addedClass = newClass.filter(c => !oldClass.includes(c));
        const removedClass = oldClass.filter(c => !newClass.includes(c));
        if (addedClass.length > 0) {
          diffs.push({
            type: 'ADD_CLASS',
            target: newNode,
            payload: addedClass
          });
        }
        if (removedClass.length > 0) {
          diffs.push({
            type: 'REMOVE_CLASS',
            target: newNode,
            payload: removedClass  
          });
        }
      } else if (typeof oldValue === 'function' && typeof newValue === 'function') {
        // 忽略事件处理函数的变化
        return;
      } else {
        diffs.push({
          type: 'ATTR',
          target: newNode,
          payload: {
            [key]: newValue
          }
        });
      }
    });
    return diffs;
  }

  private diffStyle(oldStyle, newStyle) {
    const diffs = [];
    const keys = new Set([...Object.keys(oldStyle || {}), ...Object.keys(newStyle || {})]);
    keys.forEach(key => {
      const oldValue = oldStyle?.[key];
      const newValue = newStyle?.[key];
      if (oldValue !== newValue) {
        diffs.push({
          [key]: newValue
        });
      }
    });
    return diffs;
  }

  private diffChildren(oldChildren, newChildren) {
    const diffs = [];
    
    const oldChildrenMap = this.keyMap(oldChildren);
    const newChildrenMap = this.keyMap(newChildren);

    const oldKeys = [...oldChildrenMap.keys()];
    const newKeys = [...newChildrenMap.keys()];

    // 处理删除
    oldKeys.forEach(key => {
      if (!newChildrenMap.has(key)) {
        const { node } = oldChildrenMap.get(key);
        diffs.push({
          type: 'REMOVE',
          target: node
        });
        this.removeTree(node);
      }
    });

    let lastIndex = 0;
    newKeys.forEach((key, index) => {
      const { node } = newChildrenMap.get(key);
      if (!oldChildrenMap.has(key)) {
        // 新增节点
        diffs.push({
          type: 'CREATE',
          target: node,
          payload: node.props
        });
      } else {
        const { node: oldNode, index: oldIndex } = oldChildrenMap.get(key);
        
        // 对比新旧节点
        const childDiffs = this.diffNode(oldNode, node);
        childDiffs.forEach(diff => {
          diffs.push(diff);
        });
        
        // 移动节点
        if (oldIndex < lastIndex) {
          diffs.push({
            type: 'MOVE',
            target: node,
            payload: {
              index
            }
          });
        }
        
        lastIndex = Math.max(index, lastIndex);
      }
    });

    return diffs;
  }
  
  private keyMap(children) {
    const map = new Map();
    children.forEach((child, index) => {
      const key = this.getKey(child);
      map.set(key, {
        node: child,
        index
      });
    });
    return map;
  }
  
  private hasChange(oldNode, newNode) {
    return oldNode.tagName !== newNode.tagName ||
           this.getKey(oldNode) !== this.getKey(newNode) ||
           !this.equalPayload(oldNode.props, newNode.props);
  }

  private getKey(node) {
    return node.key || node.props?.key;
  }

  private removeTree(node) {
    if (!node) return;
    
    // 处理特殊类型节点
    switch (node.type) {
      case 'comment':
      case 'text':
        this.emitRemove(node);
        break;
      case 'fragment':
      case 'portal':
      case 'suspense':
        // 递归删除特殊节点的子节点
        this.removeChildren(node.children);
        break;
      case 'lazy':
        // 对于 Lazy 组件，在它加载完成后再删除子节点
        if (node.loaded) {
          this.removeChildren(node.children);
        } else {
          // 如果还没加载完成，监听加载状态变化
          const onLoaded = () => {
            this.removeChildren(node.children);
            node.off('loaded', onLoaded);
            node.off('error', onError);
          };
          const onError = () => {
            // 加载出错时，也要删除节点
            this.emitRemove(node);
            node.off('loaded', onLoaded);
            node.off('error', onError);
          };
          node.on('loaded', onLoaded);
          node.on('error', onError);
          
          // 同时监听组件卸载事件，在卸载时移除监听器
          const onUnmount = () => {
            node.off('loaded', onLoaded);
            node.off('error', onError);
            node.off('unmount', onUnmount);
          };
          node.on('unmount', onUnmount);
        }
        break;
      default:
        // 递归删除子节点
        this.removeChildren(node.children);
        this.emitRemove(node);
    }
  }
  
  private removeChildren(children) {
    if (Array.isArray(children)) {
      children.forEach(child => {
        if (child) {
          this.removeTree(child);
        }
      });
    }
  }
  
  private emitRemove(node) {
    this.emit('commit', {
      type: 'REMOVE',
      target: node,
      payload: this.getPayload(node)
    });
  }

  private createTree(node) {
    if (!node) return;
    
    // 处理特殊类型节点
    switch (node.type) {
      case 'comment':
      case 'text':
        this.emitCreate(node);
        break;
      case 'fragment':
      case 'portal':
      case 'suspense':
        // 递归创建特殊节点的子节点
        this.createChildren(node.children);
        break;
      case 'lazy':
        // 对于 Lazy 组件，在它加载完成后再创建子节点
        if (node.loaded) {
          this.createChildren(node.children);
        } else {
          // 如果还没加载完成，监听加载状态变化
          const onLoaded = () => {
            this.createChildren(node.children);
            node.off('loaded', onLoaded);
            node.off('error', onError);
          };
          const onError = () => {
            // 加载出错时，提示错误
            console.warn('Lazy component load error:', node);
            node.off('loaded', onLoaded);
            node.off('error', onError);
          };
          node.on('loaded', onLoaded);
          node.on('error', onError);
          
          // 同时监听组件卸载事件，在卸载时移除监听器
          const onUnmount = () => {
            node.off('loaded', onLoaded);
            node.off('error', onError);
            node.off('unmount', onUnmount);
          };
          node.on('unmount', onUnmount);
        }
        break;
      default:
        // 处理自定义组件
        if (typeof node.tagName === 'function') {
          node = node.tagName(node.props);
        }
        
        this.emitCreate(node);

        // 递归创建子节点
        this.createChildren(node.children);
    }
  }
  
  private createChildren(children) {
    if (Array.isArray(children)) {
      children.forEach(child => {
        if (child) {
          this.createTree(child);
        }
      });
    }
  }
  
  private emitCreate(node) {
    this.emit('commit', {
      type: 'CREATE',
      target: node,
      payload: this.getPayload(node)
    });
  }
  
  private getPayload(node) {
    switch (node.type) {
      case 'comment':
      case 'text':
        return {
          content: node.value
        };
      default:
        return node.props;
    }
  }

  private equalPayload(oldPayload, newPayload) {
    const oldKeys = Object.keys(oldPayload).filter(key => typeof oldPayload[key] !== 'function');
    const newKeys = Object.keys(newPayload).filter(key => typeof newPayload[key] !== 'function');
    if (oldKeys.length !== newKeys.length) {
      return false;
    }
    return oldKeys.every(key => oldPayload[key] === newPayload[key]);
  }
};

// // 实现 DomBuilder 辅助函数
// export const DomBuilder = (tagName) => {
//   const vdom = { tagName };

//   const builder = (...children) => {
//     vdom.children = children.map(child => {
//       if (typeof child === 'string') {
//         return {
//           type: 'text',
//           value: child
//         };
//       }
//       return child;
//     });
//     return vdom;
//   };

//   const proxy = new Proxy(builder, {
//     get(_, key) {
//       return (value) => {
//         vdom[key] = value;
//         return proxy;
//       };
//     },
//   });

//   return proxy;
// };