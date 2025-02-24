# Ethan 的简易版 react
这个项目是为了那些 react 的“熟练工”准备的，如果你对 react 还不是很了解，那么本项目你看起来可能会比较吃力。但是如果你对 react 比较熟悉，且你有强烈的了解 react 底层源码的诉求，那么把本项目理解透彻会比你一上来就研究官方完全版 react 要容易的多，且更容易帮助你忽略细节，抓住 react 最本质的那一部分。

## 两条关键链路
把 react 的两条关键链路理解透彻是非常关键的。第一条链路是组件第一次 render 的链路，这条链路相对比较简单，你可以理解为就是简单的通过递归，把 jsx 转换成 html。

第二条链路是组件 setState 触发真实 dom 更新的逻辑，这条链路逻辑相对复杂，其中有一些递归和 diff 的逻辑复杂度比较高。我们分析这部分代码的方式是切分成一个一个简单的场景看其整个更新链路，然后各个击破。

### 第一次渲染
![第一次渲染](/assets/first-render.png "第一次渲染")
第一次渲染的逻辑其实很简单，本质上就是 react 把根组件的 jsx 拿出来，转换成真实 dom，然后再往 html root 容器上放。当然，生成 html 字符串这块使用的是递归的方法。

### setState 情形1：同层级节点的比较（删除）
![](/assets/delete.png "删除 dom")
最关键的逻辑实在 ReactNativeUnit 的 children 的 diff 算法。本例是删除，也就是说，oldUnitMap 是 
```javascript
const oldUnitMap = {
    'key-1': unit,
    'key-2': unit,
    'key-3': unit
}

const newUnitMap = {
    'key-1': unit,
    'key-3': unit
}
```
这种情况下 diffQueue 会生成
```javascript
{node: 'key-2 代表的真实 dom', type: 'REMOVE'} 

const diffQueue = [
    {node: 'key-2 代表的真实 dom', type: 'REMOVE'} 
]
```
然后 patch 算法会执行 diffQueue 更新真实 dom



## 三个关键概念
react 中有三个非常关键的概念：Component, Element 和 Unit
1. Component 大家都知道，不过多展开
2. Element 本质就是 jsx，也就是虚拟 dom，大家其实也很熟悉
3. Unit 是一个相对而言大家比较陌生的概念，你可以理解为，react 框架其实就是在管理 Unit，而 Unit 本身又把 Component，Element 以及真实 dom 这三者有机的联合了起来。
![三个关键概念的关系](/assets/relation.png "三个关键概念的关系")