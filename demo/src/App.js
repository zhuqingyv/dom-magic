import { domMagic, hook, useSignal, useComputed } from '@dom-magic';
import { Count } from './Count';

const { div, span, button } = domMagic;

export const App = hook(() => {
  const count = useSignal(0);
  const onClick = () => {
    count.set(count() - 1);
  };

  return (
    div.class('content')(
      span.class('title')('hello word'),
      Count.count(count)(),
      button.class('app-button').onclick(onClick)('subtraction')
    )
  );
});

export const App2 = hook(({ render }) => {
  const count = useSignal(0);

  const el = render(
    div.class('content')(
      count
    )
  );

  return {
    render: el,
    componentDidMount() {},
    componentDidUnMount() {}
  }
});