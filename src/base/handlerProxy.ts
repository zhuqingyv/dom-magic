export const handerProxy = (fn: any) => {
  let proxy = (...args: any[]) => {
    return fn(...args);
  };

  return new Proxy(fn, {
    get(_, prop) {
      if (prop === 'proxy') {
        return (_proxy: any) => {
          proxy = _proxy;
        }
      }
    },
    apply(_, __, args) {
      return proxy(...args);
    }
  })
};