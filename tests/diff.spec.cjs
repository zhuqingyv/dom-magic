const { test, expect } = require('@playwright/test');
const { Diff, DomBuilder } = require('../src/diff/diff.js');

test('Diff 类的基本功能', async () => {
  const oldTree = DomBuilder('div')(
    DomBuilder('span').class('old')()
  );

  const newTree = DomBuilder('div')(
    DomBuilder('span').class('new')(),
    DomBuilder('p')()
  );

  const diff = new Diff(oldTree);
  const commits = [];

  diff.addEvent('commit', (action) => {
    commits.push(action);
  });

  diff.addEvent('diffEnd', () => {
    expect(commits.length).toBe(1);
    expect(commits[0].type).toBe('UPDATE');
    expect(commits[0].target).toBe(newTree);
  });

  diff.push(newTree);
  diff.pop();
});

test('Diff 类处理根节点变化', async () => {
  const oldTree = DomBuilder('div').id('old')();
  const newTree = DomBuilder('span').class('new')();

  const diff = new Diff(oldTree);
  const commits = [];

  diff.addEvent('commit', (action) => {
    commits.push(action);
  });

  diff.addEvent('diffEnd', () => {
    expect(commits.length).toBe(2);
    expect(commits[0].type).toBe('REMOVE');
    expect(commits[0].target).toBe(oldTree);
    expect(commits[1].type).toBe('CREATE');
    expect(commits[1].target).toBe(newTree);
  });

  diff.push(newTree);
  diff.pop();
});

test('Diff 类处理子节点删除', async () => {
  const oldTree = DomBuilder('div')(
    DomBuilder('span')(),
    DomBuilder('p')()
  );

  const newTree = DomBuilder('div')(
    DomBuilder('span')()
  );

  const diff = new Diff(oldTree);
  const commits = [];

  diff.addEvent('commit', (action) => {
    commits.push(action);
  });

  diff.addEvent('diffEnd', () => {
    expect(commits.length).toBe(1);
    expect(commits[0].type).toBe('UPDATE');
    expect(commits[0].target).toBe(newTree);
  });

  diff.push(newTree);
  diff.pop();
});

test('Diff 类处理多层嵌套', async () => {
  const oldTree = DomBuilder('div')(
    DomBuilder('span')(
      DomBuilder('i')()
    )
  );

  const newTree = DomBuilder('div')(
    DomBuilder('span').class('new')(
      DomBuilder('b')()  
    )
  );

  const diff = new Diff(oldTree);
  const commits = [];

  diff.addEvent('commit', (action) => {
    commits.push(action);
  });

  diff.addEvent('diffEnd', () => {
    expect(commits.length).toBe(2);
    expect(commits[0].type).toBe('REMOVE');
    expect(commits[0].target).toBe(oldTree.children[0].children[0]);
    expect(commits[1].type).toBe('CREATE');
    expect(commits[1].target).toBe(newTree.children[0]);
  });

  diff.push(newTree.children[0]);
  diff.push(newTree.children[0].children[0]);
  diff.pop();
  diff.pop();
  diff.pop();
});

test('Diff 类处理子节点顺序变化', async () => {
  const oldTree = DomBuilder('div')(
    DomBuilder('div')(),
    DomBuilder('span')()
  );

  const newTree = DomBuilder('div')(
    DomBuilder('span')(),
    DomBuilder('div')()
  );

  const diff = new Diff(oldTree);
  const commits = [];

  diff.addEvent('commit', (action) => {
    commits.push(action);
  });

  diff.addEvent('diffEnd', () => {
    expect(commits.length).toBe(3);
    expect(commits[0].type).toBe('REMOVE');
    expect(commits[0].target).toBe(oldTree.children[0]);
    expect(commits[1].type).toBe('REMOVE');
    expect(commits[1].target).toBe(oldTree.children[1]);
    expect(commits[2].type).toBe('UPDATE');
    expect(commits[2].target).toBe(newTree);
  });

  diff.push(newTree.children[0]);
  diff.push(newTree.children[1]);
  diff.pop();
  diff.pop();
  diff.pop();
});

test('Diff 类处理子节点 key', async () => {
  const oldTree = DomBuilder('ul')(
    DomBuilder('li').key('1')(),
    DomBuilder('li').key('2')(),
    DomBuilder('li').key('3')()
  );

  const newTree = DomBuilder('ul')(
    DomBuilder('li').key('3').class('new')(),
    DomBuilder('li').key('1')(),
    DomBuilder('li').key('4')()
  );

  const diff = new Diff(oldTree);
  const commits = [];

  diff.addEvent('commit', (action) => {
    commits.push(action);
  });

  diff.addEvent('diffEnd', () => {
    expect(commits.length).toBe(4);
    expect(commits[0].type).toBe('REMOVE');
    expect(commits[0].target).toBe(oldTree.children[1]);
    expect(commits[1].type).toBe('UPDATE');
    expect(commits[1].target).toBe(newTree.children[0]);
    expect(commits[2].type).toBe('CREATE');
    expect(commits[2].target).toBe(newTree.children[2]);
    expect(commits[3].type).toBe('UPDATE');
    expect(commits[3].target).toBe(newTree);
  });

  diff.push(newTree.children[0]);
  diff.pop();
  diff.push(newTree.children[1]);
  diff.pop();
  diff.push(newTree.children[2]);
  diff.pop();
  diff.pop();
});

