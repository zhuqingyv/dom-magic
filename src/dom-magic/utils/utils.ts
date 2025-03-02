export const asyncFilter = async <T>(array: T[], callback: (item: T) => Promise<boolean>): Promise<void> => {
  try {
    while (array.length > 0) {
      const item = array.shift();
      if (item === undefined) break;
      const shouldStop = await callback(item);
      if (shouldStop === true) {
        return;
      }
    }
  } catch (error) {
    throw error;
  }
};

export const safeMap = <T, R>(
  list: T[],
  callback: (item: T, index: number, list: T[]) => R | R[],
  overflow?: (result: R[]) => void,
  maxArgs: number = 32768
): R[] => {
  let index = 0;
  const processedResults: R[] = [];

  const map = () => {
    const batchSize = Math.min(list.length - index, maxArgs);
    const result: R[] = [];

    for (let i = 0; i < batchSize; i++) {
      const currentIndex = index + i;
      const item = callback(list[currentIndex], currentIndex, list);
      
      if (Array.isArray(item)) {
        result.push(...item);
      } else {
        result.push(item);
      }
    }

    processedResults.push(...result);
    index += batchSize;

    if (index < list.length) {
      if (overflow) overflow(result);
      map();
    } else if (overflow) {
      overflow(result);
    }
  };

  map();
  return processedResults;
};
