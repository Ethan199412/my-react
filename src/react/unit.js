import $, { type } from "jquery";
import { Element } from "./element.js";
import types from './types.js'

let diffQueue = []; //差异队列
let updateDepth = 0; //更新的级别

const COMMON_TYPE = new Set(["string", "number"]);
export class Unit {
  constructor(element) {
    this._currentElement = element;
    this._rootId = undefined;
  }
  getMarkUp(...args){
    return ''
  }
}

class ReactTextUnit extends Unit {
  constructor(element) {
    super(element);
  }
  getMarkUp(rootId) {
    this._rootId = rootId;
    let markUp = `<span data-reactid="${rootId}">${this._currentElement}</span>`;
    return markUp;
  }
  // 在本例中 nextElement 是一个改变后的状态，一个数字
  update(nextElement) {
    if (this._currentElement !== nextElement) {
      this._currentElement = nextElement;
      //$(`[data-reactid="${this._rootId}"]`).html(nextElement);

      // 此处更新真实 dom
      document.querySelector(`[data-reactid="${this._rootId}"]`).innerHTML = nextElement
    }
  }
}

// id = 0.0.0, rootId = 0.0
function isChild(id, rootId) {
  if (rootId.length > id.length) return false;
  for (let i = 0; i < rootId.length; i++) {
    if (id[i] !== rootId[i]) {
      return false;
    }
  }
  return true;
}

class ReactNativeUnit extends Unit {
  getMarkUp(rootId) {
    this._rootId = rootId;
    let { type, props } = this._currentElement;
    let tagStart = `<${type} data-reactid="${rootId}"`;
    let tagEnd = `</${type}>`;

    this._renderedChildrenUnits = [];
    let contentStr;
    for (let propName in props) {
      if (/on[A-Z]/.test(propName)) {
        let eventType = propName.slice(2).toLowerCase(); // string click
        //let element = document.querySelector(`[data-reactid="${rootId}]"`);
        // document.addEventListener(eventType, function (e) {
        //   if (isChild(e.target.attributes["data-reactid"].value, rootId)) {
        //     let f = props[propName];
        //     f();
        //   }
        // });
        $(document).delegate(`[data-reactid="${rootId}"]`, `${eventType}.${rootId}`, props[propName])
      } else if (propName === 'children') {
        console.log('[p2] children', props['children'])
        if( Array.isArray(props.children[0]))
        props.children = props.children[0]
        console.log('[p2.4]', props.children)
        // ['<span>你好</span>','<button>123</button>']
        contentStr = props["children"]
          .map((child, idx) => {
            // if(Array.isArray(child)){
            //   child.forEach(e=>{
            //     let childUnitInstance = createReactUnit(e);
            //     childUnitInstance._mountIndex = idx
            //     this._renderedChildrenUnits.push(childUnitInstance)
            //   })
            //   return childUnitInstance.getMarkUp(`${rootId}.${idx}`);
            // }

            console.log('[p2.1] child', child)
            // 如果是数组
            // if(Array.isArray(child)){

            // }
            // else{
              let childUnitInstance = createReactUnit(child);

              console.log('[p2.2] child', childUnitInstance)
  
              // _mountIndex 属性，指向自己在父节点的位置。
              childUnitInstance._mountIndex = idx
              this._renderedChildrenUnits.push(childUnitInstance)
              console.log('[p2.3] child', childUnitInstance.getMarkUp(`${rootId}.${idx}`))
  
              return childUnitInstance.getMarkUp(`${rootId}.${idx}`);
            // }
          })
          .join("");
      } else {
        tagStart += `${propName}=${props[propName]}`;
      }
    }
    return tagStart + ">" + contentStr + tagEnd;
  }
  update(nextElement) {
    //console.log('[p1] nextElement', nextElement)
    let oldProps = this._currentElement.props;
    let newProps = nextElement.props
    this.updateDOMProperties(oldProps, newProps)
    this.updateDOMChildren(nextElement.props.children)
  }
  // 此处要把新的儿子传过来，并和老的儿子进行对比，找出差异，并修改真实 dom
  updateDOMChildren(newChildrenElements) {
    //console.log('[IMPORTANT] diffQueue', diffQueue)
    updateDepth++;
    this.diff(diffQueue, newChildrenElements)
    updateDepth--;
    //console.log('[p5] queue', diffQueue, updateDepth)
    if (updateDepth === 0) {
      console.log('[IMPORTANT] diffQueue', diffQueue)
      this.patch(diffQueue)
      diffQueue = []
    }
  }

