import $ from "jquery";
import { Element } from "./element.ts";
import types, { NodeAction } from "./types.ts";
import Component from "./component.ts";

interface IDiff {
  parentId: string; // 父 dom 的 id
  parentNode: $<HTMLElement>; // 父 dom 的 JQ 节点
  type: NodeAction; // 对比后判断是新增，删除，还是移动
  fromIndex?: number; // 移动的元素的原来的位置
  toIndex?: number; // 移动的元素的新位置
  markup?: string; // 新增的元素的 html 字符串
}

let diffQueue: IDiff[] = []; //差异队列
let updateDepth = 0; //更新的级别

const COMMON_TYPE = new Set(["string", "number"]);
export abstract class Unit {
  _rootId?: string; // 父元素的 id
  _currentElement?: Element | string | number;
  _mountIndex?: number;

  constructor(element: Element | string | number) {
    this._currentElement = element;
    this._rootId = undefined;
  }
  abstract getMarkUp(rootId?: string): string;
  abstract update(
    nextElement: Element | string | number,
    partialState?: any
  ): void;
  // getMarkUp(id: string): string {
  //   return '';
  // }
}

// 生成数字和字符串的 Unit
class ReactTextUnit extends Unit {
  constructor(element) {
    super(element);
  }
  getMarkUp(rootId: string): string {
    this._rootId = rootId;
    let markUp = `<span data-reactid="${rootId}">${
      this._currentElement as String | Number
    }</span>`;
    return markUp;
  }
  // 在本例中 nextElement 是一个改变后的状态，一个数字
  update(nextElement: string) {
    if (this._currentElement !== nextElement) {
      this._currentElement = nextElement;
      //$(`[data-reactid="${this._rootId}"]`).html(nextElement);

      // 此处更新真实 dom
      document.querySelector(`[data-reactid="${this._rootId}"]`).innerHTML =
        nextElement;
    }
  }
}

// id = 0.0.0, rootId = 0.0
// function isChild(childId: string, fatherId: string) {
//   if (fatherId.length > childId.length) return false;
//   for (let i = 0; i < fatherId.length; i++) {
//     if (childId[i] !== fatherId[i]) {
//       return false;
//     }
//   }
//   return true;
// }

// 元素类型的标签，比如 div, span
// 生成元素类型的 Unit
class ReactNativeUnit extends Unit {
  _renderedChildrenUnits: Unit[];

  // 拼接真实 dom 的字符串
  getMarkUp(rootId: string): string {
    this._rootId = rootId;
    let { type, props } = this._currentElement as Element;
    let tagStart: string = `<${type} data-reactid="${rootId}"`;
    let tagEnd: string = `</${type}>`;

    this._renderedChildrenUnits = [];
    let contentStr;
    for (let propName in props) {
      // 如果是事件
      if (/on[A-Z]/.test(propName)) {
        let eventType = propName.slice(2).toLowerCase(); // string click

        // 使用事件委托，降低内促占用
        // 通过委托顶级dom，给满足特定条件的子元素绑定事件，其中 props[propname] 为事件处理函数
        $(document).delegate(
          `[data-reactid="${rootId}"]`,
          `${eventType}.${rootId}`,
          props[propName]
        );
      }
      // 如果是子元素
      else if (propName === "children") {
        // ['<span>你好</span>','<button>123</button>']
        contentStr = (props["children"] as Element[])
          .map((child, idx) => {
            let childUnitInstance: Unit = createReactUnit(child);

            // _mountIndex 属性，指向自己在父节点的位置。
            childUnitInstance._mountIndex = idx;
            this._renderedChildrenUnits.push(childUnitInstance);

            return childUnitInstance.getMarkUp(`${rootId}.${idx}`);
          })
          .join("");
      }
      // 如果是其他属性
      else {
        tagStart += `${propName}=${props[propName]}`;
      }
    }
    return tagStart + ">" + contentStr + tagEnd;
  }
  // setState 会触发 update 方法
  update(nextElement: Element) {
    let oldProps = (this._currentElement as Element).props;
    let newProps = nextElement.props;
    this.updateDOMProperties(oldProps, newProps);
    this.updateDOMChildren(nextElement.props.children);
  }
  // 此处要把新的儿子传过来，并和老的儿子进行对比，找出差异，并修改真实 dom
  updateDOMChildren(newChildrenElements: Element[]) {
    //console.log('[IMPORTANT] diffQueue', diffQueue)
    updateDepth++;
    console.log('[p1.0]',{diffQueue: JSON.parse(JSON.stringify(diffQueue)), updateDepth, newChildrenElements})
    this.diff(diffQueue, newChildrenElements);
    updateDepth--;
    if (updateDepth === 0) {
      console.log("[IMPORTANT] diffQueue", diffQueue);
      this.patch(diffQueue);
      diffQueue = [];
    }
  }

