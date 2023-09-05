const data = {
    value: 1,
    flag: true,
    name: "陪我去看海吧",
};
let activeEffect;
let bucket = new WeakMap();

const proxyData = new Proxy(data, {
    get(target, key) {
        track(target, key);
        return Reflect.get(target, key);
    },
    set(target, key, newVal) {
        const res = Reflect.set(target, key, newVal);
        trigger(target, key);
        return res;
    },
});

// 收集依赖函数
function track(target, key) {
    if (!activeEffect) return;
    let depMap = bucket.get(target);
    if (!depMap) bucket.set(target, (depMap = new Map()));
    let deps = depMap.get(key);
    if (!deps) depMap.set(key, (deps = new Set()));
    deps.add(activeEffect);
    console.log("track", key, deps.size);
    activeEffect.deps.push(deps);
}

// 触发依赖函数
function trigger(target, key) {
    const depMap = bucket.get(target);
    if (!depMap) return;
    const effects = depMap.get(key);
    console.log("trigger", key, effects?.size);
    effects && new Set(effects).forEach((effect) => effect());
}

// 注册副作用函数
function effect(fn) {
    console.log("effect");
    const effectFn = () => {
        console.log("effectFn");
        cleanup(effectFn);
        activeEffect = effectFn;
        fn(); // 这里相当于每一次的更新，真正effect执行的地方
    };
    effectFn.deps = [];
    effectFn();
}

// 清除副作用函数遗留
function cleanup(effectFn) {
    console.log("cleaeup", effectFn.deps.length);
    for (let index = 0; index < effectFn.deps.length; index++) {
        const deps = effectFn.deps[index];
        deps.delete(effectFn);
    }
    effectFn.deps.length = 0;
}
/*
1. 首先track两个，一个flag：effectfn，一个value: effectfn
2. 改变flag，触发flag对应的effectfn
3. effectfn会先删除当前收集到的所有依赖，再执行内部fn
4. 内部fn执行的时候，又会重新收集，在这个fn上执行了get的属性
*/
effect(() => {
    console.log("fn");
    console.log("♥♥♥ result: ", proxyData.flag ? proxyData.value : "hello");
    console.log("♥♥♥ name: ", !proxyData.flag ? proxyData.name : "pkc");
});

proxyData.name = "hello";
proxyData.flag = false;
proxyData.value = 2;
proxyData.value = 3;
proxyData.value = 4;
