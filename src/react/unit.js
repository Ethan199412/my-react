import $ from "jquery";
import { Element } from "./element.js";

let diffQueue; //差异队列
let updateDepth = 0; //更新的级别

const COMMON_TYPE = new Set(["string", "number"]);
class Unit {
  constructor(element) {
    this._currentElement = element;
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
  //console.log("[p4]", id, rootId);
  if (rootId.length > id.length) return false;
  for (let i = 0; i < rootId.length; i++) {
    if (id[i] !== rootId[i]) {
      return false;
    }
  }
  return true;
}

class ReactNativeUnit extends Unit {
  // update(nextElement) {
  //     if (this._currentElement !== nextElement) {
  //       this._currentElement = nextElement;
  //       $(`[data-reactid="${this._rootId}"]`).html(nextElement);
  //     }
  //   }
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
        document.addEventListener(eventType, function (e) {
          if (isChild(e.target.attributes["data-reactid"].value, rootId)) {
            let f = props[propName];
            f();
          }
        });
      } else if (propName === "children") {
        // ['<span>你好</span>','<button>123</button>']
        contentStr = props["children"]
          .map((child, idx) => {
            let childUnitInstance = createReactUnit(child);

            this._renderedChildrenUnits.push(childUnitInstance)
            return childUnitInstance.getMarkUp(`${rootId}.${idx}`);
          })
          .join("");
      } else {
        tagStart += `${propName}=${props[propName]}`;
      }
    }
    //console.log("[p2] markup", tagStart + ">" + contentStr + tagEnd);
    return tagStart + ">" + contentStr + tagEnd;
  }
  update(nextElement) {
    let oldProps = this._currentElement.props;
    let newProps = nextElement.props
    this.updateDOMProperties(oldProps, newProps)
    this.updateDOMChildren(nextElement.props.children)
  }
  // 此处要把新的儿子传过来，并和老的儿子进行对比，找出差异，并修改真实 dom
  updateDOMChildren(newChildrenElements) {
    this.diff(diffQueue, newChildrenElements)
  }
  diff(diffQueue, newChildrenElements) {
    let oldChildrenUnitMap = this.getOldChildrenMap(this._renderedChildrenUnits)

    // 先找老的集合里有没有能用的，能用就复用
    let newChildren = this.getNewChildren(oldChildrenUnitMap, newChildrenElements)
  }
  getNewChildren(oldChildrenUnitMap, newChildrenElements) {
    let newChildren = []
    newChildrenElements.forEach((newElement, index) => {
      let newKey = (newElement.props && newElement.props.key) || index.toString()
      let oldUnit = oldChildrenUnitMap[newKey]
      let oldElement = oldUnit && oldUnit._currentElement;
      if (shouldDeepCompare(oldElement, newElement)) {
        oldUnit.update(newElement)
        newChildren.push(oldUnit)
      } else {
        let nextUnit = createReactUnit(newElement)
        newChildren.push(nextUnit)
      }
      return newChildren
    })
  }
  getOldChildrenMap(childrenUnits = []) {
    let map = {};
    for (let i = 0; i < childrenUnits.length; i++) {
      let unit = childrenUnits[i]
      let key = (
        unit.props &&
        unit.props.key
      ) ||
        i.toString()
      map[key] = unit
    }
    return map
  }
  updateDOMProperties(oldProps, newProps) {
    let propName;
    for (propName in oldProps) {
      if (!newProps.hasOwnProperty(propName)) {
        document.querySelector(`[data-reactid="${this._rootId}"]`).removeAttribute(propName)
      }
      if (/^on[A-Z]/.test(propName)) {
        $(document).undelegate(`.${this._reactid}`)
      }
    }

    for (propName in newProps) {
      // 如果 Element 有儿子，先不处理
      if (propName == 'children') {
        continue
      }
      else if (/^on[A-Z]/.test(propName)) {
        let eventName = propName.slice(2).toLowerCase();
        $(document).delegate(`[data-reactid="${this._reactid}"]`)
      } else if (propName == 'className') {
        document.querySelector(`[data-reactid="${this._reactid}"]`).setAttribute('class', newProps[propName])
      }
      else if (propName == 'style') {
        //$(`[data-reactid="${}"]`)
      } else {
        $([`[data-reactid="${this._reactid}"]`]).prop(propName, newProps[propName])
      }
    }
  }
}

class ReactCompositUnit extends Unit {
  update(nextElement, partialState) {
    // _currentElement 是 Unit 自带的属性，代表一个组件的 jsx
    this._currentElement = nextElement || this._currentElement;

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

    let reactComponentRender = componentInstance.render();
    let renderUnit = (this._renderUnit = createReactUnit(reactComponentRender));
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
