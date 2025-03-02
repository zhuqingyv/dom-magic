// 初始化代码复制功能
document.addEventListener('DOMContentLoaded', () => {
    // 初始化代码复制
    const clipboard = new ClipboardJS('.copy-button');
    
    clipboard.on('success', (e) => {
        const button = e.trigger;
        const originalText = button.textContent;
        button.textContent = '已复制！';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    });

    // 初始化演示
    initializeDemo();
});

// 在线演示功能
function initializeDemo() {
    const container = document.getElementById('animation-container');
    if (!container) return;

    // 创建演示界面
    container.innerHTML = `
        <div class="demo-interface">
            <div class="demo-preview">
                <div id="spell-result"></div>
            </div>
            <div class="demo-controls">
                <div class="control-group">
                    <label>魔法效果</label>
                    <select id="spell-type">
                        <option value="counter">计数器</option>
                        <option value="portal">魔法传送门</option>
                        <option value="spellbook">法术书</option>
                    </select>
                </div>
                <div class="spell-code"></div>
            </div>
        </div>
    `;

    // 定义魔法咒语
    const spells = {
        counter: {
            code: `const Counter = hook(() => {
  const count = useSignal(0);
  
  return div.class('counter')(
    div(\`数值: \${count()}\`),
    button.onclick(() => count.set(c => c + 1))('增加')
  );
});`,
            create: () => {
                const result = document.createElement('div');
                result.className = 'counter-demo';
                let count = 0;
                
                const display = document.createElement('div');
                display.textContent = `数值: ${count}`;
                
                const button = document.createElement('button');
                button.textContent = '增加';
                button.onclick = () => {
                    count++;
                    display.textContent = `数值: ${count}`;
                };
                
                result.appendChild(display);
                result.appendChild(button);
                return result;
            }
        },
        portal: {
            code: `const Portal = hook(() => {
  const isOpen = useSignal(false);
  
  return div.class('portal')(
    isOpen() ? 
      div.class('open')('✨') : 
      div.class('closed')('🌑'),
    button.onclick(() => isOpen.set(!isOpen()))('切换')
  );
});`,
            create: () => {
                const result = document.createElement('div');
                result.className = 'portal-demo';
                let isOpen = false;
                
                const portal = document.createElement('div');
                portal.className = 'portal-display';
                portal.textContent = isOpen ? '✨' : '🌑';
                
                const button = document.createElement('button');
                button.textContent = '切换';
                button.onclick = () => {
                    isOpen = !isOpen;
                    portal.textContent = isOpen ? '✨' : '🌑';
                    portal.className = `portal-display ${isOpen ? 'open' : 'closed'}`;
                };
                
                result.appendChild(portal);
                result.appendChild(button);
                return result;
            }
        },
        spellbook: {
            code: `const Spellbook = hook(() => {
  const spells = useSignal(['🔥', '❄️', '⚡️']);
  
  return div.class('spellbook')(
    ...spells().map(spell => 
      div.class('spell')(spell)
    ),
    button.onclick(() => {
      const newSpell = ['🌪️', '🌊', '🌍'][Math.floor(Math.random() * 3)];
      spells.set([...spells(), newSpell]);
    })('学习新法术')
  );
});`,
            create: () => {
                const result = document.createElement('div');
                result.className = 'spellbook-demo';
                const spells = ['🔥', '❄️', '⚡️'];
                
                const updateSpells = () => {
                    const spellContainer = result.querySelector('.spells') || document.createElement('div');
                    spellContainer.className = 'spells';
                    spellContainer.innerHTML = '';
                    spells.forEach(spell => {
                        const spellElement = document.createElement('div');
                        spellElement.className = 'spell';
                        spellElement.textContent = spell;
                        spellContainer.appendChild(spellElement);
                    });
                    if (!result.contains(spellContainer)) {
                        result.insertBefore(spellContainer, button);
                    }
                };
                
                const button = document.createElement('button');
                button.textContent = '学习新法术';
                button.onclick = () => {
                    const newSpell = ['🌪️', '🌊', '🌍'][Math.floor(Math.random() * 3)];
                    spells.push(newSpell);
                    updateSpells();
                };
                
                result.appendChild(button);
                updateSpells();
                return result;
            }
        }
    };

    // 处理魔法类型切换
    const spellType = document.getElementById('spell-type');
    const spellResult = document.getElementById('spell-result');
    const spellCode = container.querySelector('.spell-code');

    function updateDemo() {
        const type = spellType.value;
        const spell = spells[type];
        
        // 更新代码显示
        spellCode.innerHTML = `<pre><code class="language-typescript">${spell.code}</code></pre>`;
        Prism.highlightElement(spellCode.querySelector('code'));
        
        // 更新演示
        spellResult.innerHTML = '';
        spellResult.appendChild(spell.create());
    }

    spellType.addEventListener('change', updateDemo);
    updateDemo();
}

// 添加页面滚动效果
window.addEventListener('scroll', () => {
    const header = document.querySelector('.header');
    if (window.scrollY > 0) {
        header.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
    } else {
        header.style.boxShadow = 'none';
    }
});

// 魔法粒子系统
class ParticleSystem {
    constructor(container) {
        this.container = container;
        this.particles = [];
    }

    createParticle(x, y, size = 10) {
        const particle = document.createElement('div');
        particle.className = 'magic-particle';
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.left = `${x - size/2}px`;
        particle.style.top = `${y - size/2}px`;
        this.container.appendChild(particle);

        setTimeout(() => {
            particle.remove();
        }, 1000);
    }