test('Diff 类处理多层嵌套复杂变更', async () => {
  const oldTree = DomBuilder('div')(
    DomBuilder('ul')(
      DomBuilder('li')(
        DomBuilder('span')()
      ),
      DomBuilder('li')()
    )
  );

  const newTree = DomBuilder('div').class('new')(
    DomBuilder('ul')(
      DomBuilder('li').class('new')(
        DomBuilder('i')()
      ),
      DomBuilder('li')(
        DomBuilder('b')()
      ),
      DomBuilder('li')()
    ),
    DomBuilder('p')()
  );

  const diff = new Diff(oldTree);
  const commits = [];

  diff.addEvent('commit', (action) => {
    commits.push(action);
  });

  diff.addEvent('diffEnd', () => {
    expect(commits.length).toBe(6);
    expect(commits[0].type).toBe('REMOVE');
    expect(commits[0].target).toBe(oldTree);
    expect(commits[1].type).toBe('CREATE');
    expect(commits[1].target).toBe(newTree.children[0]);
    expect(commits[2].type).toBe('UPDATE');
    expect(commits[2].target).toBe(newTree.children[0].children[0]);
    expect(commits[3].type).toBe('UPDATE');
    expect(commits[3].target).toBe(newTree.children[0].children[1]);
    expect(commits[4].type).toBe('UPDATE');
    expect(commits[4].target).toBe(newTree.children[0].children[2]);
    expect(commits[5].type).toBe('UPDATE');
    expect(commits[5].target).toBe(newTree);
  });

  diff.push(newTree.children[0]);
  diff.push(newTree.children[0].children[0]);
  diff.push(newTree.children[0].children[0].children[0]);
  diff.pop();
  diff.pop();
  diff.push(newTree.children[0].children[1]);
  diff.push(newTree.children[0].children[1].children[0]);
  diff.pop();
  diff.pop();
  diff.push(newTree.children[0].children[2]);
  diff.pop();
  diff.pop();
  diff.push(newTree.children[1]);
  diff.pop();
  diff.pop();
});

test('Diff 类处理连续新增多个节点', async () => {
  const oldTree = DomBuilder('div')(
    DomBuilder('p')()
  );

  const newTree = DomBuilder('div')(
    DomBuilder('p')(),
    DomBuilder('div')(),
    DomBuilder('span')(),
    DomBuilder('i')(),
    DomBuilder('a')()
  );

  const diff = new Diff(oldTree);
  const commits = [];

  diff.addEvent('commit', (action) => {
    commits.push(action);
  });

  diff.addEvent('diffEnd', () => {
    expect(commits.length).toBe(2);
    expect(commits[0].type).toBe('REMOVE');
    expect(commits[0].target).toBe(oldTree.children[0]);
    expect(commits[1].type).toBe('UPDATE');
    expect(commits[1].target).toBe(newTree);
  });

  diff.push(newTree.children[0]);
  diff.pop();
  diff.push(newTree.children[1]);
  diff.pop();
  diff.push(newTree.children[2]);
  diff.pop();
  diff.push(newTree.children[3]);
  diff.pop();
  diff.push(newTree.children[4]);
  diff.pop();
  diff.pop();
});

// 添加更多测试用例，覆盖各种边界情况
test('Diff 类处理空树', async () => {
  const oldTree = null;
  const newTree = DomBuilder('div')();

  const diff = new Diff(oldTree);
  const commits = [];

  diff.addEvent('commit', (action) => {
    commits.push(action);
  });

  diff.addEvent('diffEnd', () => {
    expect(commits.length).toBe(1);
    expect(commits[0].type).toBe('CREATE');
    expect(commits[0].target).toBe(newTree);
  });

  diff.push(newTree);
  diff.pop();
});

test('Diff 类处理注释节点', async () => {
  const oldTree = DomBuilder('div')(
    { type: 'comment', value: 'old comment' }
  );

  const newTree = DomBuilder('div')(
    { type: 'comment', value: 'new comment' }
  );

  const diff = new Diff(oldTree);
  const commits = [];

  diff.addEvent('commit', (action) => {
    commits.push(action);
  });

  diff.addEvent('diffEnd', () => {
    expect(commits.length).toBe(1);
    expect(commits[0].type).toBe('UPDATE');
    expect(commits[0].target).toBe(newTree.children[0]);
  });

  diff.push(newTree.children[0]);
  diff.pop();
  diff.pop();
});

test('Diff 类处理文本节点', async () => {
  const oldTree = DomBuilder('div')(
    'old text'
  );

  const newTree = DomBuilder('div')(
    'new text'  
  );

  const diff = new Diff(oldTree);
  const commits = [];

  diff.addEvent('commit', (action) => {
    commits.push(action);
  });

  diff.addEvent('diffEnd', () => {
    expect(commits.length).toBe(1);
    expect(commits[0].type).toBe('UPDATE');
    expect(commits[0].target).toBe(newTree.children[0]);
  });

  diff.push(newTree.children[0]);
  diff.pop();
  diff.pop();
});

test('Diff 类处理自定义组件', async () => {
  const MyComp = () => DomBuilder('div')();
  
  const oldTree = DomBuilder(MyComp)();
  const newTree = DomBuilder(MyComp).id('new')();

  const diff = new Diff(oldTree);
  const commits = [];

  diff.addEvent('commit', (action) => {
    commits.push(action);
  });

  diff.addEvent('diffEnd', () => {
    expect(commits.length).toBe(1);
    expect(commits[0].type).toBe('UPDATE');
    expect(commits[0].target).toBe(newTree);
  });

  diff.push(newTree);
  diff.pop();
});

// 可以继续添加更多测试用例...