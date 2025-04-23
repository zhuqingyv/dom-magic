import { reactive, Reactive } from '../reactive';
import { subscribe } from '../hook';

export const useSignal = <T>(_state: T) => {
  const state = reactive<T>(_state);
  return state;
};

export const useComputed = <T extends any>(...args: [...Reactive<T>[], () => any]) => {
  const callback = args.pop() as () => any;
  const _state = useSignal<any>(callback());

  const update = () => {
    _state.set(callback());
  };

  args.forEach((data: any) => {
    subscribe(data, update);
  });

  return _state;
};

