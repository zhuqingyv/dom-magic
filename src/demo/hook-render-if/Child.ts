import { hook } from '../../hook';
import { useSignal, useComputed } from '../../signal';
import { domMagic } from '../../dom-magic/domMagic';

const { div, span, button } = domMagic;

const shouldUpdate = (preProps: any, nextProps: any) => {
  if (preProps.count === nextProps.count()) return false;
  return true;
};

export const Child = hook(({ count }) => {
  const countMessage = useComputed(count, () => (`child get count: ${count()}`));
  const changeCount = () => {
    count.set(count() + 1);
  };

  return (
    div.class('child-container')(
      span.class('child-count-span')(countMessage),
      (count() >= 0) ? 'over' : 'under',
      button.class('child-count-button').onclick(changeCount)('click me count ++')
    )
  )
}, shouldUpdate);
