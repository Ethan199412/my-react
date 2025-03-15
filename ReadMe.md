# 简易版 react
这个项目是为了那些 react 的“熟练工”准备的，如果你对 react 还不是很了解，那么本项目你看起来可能会比较吃力。但是如果你对 react 比较熟悉，且你有强烈的了解 react 底层源码的诉求，那么把本项目理解透彻会比你一上来就研究官方完全版 react 要容易的多，且更容易帮助你忽略细节，抓住 react 最本质的那一部分。

## 启动
```shell
npm run start # 启动测试组件
npm run exp # 直接跑同层级 diff 算法的例子
```

## 两条关键链路
把 react 的两条关键链路理解透彻是非常关键的。第一条链路是组件第一次 render 的链路，这条链路相对比较简单，你可以理解为就是简单的通过递归，把 jsx 转换成 html。

第二条链路是组件 setState 触发真实 dom 更新的逻辑，这条链路逻辑相对复杂，其中有一些递归和 diff 的逻辑复杂度比较高。我们分析这部分代码的方式是切分成一个一个简单的场景看其整个更新链路，然后各个击破。

### 第一次渲染
![第一次渲染](/assets/first-render.png "第一次渲染")
第一次渲染的逻辑其实很简单，本质上就是 react 把根组件的 jsx 拿出来，转换成真实 dom，然后再往 html root 容器上放。当然，生成 html 字符串这块使用的是递归的方法。

### setState 情形1：同层级节点的比较
![](/assets/diff.png "diff")

这个是 react diff 算法的重点和难点，如果还不熟悉，可以先跑 npm run experiment，这个是简化版的同层级 diff 算法。

这个算法搞懂的关键在于理解 lastIndex。lastIndex 用一句话解释就是，我要通过这个值，把老队列里面的那些相对有序的子序列尽可能保留下来，然后把那些乱序的值干掉。举个例子 
```[1,2,3,4,5]->[3,1,5,2,4] ```

根据 lastIndex 算法老队列里面的 3 和 5 会被保留下来，而 1,2,4 会被干掉，所以第一步生成的临时队列是 [3,5] 接着 1,2,4 会根据新队列的顺序生成 patch 往 [3,5] 里面加。

| new value| old index | last index | update? |diff |
| --- | --- | --- | --- |---|
|3 | 2| 0|2<0? F lastIndex=2 |-|
|5 | 4| 2|4<2? F lastIndex=4|-|
|1 | 0| 4|0<4? T|{toIndex:2, node:1}|
|2 | 1|4 |1<4? T|{toIndex:3,node:2}|
|4 | 3| 4|3<4? T|{toIndex:4}|


注意，lastIndex 会始终保持为已遍历节点的最大 old index。


#### patch 会更新谁？
首先，patch 会被递归的收集起来，去统一地更新真实 dom，这一步可以直接阅读 react-native-unit.ts 里面 patch 方法。但是光有这一步是远远不够的。对于同层级节点的比较，patch 也需要及时更新当前 unit 的 _renderChildrenUnits 的节点。
也就是说，patch 会往两个地方打。详见 diff() 这个函数。

## 关于 setState 的批处理
属于事件处理函数的同步代码段中的 setState 一定不会立刻更新真实 dom，因为这有损性能。所以 react 的策略是把同步代码段的所有 setState 中要更新的 partialState 先收集起来，当事件处理函数彻底执行完毕后，把这些收集起来的 partialState 合并，统一更新真实 dom。

## 三个关键概念
react 中有三个非常关键的概念：Component, Element 和 Unit
1. Component 大家都知道，不过多展开
2. Element 本质就是 jsx，也就是虚拟 dom，大家其实也很熟悉
3. Unit 是一个相对而言大家比较陌生的概念，你可以理解为，react 框架其实就是在管理 Unit，而 Unit 本身又把 Component，Element 以及真实 dom 这三者有机的联合了起来。
![三个关键概念的关系](/assets/relation.png "三个关键概念的关系")

有同学可能会有一个疑问，为啥要造一个 Unit 的概念?
Element 本身不就是一个虚拟 dom 了么。这是一个很好的问题，软件工程领域有句话，叫如无必要，勿增实体（奥卡姆的剃刀法则）。但是之所以要有这个 unit，一定是有它自己的作用在的。

缺陷一：其实对于 Element 而言，它最大的缺陷就是它只有视图层的信息，缺乏容易被 react 管理起来的其他信息。比方说，对于组件的 jsx（就是 Element），我没有办法从这些信息里面获取它的父亲节点是谁，它的被 react 所管理的 id 是谁。由于这些信息的丢失，react 框架需要创建另外一个节点去涵盖这些信息，而不是直接使用它，这就是创建 Unit 节点的原因。

缺陷二：除了信息量不够不便于 react 管理之外，它的第二个缺点是很多 react 节点的管理方式是有区别的。一个组件的管理和一个普通 div 标签的管理是有区别的。只用 Element 做不到这一点。

## 参考
【cnblog】https://www.cnblogs.com/qiqi715/p/13900916.html
【知乎】https://zhuanlan.zhihu.com/p/26791320422
