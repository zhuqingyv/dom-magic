import { reactive, startSubscribe } from "./reactive";


const obj = reactive({
  name: '张三',
  age: 18,
  freinds: []
});

startSubscribe(() => {
  const update = (old, n) => {
    console.log(old, n)
  };
  obj.name(update);
});

const { name } = obj;
delete obj.name;

name.set('王五')