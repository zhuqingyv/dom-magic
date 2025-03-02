# 🌟 DOM-Magic

Write UI like magic spells. Simple, elegant, and blazingly fast.
像写魔法咒语一样构建 UI。简单，优雅，闪电般快速。

## ✨ At a Glance / 一览

```typescript
import { hook } from 'dom-magic';
const { div, button } = domMagic;

// 写 UI 就像写魔法咒语
const Counter = hook(() => {
  const count = useSignal(0);
  
  return div.class('counter')(
    div(`Count: ${count()}`),
    button.onclick(() => count.set(count() + 1))('Add')
  );
});

// 🪄 见证魔法！
document.body.appendChild(Counter());
```

## 🚀 Why DOM-Magic? / 为什么选择 DOM-Magic？

- **极简设计 / Minimalist Design**
  - 单遍渲染 (O(n))，超越传统虚拟 DOM (O(2n))
  - 极致轻量，核心代码仅 2KB
  - 零配置，即写即用

- **优雅语法 / Elegant Syntax**
  ```typescript
  // 告别繁琐的 JSX
  div.class('card')(
    h1.class('title')('Hello'),
    p.class('content')('World')
  )
  ```

- **响应式魔法 / Reactive Magic**
  ```typescript
  // 深度响应，自动追踪
  const user = useDeepSignal({
    profile: { name: 'John' }
  });
  
  // 修改任意属性，UI 自动更新
  user.profile.name = 'Jane';
  ```

## 📚 Core Concepts / 核心概念

### 1. 魔法咒语 / Magic Spells
```typescript
// 每个 DOM 元素都是一个魔法咒语
const spell = div.class('magic')(
  span('✨'),
  button.onclick(cast)('Cast Spell')
);
```

### 2. 响应式信号 / Reactive Signals
```typescript
// 创建响应式状态
const power = useSignal(100);
const level = useSignal(1);

// 自动计算属性 - 会订阅 power 和 level 的变化
const powerLevel = useComputed(
  power,
  level,
  (p, l) => `等级 ${l}: ${p > 9000 ? '超过 9000!' : `能量值 ${p}`}`
);
```

### 3. 组件钩子 / Component Hooks
```typescript
const Wizard = hook(({ name }) => {
  const mana = useSignal(100);
  
  return div.class('wizard')(
    span(`${name} (${mana()})`),
    button.onclick(() => mana.set(m => m + 10))('Recharge')
  );
});

// 使用组件
Wizard.name('Merlin')();
```

## 🎯 Advanced Patterns / 高级模式

### 条件渲染 / Conditional Rendering
```typescript
const MagicPortal = hook(() => {
  const isOpen = useSignal(false);
  
  return div.class('portal')(
    isOpen() ? 
      div.class('open')('✨') : 
      div.class('closed')('🌑'),
    button.onclick(() => isOpen.set(!isOpen()))('Toggle')
  );
});
```

### 列表渲染 / List Rendering
```typescript
const Spellbook = hook(() => {
  const spells = useSignal(['🔥', '❄️', '⚡️']);
  
  return div.class('spellbook')(
    ...spells().map(spell => 
      div.class('spell')(spell)
    )
  );
});
```

## 📦 Installation / 安装

```bash
npm install dom-magic
```

## 🤝 Contributing / 贡献

Join our magical community! PRs and issues are welcome.
加入我们的魔法社区！欢迎提交 PR 和 Issue。

## 📄 License / 许可

MIT
