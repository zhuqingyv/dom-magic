import { domMagic, hook, useSignal, useComputed } from '@dom-magic';

const { div, span, button } = domMagic;

export const Count = hook(({ count }) => {
  console.log('render');
  const onClick = () => {
    count.set(count() + 1);
  };
  return (
    div.class('container').id('count')(
      span.class('count-title')(count),
      button.class('count-button').onclick(onClick)('Increment')
    )
  )
});

/**
 * @param {number[]} differences
 * @param {number} lower
 * @param {number} upper
 * @return {number}
 */
// var numberOfArrays = function(differences, lower, upper) {
//   const result = [];
//   const getNumbers = (num) => {
//       const item = [];
//       for (let i = 0;i < differences.length;i++) {
//           const cur = num + differences[i];
//           if (cur <= upper) {
//               result.push(cur);
//           } else {
//               return false;
//           }
//       };
//       result.push(item);
//   };

//   for (let i = lower;i < upper;i++) {
//       const res = getNumbers(i);
//       if (!res) return result;
//   };

//   return result;
// };