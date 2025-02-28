export const cloneDeep = <T>(obj: T): T  => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    const copy = [] as any[];
    for (const item of obj) {
      copy.push(cloneDeep(item));
    }
    return copy as T;
  }

  const copy = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      copy[key as keyof T] = cloneDeep(obj[key]);
    }
  }
  return copy;
};