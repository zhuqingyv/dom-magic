import { hook } from '../../hook';
import { useSignal, useComputed } from '../../signal';
import { domMagic } from '../../dom-magic/domMagic';
import { Child } from './Child';

const { div, span, button } = domMagic;

const App = hook(() => {
  const count = useSignal(0);
  const countMessage = useComputed(count, () => (`app get count: ${count()}`));
  const changeCount = () => {
    count.set(count() - 1);
  };
  return (
    div.class('app-container')(
      Child.count(count)(),
      span.class('app-count-span')(countMessage),
      button.class('app-count-button').onclick(changeCount)('click me count --')
    )
  )
});


document.body.appendChild(App());