    burst(x, y, count = 10) {
        for (let i = 0; i < count; i++) {
            const size = Math.random() * 20 + 5;
            this.createParticle(x, y, size);
        }
    }
}

// 魔法演示系统
class MagicDemo {
    constructor() {
        this.container = document.getElementById('animation-container');
        if (!this.container) return;
        
        this.particles = new ParticleSystem(this.container);
        this.setupControls();
        this.currentDemo = null;
    }

    setupControls() {
        const controls = document.createElement('div');
        controls.className = 'demo-controls';
        
        const demoTypes = [
            { id: 'counter', text: '计数器魔法' },
            { id: 'portal', text: '传送门魔法' },
            { id: 'spellbook', text: '法术书魔法' }
        ];

        demoTypes.forEach(demo => {
            const button = document.createElement('button');
            button.className = 'demo-button';
            button.textContent = demo.text;
            button.onclick = () => this.startDemo(demo.id);
            controls.appendChild(button);
        });

        this.container.appendChild(controls);
    }

    clearDemo() {
        if (this.currentDemo) {
            this.currentDemo.cleanup();
            this.currentDemo = null;
        }
        this.container.innerHTML = '';
        this.setupControls();
    }

    startDemo(type) {
        this.clearDemo();
        switch (type) {
            case 'counter':
                this.currentDemo = new CounterDemo(this);
                break;
            case 'portal':
                this.currentDemo = new PortalDemo(this);
                break;
            case 'spellbook':
                this.currentDemo = new SpellbookDemo(this);
                break;
        }
    }
}

// 计数器演示
class CounterDemo {
    constructor(magic) {
        this.magic = magic;
        this.count = 0;
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.left = '50%';
        this.element.style.top = '40%';
        this.element.style.transform = 'translate(-50%, -50%)';
        this.element.style.cursor = 'pointer';
        this.update();
        this.magic.container.appendChild(this.element);

        this.element.onclick = (e) => {
            this.count++;
            this.update();
            this.magic.particles.burst(e.clientX, e.clientY);
        };
    }

    update() {
        const text = document.createElement('div');
        text.className = 'magic-text';
        text.style.fontSize = '4rem';
        text.textContent = this.count.toString();
        this.element.innerHTML = '';
        this.element.appendChild(text);
    }

    cleanup() {
        this.element.remove();
    }
}

// 传送门演示
class PortalDemo {
    constructor(magic) {
        this.magic = magic;
        this.isOpen = false;
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.left = '50%';
        this.element.style.top = '40%';
        this.element.style.transform = 'translate(-50%, -50%)';
        this.element.style.cursor = 'pointer';
        this.update();
        this.magic.container.appendChild(this.element);

        this.element.onclick = (e) => {
            this.isOpen = !this.isOpen;
            this.update();
            this.magic.particles.burst(e.clientX, e.clientY, 20);
        };
    }

    update() {
        const text = document.createElement('div');
        text.className = 'magic-text';
        text.style.fontSize = '5rem';
        text.textContent = this.isOpen ? '🌌' : '🌑';
        this.element.innerHTML = '';
        this.element.appendChild(text);
    }

    cleanup() {
        this.element.remove();
    }
}

// 法术书演示
class SpellbookDemo {
    constructor(magic) {
        this.magic = magic;
        this.spells = ['🔥', '❄️', '⚡️', '🌪️', '🌊'];
        this.element = document.createElement('div');
        this.element.style.position = 'absolute';
        this.element.style.left = '50%';
        this.element.style.top = '40%';
        this.element.style.transform = 'translate(-50%, -50%)';
        this.element.style.display = 'flex';
        this.element.style.flexWrap = 'wrap';
        this.element.style.gap = '1rem';
        this.element.style.justifyContent = 'center';
        this.update();
        this.magic.container.appendChild(this.element);
    }

    update() {
        this.element.innerHTML = '';
        this.spells.forEach((spell, index) => {
            const spellElement = document.createElement('div');
            spellElement.className = 'magic-text';
            spellElement.style.fontSize = '3rem';
            spellElement.style.cursor = 'pointer';
            spellElement.textContent = spell;
            spellElement.onclick = (e) => {
                this.magic.particles.burst(e.clientX, e.clientY, 15);
                this.castSpell(index);
            };
            this.element.appendChild(spellElement);
        });
    }

    castSpell(index) {
        const temp = this.spells[index];
        this.spells.splice(index, 1);
        setTimeout(() => {
            this.spells.push(temp);
            this.update();
        }, 1000);
        this.update();
    }

    cleanup() {
        this.element.remove();
    }
}

// 页面初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化代码复制功能
    const clipboard = new ClipboardJS('.copy-button');
    clipboard.on('success', (e) => {
        const button = e.trigger;
        const originalText = button.textContent;
        button.textContent = '已复制！';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    });

    // 初始化魔法演示
    const demo = new MagicDemo();
    if (demo.container) {
        demo.startDemo('counter');
    }

    // 添加页面滚动效果
    const header = document.querySelector('.header');
    if (header) {
        window.addEventListener('scroll', () => {
            header.style.boxShadow = window.scrollY > 0 ? 
                '0 2px 4px rgba(0,0,0,0.1)' : 'none';
        });
    }
}); 