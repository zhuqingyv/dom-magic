import './demo/hook-render-if';

import { domMagic } from './dom-magic/domMagic';
import { useSignal } from './signal';

const { div, span } = domMagic;


div.class('container').id('container')(
  span.class('title')('Hello World'),
  div.class('container2')(
    span.class('title2')('Hello World2')
  )
)

// 这里的VDom创建顺序是: continer -> span -> container2 -> span。
// 而且还有一点比较特殊，只有当span开始创建的时候，才意味着container属性收集已经完毕。
// 因为div从.class开始，就入栈了，span开始执行意味着，span也入栈了。
// 更加细节的过程是这样: container 入栈 开始收集属性 -> title 开始入栈，开始收集属性，发现上一步的父节点，意味着container属性手机完毕，span收集完毕，span出栈 -> container2 入栈，开始收集属性，发现上一步的父节点 container，同样意味着container属性收集完毕 -> title2 开始入栈，开始收集属性，发现上一步的父节点 container2，意味着container2属性收集完毕，title2收集完毕，title2出栈 -> container2 出栈



// 1、我们相当于在旧的树上进行操刀，所以如果旧树根节点都被替换，那么就等于无法保存，目标是尽量保存旧树内容。
// 2、我们不直接更新，Diff本身不关心更新，它只负责对比差异，然后抛出一个函数，所以这个Diff API 的用法需要提前设计好。
// 3、在生成的补丁，需要通过Diff的API抛出来，Diff唯一的产物就是这个。
// 4、Diff一定要支持Key，不过这个还要在API上进行设计。

// 有了这几点，你可以开始设计API了，先不要动代码，我们先做好设计