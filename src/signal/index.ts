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

const isObject = (value: unknown): value is object | Function => {
  return value !== null && (typeof value === 'object' || typeof value === 'function');
};

export const useDeepSignal = <T extends object>(target: T, cb?: any, owner?: any): T & { effect: (callback: () => void) => void } => {
  const baseSignal = useSignal(target);
  const ownerSignal = owner || useSignal({});

  const update = cb || (() => {
    ownerSignal.set(baseSignal());
  });


  return new Proxy(baseSignal, {
    get: (_, key) => {
      const signal = baseSignal[key];

      if (key === '___bind' || key === '___unbind') return ownerSignal[key];

      if (typeof key === 'symbol' || key === 'set') return signal;

      const value = signal();

      if (isObject(value)) {
        signal.___bind(update);
        return useDeepSignal(value, update, ownerSignal);
      };

      signal.___bind(update);
      return signal;
    }
  });
};