  patch(diffQueue) {
    //console.log('[p0] diffQueue', diffQueue)
    //debugger
    //console.log('[p2] diffQueue', diffQueue)
    let deleteChildren = [];
    let deleteMap = {}
    for (let i = 0; i < diffQueue.length; i++) {
      let difference = diffQueue[i]
      if (difference.type === types.MOVE || difference.type === types.REMOVE) {
        let fromIndex = difference.fromIndex;
        let oldChild = $(difference.parentNode.children().get(fromIndex))
        //console.log('[p7] oldChild', difference, oldChild,difference.parentNode.children())
        deleteMap[fromIndex] = oldChild;
        deleteChildren.push(oldChild)
      }
    }
    //console.log('[p7.1] deleteChildren', deleteChildren)
    $.each(deleteChildren, (idx, item) => $(item).remove())

    for (let i = 0; i < diffQueue.length; i++) {
      let difference = diffQueue[i]
      if (difference.type === types.MOVE || difference.type === types.INSERT) {
        //console.log('[p9] type', difference.type)
        switch (difference.type) {
          case types.INSERT:
            this.insertChildAt(
              difference.parentNode,
              difference.toIndex,
              $(difference.markup)
            )
            break;
          case types.MOVE:
            this.insertChildAt(
              difference.parentNode,
              difference.toIndex,
              deleteMap[difference.fromIndex]
            )
            break;
        }
      }
    }
    //console.log('[p3] idx', item,idx)
  }
  insertChildAt(parentNode, index, newNode) {
    //console.log('[p9] parentNode', parentNode, index, newNode)
    let oldChild = parentNode.children().get(index)
    oldChild ? newNode.insertBefore(oldChild) : newNode.appendTo(parentNode);
  }
  diff(diffQueue, newChildrenElements) {
    //console.log('[p4] diff', diffQueue, newChildrenElements, '_renderedChildrenUnits', this._renderedChildrenUnits)
    let oldChildrenUnitMap = this.getOldChildrenMap(this._renderedChildrenUnits)
    //console.log('[p4.1] oldChildrenUnitMap', oldChildrenUnitMap)
    // 先找老的集合里有没有能用的，能用就复用
    let { newChildrenUnitMap, newChildrenUnits } = this.getNewChildren(oldChildrenUnitMap, newChildrenElements)
    let lastIndex = 0;
    for (let i = 0; i < newChildrenUnits.length; i++) {
      let newUnit = newChildrenUnits[i]
      // 第一个拿到的就是 newKey = A
      let newKey = (newUnit._currentElement.props && newUnit._currentElement.props.key) || i.toString()
      let oldChildUnit = oldChildrenUnitMap[newKey]
      //console.log('[p6] new old unit', newUnit, oldChildUnit)
      if (oldChildUnit === newUnit) {
        if (oldChildUnit._mountIndex < lastIndex) {
          diffQueue.push({
            parentId: this._rootId,
            parentNode: $(`[data-reactid="${this._rootId}"]`),
            type: types.MOVE,
            fromIndex: oldChildUnit._mountIndex,
            toIndex: i
          })
          //console.log('[p8] parenntNode', document.querySelector(`[data-reactid="${this._rootId}"]`))
        }
        lastIndex = Math.max(lastIndex, oldChildUnit._mountIndex)
      }
      else {
        // 处理类型不一样时的逻辑
        if (oldChildUnit) {
          diffQueue.push({
            parentId: this._rootId,
            parentNode: $(`[data-reactid="${this._rootId}"]`),
            type: types.REMOVE,
            fromIndex: oldChildUnit._mountIndex
          })
          this._renderedChildrenUnits = this._renderedChildrenUnits.filter(item => item != oldChild)
          $(document).undelegate(`.${oldChildUnit._rootId}`)
        }
        diffQueue.push({
          parentId: this._rootId,
          parentNode: $(`[data-reactid="${this._rootId}"]`),
          type: types.INSERT,
          toIndex: i,
          markup: newUnit.getMarkUp(`${this._rootId}.${i}`)
        })
      }
      newUnit._mountIndex = i
    }
    for (let oldKey in oldChildrenUnitMap) {
      let oldChild = oldChildrenUnitMap[oldKey]
      if (!newChildrenUnitMap.hasOwnProperty(oldKey)) {
        diffQueue.push({
          parentId: this._rootId,
          parentNode: $(`[data-reactid="${this._rootId}"]`),
          type: types.REMOVE,
          fromIndex: oldChild._mountIndex
        })
        this._renderedChildrenUnits = this._renderedChildrenUnits.filter(item => item != oldChild)
        $(document).undelegate(`.${oldChild._rootId}`)
      }
    }
  }
  getNewChildren(oldChildrenUnitMap, newChildrenElements) {
    let newChildrenUnits = []
    let newChildrenUnitMap = {}
    newChildrenElements.forEach((newElement, index) => {
      let newKey = (newElement.props && newElement.props.key) || index.toString()
      let oldUnit = oldChildrenUnitMap[newKey]
      let oldElement = oldUnit && oldUnit._currentElement;
      if (shouldDeepCompare(oldElement, newElement)) {
        oldUnit.update(newElement)
        newChildrenUnits.push(oldUnit)
        newChildrenUnitMap[newKey] = oldUnit
      } else {
        let nextUnit = createReactUnit(newElement)
        newChildrenUnits.push(nextUnit)
        newChildrenUnitMap[newKey] = nextUnit
        this._renderedChildrenUnits[index] = nextUnit
      }
    })
    return {
      newChildrenUnitMap,
      newChildrenUnits
    }
  }
  getOldChildrenMap(childrenUnits = []) {
    let map = {};
    for (let i = 0; i < childrenUnits.length; i++) {
      let unit = childrenUnits[i]
      let element = unit._currentElement
      //console.log('[pA] unit', unit)
      let key = (
        element.props &&
        element.props.key
      ) ||
        i.toString()
      map[key] = unit
    }
    return map
  }

