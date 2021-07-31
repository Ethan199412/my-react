import $ from "jquery";
import { Element } from "./element.js";

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
  update(nextElement) {
    if (this._currentElement !== nextElement) {
      this._currentElement = nextElement;
      $(`[data-reactid="${this._rootId}"]`).html(nextElement);
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
    let contentStr;
    for (let propName in props) {
      if (/on[A-Z]/.test(propName)) {
        let eventType = propName.slice(2).toLowerCase(); // string click
        //let element = document.querySelector(`[data-reactid="${rootId}]"`);
        document.addEventListener(eventType, function (e) {
          //   console.log(
          //     "[p3]",
          //     e.target.attributes["data-reactid"].value,
          //     rootId
          //   );
          if (isChild(e.target.attributes["data-reactid"].value, rootId)) {
            let f = props[propName];
            f();
          }
        });
        // $(document).on(
        //   eventType,
        //   `[data-reactid="${rootId}"]`,
        //   props[propName]
        // );
      } else if (propName === "children") {
        // ['<span>你好</span>','<button>123</button>']
        //console.log("[p0] children", props["children"]);
        contentStr = props["children"]
          .map((child, idx) => {
            let childInstance = createReactUnit(child);
            return childInstance.getMarkUp(`${rootId}.${idx}`);
          })
          .join("");
        //console.log("[p1] contentStr", contentStr);
      } else {
        tagStart += `${propName}=${props[propName]}`;
      }
    }
    //console.log("[p2] markup", tagStart + ">" + contentStr + tagEnd);
    return tagStart + ">" + contentStr + tagEnd;
  }
}

class ReactCompositUnit extends Unit {
  update(nextElement, partialState) {
    this._currentElement = nextElement || this._currentElement;
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
    // 更新比较
    let preRenderUnitInstance = this._renderUnit;
    let preRenderElement = preRenderUnitInstance._currentElement;

    let nextRenderElement = this.componentInstance.render();
    if (shouldDeepCompare(preRenderElement, nextRenderElement)) {
      // 如果可以进行深比较，则把更新的工作交给上次渲染出来的那个 elelment 元素
      console.log("[p3] preRenderUnitInstance", preRenderUnitInstance);
      preRenderUnitInstance.update(nextRenderElement);
      this.componentInstance.componentDidUpdate &&
        this.componentInstance.componentDidUpdate();
    } else {
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
  // 数字和字符串
  if (COMMON_TYPE.has(typeof element)) {
    //console.log("[p0]");
    return new ReactTextUnit(element);
  }
  // react 元素
  if (typeof element === "object" && typeof element.type === "string") {
    //console.log("[p1] element", element);
    return new ReactNativeUnit(element);
  }

  // react 组件
  if (typeof element === "object" && typeof element.type === "function") {
    return new ReactCompositUnit(element);
  }
}

// 判断两个元素的类型一样不一样
function shouldDeepCompare(oldElement, newElement) {
  if (oldElement != null && newElement != null) {
    let oldType = typeof oldElement;
    let newType = typeof newElement;
    if (COMMON_TYPE.has(oldType) && COMMON_TYPE.has(newType)) {
      return true;
    }
    if (oldElement instanceof Element && newElement instanceof Element) {
      return oldElement.type === newElement.type;
    }
  }
}