  patch(diffQueue: IDiff[]) {
    //debugger
    let deleteChildren: $<HTMLElement>[] = [];
    let deleteMap: Record<number, $<HTMLElement>> = {};

    for (let i = 0; i < diffQueue.length; i++) {
      let difference: IDiff = diffQueue[i];
      if (
        difference.type === NodeAction.Move ||
        difference.type === NodeAction.Remove
      ) {
        const { fromIndex } = difference;
        let oldChild: $<HTMLElement> = $(
          difference.parentNode.children().get(fromIndex)
        );
        deleteMap[fromIndex] = oldChild;
        deleteChildren.push(oldChild);
      }
    }
    $.each(deleteChildren, (idx, item) => $(item).remove());

    for (let i = 0; i < diffQueue.length; i++) {
      let difference = diffQueue[i];
      if (difference.type === types.MOVE || difference.type === types.INSERT) {
        switch (difference.type) {
          case NodeAction.Insert:
            this.insertChildAt(
              difference.parentNode,
              difference.toIndex,
              $(difference.markup)
            );
            break;
          case NodeAction.Move:
            this.insertChildAt(
              difference.parentNode,
              difference.toIndex,
              deleteMap[difference.fromIndex]
            );
            break;
        }
      }
    }
  }
  insertChildAt(parentNode: $<HTMLElement>, index: number, newNode: $<HTMLElement>) {
    let oldChild = parentNode.children().get(index);
    oldChild ? newNode.insertBefore(oldChild) : newNode.appendTo(parentNode);
  }
  // 看起来 unit 好比一个缓存，缓存了上一次的 jsx
  diff(diffQueue: IDiff[], newChildrenElements: Element[]) {
    let oldChildrenUnitMap: Record<string, Unit> = this.getOldChildrenMap(
      this._renderedChildrenUnits
    );
    // 先找老的集合里有没有能用的，能用就复用
    let { newChildrenUnitMap, newChildrenUnits } = this.getNewChildren(
      oldChildrenUnitMap,
      newChildrenElements
    );
    console.log('[p1.1]',{oldChildrenUnitMap: JSON.parse(JSON.stringify(oldChildrenUnitMap))})
    let lastIndex = 0;
    for (let i = 0; i < newChildrenUnits.length; i++) {
      let newUnit = newChildrenUnits[i];
      newUnit._currentElement = newUnit._currentElement as Element;
      // 第一个拿到的就是 newKey = A

      let newKey =
        (newUnit._currentElement.props?.key) ||
        i.toString();
      let oldChildUnit = oldChildrenUnitMap[newKey];
      if (oldChildUnit === newUnit) {
        // _mountIndex 的意思是在父节点中的位置
        if (oldChildUnit._mountIndex < lastIndex) {
          diffQueue.push({
            parentId: this._rootId,
            parentNode: $(`[data-reactid="${this._rootId}"]`),
            type: NodeAction.Move,
            fromIndex: oldChildUnit._mountIndex,
            toIndex: i,
          });
        }
        lastIndex = Math.max(lastIndex, oldChildUnit._mountIndex);
      } else {
        // 处理类型不一样时的逻辑
        if (oldChildUnit) {
          diffQueue.push({
            parentId: this._rootId,
            parentNode: $(`[data-reactid="${this._rootId}"]`),
            type: NodeAction.Remove,
            fromIndex: oldChildUnit._mountIndex,
          });
          this._renderedChildrenUnits = this._renderedChildrenUnits.filter(
            (item) => item != oldChildUnit
          );
          $(document).undelegate(`.${oldChildUnit._rootId}`);
        }
        diffQueue.push({
          parentId: this._rootId,
          parentNode: $(`[data-reactid="${this._rootId}"]`),
          type: NodeAction.Insert,
          toIndex: i,
          markup: newUnit.getMarkUp(`${this._rootId}.${i}`),
        });
      }
      newUnit._mountIndex = i;
    }
    for (let oldKey in oldChildrenUnitMap) {
      let oldChild = oldChildrenUnitMap[oldKey];
      if (!newChildrenUnitMap.hasOwnProperty(oldKey)) {
        diffQueue.push({
          parentId: this._rootId,
          parentNode: $(`[data-reactid="${this._rootId}"]`),
          type: NodeAction.Remove,
          fromIndex: oldChild._mountIndex,
        });
        this._renderedChildrenUnits = this._renderedChildrenUnits.filter(
          (item) => item != oldChild
        );
        $(document).undelegate(`.${oldChild._rootId}`);
      }
    }
  }
  getNewChildren(oldChildrenUnitMap: Record<string, Unit>, newChildrenElements: Element[]) {
    let newChildrenUnits: Unit[] = [];
    let newChildrenUnitMap: Record<string, Unit> = {};
    newChildrenElements.forEach((newElement, index) => {
      // 如果没有 key，则使用 index
      let newKey =
        (newElement.props?.key) || index.toString();
      let oldUnit = oldChildrenUnitMap[newKey];
      let oldElement = oldUnit?._currentElement;
      if (shouldDeepCompare(oldElement, newElement)) {
        // console.log('[p1.3]',{oldElement, newElement})

        // 把更新完的 unit 往队列里面放
        oldUnit.update(newElement);
        newChildrenUnits.push(oldUnit);
        newChildrenUnitMap[newKey] = oldUnit;
      } else {
        // 不能复用，则重新利用虚拟 dom 创建 unit
        let nextUnit = createReactUnit(newElement);
        newChildrenUnits.push(nextUnit);
        newChildrenUnitMap[newKey] = nextUnit;
        this._renderedChildrenUnits[index] = nextUnit;
      }
    });
    return {
      newChildrenUnitMap,
      newChildrenUnits,
    };
  }
  getOldChildrenMap(childrenUnits: Unit[] = []) {
    let map: Record<string, Unit> = {};
    for (let i = 0; i < childrenUnits.length; i++) {
      let unit = childrenUnits[i];
      let element: Element = unit._currentElement as Element;
      let key = (element.props?.key) || i.toString();
      map[key] = unit;
    }
    return map;
  }