  /**
   * 此函数去查看
   */
  updateDOMProperties(oldProps, newProps) {
    let propName;
    for (propName in oldProps) {
      if (!newProps.hasOwnProperty(propName)) {
        document.querySelector(`[data-reactid="${this._rootId}"]`).removeAttribute(propName)
      }
      if (/^on[A-Z]/.test(propName)) {
        $(document).undelegate(`.${this._rootId}`)
      }
    }

    for (propName in newProps) {
      // 如果 Element 有儿子，先不处理
      if (propName == 'children') {
        continue
      }
      else if (/^on[A-Z]/.test(propName)) {
        let eventName = propName.slice(2).toLowerCase();
        $(document).delegate(`[data-reactid="${this._rootId}"]`, `${eventName}.${this._rootId}`, newProps[propName])
      }
      else if (propName == 'className') {
        document.querySelector(`[data-reactid="${this._rootId}"]`).setAttribute('class', newProps[propName])
      }
      else if (propName == 'style') {
        //$(`[data-reactid="${}"]`)
      } else {
        $(`[data-reactid="${this._rootId}"]`).prop(propName, newProps[propName])
      }
    }
  }
}

class ReactCompositUnit extends Unit {
  update(nextElement, partialState) {
    // _currentElement 是 Unit 自带的属性，代表一个组件的 jsx
    this._currentElement = nextElement || this._currentElement;
    console.log('[p0] this._currentElement', this._currentElement)
    // 合并状态，同时更新了组件实例的 state
    let nextState = (this.componentInstance.state = Object.assign(
      this.componentInstance.state,
      partialState
    ));
    // 新的属性对象
    let nextProps = this._currentElement.props;
    if (
      this.componentInstance.shouldComponentUpdate &&
      !this.componentInstance.shouldComponentUpdate(nextProps, nextState)
    ) {
      return;
    }
    // 更新比较，这里的 _renderUnit 是 getMarkUp 之前创造的
    let preRenderUnitInstance = this._renderUnit;

    // 老的 jsx
    let preRenderElement = preRenderUnitInstance._currentElement;

    // componentInstance 已经改了 state，所以 jsx 也是最新的。
    let nextRenderElement = this.componentInstance.render();

    if (shouldDeepCompare(preRenderElement, nextRenderElement)) {
      // 如果可以进行深比较，则把更新的工作交给更新前的 unit
      preRenderUnitInstance.update(nextRenderElement);
      this.componentInstance.componentDidUpdate &&
        this.componentInstance.componentDidUpdate();
    } else {
      // 直接创建了一个新的 unit
      this._renderUnit = createReactUnit(nextRenderElement);
      let nextMarkUp = this._renderUnit.getMarkUp();
      $(`[data-reactid]="${this._rootId}"`).replaceWith(nextMarkUp);
    }
  }
  getMarkUp(rootId) {
    this._rootId = rootId;
    let { type: Component, props } = this._currentElement;
    let componentInstance = (this.componentInstance = new Component(props));
    componentInstance._currentUnit = this;
    //生命周期
    componentInstance.componentWillMount &&
      componentInstance.componentWillMount();

    // 拿到的是 jsx，Element
    let reactComponentRender = componentInstance.render();
    let renderUnit = (this._renderUnit = createReactUnit(reactComponentRender));

    // unit 转换后的 html 字符串
    let markup = renderUnit.getMarkUp(rootId);

    // 在递归后绑定的事件，儿子先绑定成功，再绑定父亲。
    document.addEventListener("mounted", () => {
      componentInstance.componentDidMount &&
        componentInstance.componentDidMount();
    });

    return markup;
  }
}
export default function createReactUnit(element) {
  // 数字和字符串，比如 10
  if (COMMON_TYPE.has(typeof element)) {
    return new ReactTextUnit(element);
  }
  // react 元素，比如 <div>10</div>
  if (typeof element === "object" && typeof element.type === "string") {
    return new ReactNativeUnit(element);
  }

  // react 组件，比如 <Counter/>
  if (typeof element === "object" && typeof element.type === "function") {
    return new ReactCompositUnit(element);
  }
}

// 判断两个元素的类型一样不一样 oldElement: jsx, newElement: jsx
function shouldDeepCompare(oldElement, newElement) {
  if (oldElement != null && newElement != null) {
    let oldType = typeof oldElement;
    let newType = typeof newElement;

    // 如果都是数字或字符串
    if (COMMON_TYPE.has(oldType) && COMMON_TYPE.has(newType)) {
      return true;
    }

    // 如果都是元素，对应 NativeUnit
    if (oldElement instanceof Element && newElement instanceof Element) {
      // 如果都是相同的元素，或者都是相同的组件
      return oldElement.type === newElement.type;
    }
  }
}