  /**
   * 给真实 dom 更新属性
   * 干掉旧 element 的 props，并新增新 element 的 props
   */
  updateDOMProperties(
    oldProps: Record<string, any>,
    newProps: Record<string, any>
  ) {
    // console.log('[p1.1]', { oldProps, newProps })
    let propName: string;
    for (propName in oldProps) {
      if (!newProps.hasOwnProperty(propName)) {
        // 更新真实 dom，删除属性
        document
          .querySelector(`[data-reactid="${this._rootId}"]`)
          .removeAttribute(propName);

        // 如果老的属性有，担新的属性没有，且该属性是事件，需要解绑事件
        // 在这里加是不对的，想想为什么？因为后面还会再次绑定事件
        // if (/^on[A-Z]/.test(propName)) {
        //   $(document).undelegate(`.${this._rootId}`);
        // }
      }
      if (/^on[A-Z]/.test(propName)) {
        $(document).undelegate(`.${this._rootId}`);
      }
    }

    for (propName in newProps) {
      // 如果 Element 有儿子，先不处理
      if (propName == "children") {
        continue;
      }
      // 如果是事件处理函数
      else if (/^on[A-Z]/.test(propName)) {
        let eventName = propName.slice(2).toLowerCase();

        // 如果新属性有事件，增添加事件委托，看起来无论如何都再新增一次事件
        $(document).delegate(
          `[data-reactid="${this._rootId}"]`,
          `${eventName}.${this._rootId}`,
          newProps[propName]
        );
      } else if (propName == "className") {
        document
          .querySelector(`[data-reactid="${this._rootId}"]`)
          .setAttribute("class", newProps[propName]);
      } else if (propName == "style") {
        //$(`[data-reactid="${}"]`)
        // let styleObj = newProps[propName];
        // for (let attr in styleObj) {
        //   (document
        //     .querySelector(`[data-reactid="${this._rootId}"]`) as any)
        //     .style[attr] = styleObj[attr];
        // }
      } else {
        // 给真实 dom 添加属性
        $(`[data-reactid="${this._rootId}"]`).prop(
          propName,
          newProps[propName]
        );
      }
    }
  }
}

// 生成组件类型的 Unit
export class ReactCompositUnit extends Unit {
  componentInstance: Component<any, any>;
  _renderUnit: Unit;
  update(nextElement: Element, partialState: Record<string, any>) {
    // _currentElement 是 Unit 自带的属性，代表一个组件的 jsx
    this._currentElement = nextElement || this._currentElement;
    // 合并状态，同时更新了组件实例的 state
    let nextState = (this.componentInstance.state = Object.assign(
      this.componentInstance.state || {},
      partialState
    ));
    // 新的属性对象
    const nextProps = (this._currentElement as Element).props;

    const prevProps = this.componentInstance.props;
    const prevState = this.componentInstance.state;

    // 执行 shouldComponentUpdate 生命周期
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
    // 注意 react 的 render 
    let nextRenderElement = this.componentInstance.render();

    if (shouldDeepCompare(preRenderElement, nextRenderElement)) {
      // 如果可以进行深比较，则把更新的工作交给更新前的 unit
      preRenderUnitInstance.update(nextRenderElement);
      this.componentInstance.componentDidUpdate &&
        this.componentInstance.componentDidUpdate(prevProps, prevState);
    } else {
      // 直接创建了一个新的 unit
      this._renderUnit = createReactUnit(nextRenderElement);
      let nextMarkUp = this._renderUnit.getMarkUp();
      $(`[data-reactid]="${this._rootId}"`).replaceWith(nextMarkUp);
    }
  }
  // 生成组件类型的真实 dom
  getMarkUp(rootId) {
    this._rootId = rootId;
    let { type: Component, props } = this._currentElement as Element;

    let componentInstance: Component<any, any> = (this.componentInstance =
      new (Component as any)(props));
    componentInstance._currentUnit = this;
    //生命周期
    componentInstance.componentWillMount &&
      componentInstance.componentWillMount();

    // 拿到的是 jsx，Element
    let reactComponentRender: Element = componentInstance.render();
    let renderUnit: Unit = (this._renderUnit =
      createReactUnit(reactComponentRender));

    // console.log("[p1.4]", { renderUnit, rootId });

    // unit 转换后的 html 字符串
    let markup = renderUnit.getMarkUp(rootId);

    // 在递归后绑定的事件，儿子先绑定成功，再绑定父亲。
    document.addEventListener("mounted", () => {
      componentInstance.componentDidMount &&
        componentInstance.componentDidMount();
    });

    // console.log("[p1.2]", { markup });
    return markup;
  }
}

// element 转 Unit
// 这里的 type 指的是 div span 等标签
export default function createReactUnit(element: Element): Unit {
  // console.log("[p1.3]", { element, type: element.type });
  // 数字和字符串，比如 10
  if (COMMON_TYPE.has(typeof element)) {
    return new ReactTextUnit(element);
  }
  // react 元素，比如 <div>10</div> 或者 <div><div>1</div></div>
  if (typeof element === "object" && typeof element.type === "string") {
    return new ReactNativeUnit(element);
  }

  // react 组件，比如 <Counter/>
  if (typeof element === "object" && typeof element.type === "function") {
    return new ReactCompositUnit(element);
  }
}

// 判断两个元素的类型一样不一样 oldElement: jsx, newElement: jsx
function shouldDeepCompare(
  oldElement: Element | string | number,
  newElement: Element | string | number
) {
  if (oldElement != null && newElement != null) {
    const oldType = typeof oldElement;
    const newType = typeof newElement;

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
