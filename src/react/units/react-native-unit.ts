// 元素类型的标签，比如 div, span
import { Element } from "../element.ts";
import { createReactUnit, shouldDeepCompare } from "./utils.ts";
import { generateUuid } from "../common/utils.ts";
import { unitGlobal } from "./const.ts";
import { IDiff } from "./types.ts";
import $ from "jquery";
import { NodeAction } from "../types.ts";
import { Unit } from "./unit.ts";
import { ReactCompositUnit } from "./react-composit-unit.ts";

// 生成元素类型的 Unit
export class ReactNativeUnit extends Unit {
  _renderedChildrenUnits: Unit[];
  _fatherCompositUnit: ReactCompositUnit;

  constructor(element: Element, fatherCompositUnit: ReactCompositUnit) {
    super(element);
    this._fatherCompositUnit = fatherCompositUnit;
  }

  // 高阶函数，用于合并一个事件处理函数的多个 setState
  hoCallback(callback: (...args: any) => any) {
    return (...args: any) => {
      // 激活批量更新
      this._fatherCompositUnit._isBatchingUpdate = true
      callback(...args);
      const state = this._fatherCompositUnit.composeState()
      // flush
      this._fatherCompositUnit.update(null, state);

      // 关闭批量更新，因此异步代码段的 setState 会立即更新
      this._fatherCompositUnit._isBatchingUpdate = false
      this._fatherCompositUnit.cleanStateQueue()
    };
  }

  // 拼接真实 dom 的字符串
  getMarkUp(nodeId: string): string {
    this._nodeId = nodeId;
    const { type, props } = this._currentElement as Element;
    let tagStart: string = `<${type} data-reactid="${this._nodeId}"`;
    const tagEnd: string = `</${type}>`;

    this._renderedChildrenUnits = [];
    let contentStr;
    for (let propName in props) {
      // 如果是事件
      if (/on[A-Z]/.test(propName)) {
        let eventType = propName.slice(2).toLowerCase(); // string click
        const callback = props[propName];
        // 使用事件委托，降低内促占用
        // 通过委托顶级dom，给满足特定条件的子元素绑定事件，其中 props[propname] 为事件处理函数
        $(document).delegate(
          `[data-reactid="${this._nodeId}"]`,
          `${eventType}.${this._nodeId}`,
          this.hoCallback(callback)
        );
      }
      // 如果是子元素
      else if (propName === "children") {
        // ['<span>你好</span>','<button>123</button>']
        contentStr = (props["children"] as Element[])
          .map((child, idx) => {
            let childUnitInstance: Unit = createReactUnit(
              child,
              this._fatherCompositUnit
            );

            // _mountIndex 属性，指向自己在父节点的位置。
            childUnitInstance._mountIndex = idx;
            this._renderedChildrenUnits.push(childUnitInstance);

            return childUnitInstance.getMarkUp(
              `${this._nodeId}-${generateUuid()}`
            );
          })
          .join("");
      } else if (propName === "className") {
        tagStart += `class="${props[propName]}"`;
      } else if (propName === "key") {
        continue;
        // [DEBUG] 定位时，可以在这里添加 log
      } else if (propName === "style") {
        let styleObj = props[propName];
        let styles = Object.entries(styleObj)
          .map(([key, value]) => {
            return `${key}:${value}`;
          })
          .join(";");
        tagStart += `style="${styles}"`;
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

  // 先 diff 再 patch
  // 此处要把新的儿子传过来，并和老的儿子进行对比，找出差异，并修改真实 dom
  updateDOMChildren(newChildrenElements: Element[]) {
    //console.log('[IMPORTANT] diffQueue', diffQueue)

    // 这里的 updateDepth 指的是更新的级别，如果是 0，说明是第一次更新
    unitGlobal.updateDepth++;
    this.diff(unitGlobal.diffQueue, newChildrenElements);
    unitGlobal.updateDepth--;

    // 只有 updateDepth 是 0 的时候，才会更新真实 dom
    if (unitGlobal.updateDepth === 0) {
      // diffQueue 只有真实 dom 的信息
      console.log("[IMPORTANT] diffQueue", unitGlobal.diffQueue);
      this.patch(unitGlobal.diffQueue);

      // 这个 diffQueue 其实就相当于 react16 的 effectList
      unitGlobal.diffQueue = [];
    }
  }

  // 通过 diffQueue 更新真实 dom
  // 就通俗的记忆 patch 方法是为了更新真实 dom 的
  patch(diffQueue: IDiff[]) {
    //debugger
    let deleteChildren: $<HTMLElement>[] = [];
    let deleteMap: Record<number, $<HTMLElement>> = {};

    // 先删除后添加
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

    // 更新真实 dom
    $.each(deleteChildren, (idx, item) => $(item).remove());

    for (let i = 0; i < diffQueue.length; i++) {
      let difference = diffQueue[i];
      const { type } = difference;
      if ([NodeAction.Insert, NodeAction.Move].includes(type)) {
        switch (type) {
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
  insertChildAt(
    parentNode: $<HTMLElement>,
    index: number,
    newNode: $<HTMLElement>
  ) {
    let oldChild = parentNode.children().get(index);
    oldChild ? newNode.insertBefore(oldChild) : newNode.appendTo(parentNode);
  }
  // 看起来 unit 好比一个缓存，缓存了上一次的 jsx
  // diff 的目的是为了生成 diffQueue
  diff(diffQueue: IDiff[], newChildrenElements: Element[]) {
    // key 和 Unit 的映射关系
    const oldChildrenUnitMap: Record<string, Unit> = this.getOldChildrenMap(
      this._renderedChildrenUnits
    );
    // 先找老的集合里有没有能用的，能用就复用
    const { newChildrenUnitMap, newChildrenUnits } = this.getNewChildren(
      oldChildrenUnitMap,
      newChildrenElements
    );

    // 这里 lastIndex 的含义是在父节点中的位置
    let lastIndex = 0;
    const thisLayerDiff: { toIndex: number; unit: Unit }[] = [];
    const needDeleteNodeIds = new Set<string>();

    for (let i = 0; i < newChildrenUnits.length; i++) {
      let newUnit = newChildrenUnits[i];
      newUnit._currentElement = newUnit._currentElement as Element;
      // 第一个拿到的就是 newKey = A

      let newKey = newUnit._currentElement.props?.key || i.toString();
      let oldChildUnit = oldChildrenUnitMap[newKey];

      // 如果类型一致
      if (oldChildUnit === newUnit) {
        // _mountIndex 的意思是在父节点中的位置
        if (oldChildUnit._mountIndex < lastIndex) {
          diffQueue.push({
            parentId: this._nodeId, // 节点自己的 reactid
            parentNode: $(`[data-reactid="${this._nodeId}"]`),
            type: NodeAction.Move,
            fromIndex: oldChildUnit._mountIndex,
            toIndex: i,
          });
          thisLayerDiff.push({
            toIndex: i,
            unit: oldChildUnit,
          });
          // units 也需要删除 remove 和 move 类型的
          needDeleteNodeIds.add(oldChildUnit._nodeId);
        }
        lastIndex = Math.max(lastIndex, oldChildUnit._mountIndex);
      } else {
        // 处理类型不一样时的逻辑
        // 先删再加
        // 如果是新增，则老的 oldChildUnit 是不存在的
        if (oldChildUnit) {
          diffQueue.push({
            parentId: this._nodeId,
            parentNode: $(`[data-reactid="${this._nodeId}"]`),
            type: NodeAction.Remove,
            fromIndex: oldChildUnit._mountIndex,
          });
          needDeleteNodeIds.add(oldChildUnit._nodeId);
          // 取消 .${oldChildUnit._nodeId} 的所有事件委托
          $(document).undelegate(`.${oldChildUnit._nodeId}`);
        }
        diffQueue.push({
          parentId: this._nodeId,
          parentNode: $(`[data-reactid="${this._nodeId}"]`),
          type: NodeAction.Insert,
          toIndex: i,
          markup: newUnit.getMarkUp(`${this._nodeId}-${generateUuid()}`),
        });

        thisLayerDiff.push({
          toIndex: i,
          unit: newUnit,
        });
      }
      newUnit._mountIndex = i;
    }

    // 在这里的时候，例子是 element 为 [1,2,3] 和 [1,2]，oldMap 是 1,3,3，newMap 是 1,3
    for (let oldKey in oldChildrenUnitMap) {
      let oldChildUnit = oldChildrenUnitMap[oldKey];

      // 如果老的有，新的没有，那么删除
      if (!newChildrenUnitMap.hasOwnProperty(oldKey)) {
        diffQueue.push({
          parentId: this._nodeId,
          parentNode: $(`[data-reactid="${this._nodeId}"]`),
          type: NodeAction.Remove,
          fromIndex: oldChildUnit._mountIndex,
        });
        needDeleteNodeIds.add(oldChildUnit._nodeId);
        // this._renderedChildrenUnits.splice(oldChildUnit._mountIndex, 1);
        // 解除事件委托
        $(document).undelegate(`.${oldChildUnit._nodeId}`);
      }
    }

    // 重新赋值 _renderedChildrenUnits
    this._renderedChildrenUnits = this._renderedChildrenUnits.filter(
      (unit) => !needDeleteNodeIds.has(unit._nodeId)
    );

    // 使用 thisLayerDiff 更新 _renderedChildrenUnits
    for (let i = 0; i < thisLayerDiff.length; i++) {
      const { unit, toIndex } = thisLayerDiff[i];
      this._renderedChildrenUnits.splice(toIndex, 0, unit);
    }
  }
  getNewChildren(
    oldChildrenUnitMap: Record<string, Unit>,
    newChildrenElements: Element[]
  ) {
    let newChildrenUnits: Unit[] = [];
    let newChildrenUnitMap: Record<string, Unit> = {};
    newChildrenElements.forEach((newElement, index) => {
      // 如果没有 key，则使用 index
      let newKey = newElement.props?.key || index.toString();
      let oldUnit = oldChildrenUnitMap[newKey];
      let oldElement = oldUnit?._currentElement;
      if (shouldDeepCompare(oldElement, newElement)) {
        // 把更新完的 unit 往队列里面放
        oldUnit.update(newElement);
        newChildrenUnits.push(oldUnit);
        newChildrenUnitMap[newKey] = oldUnit;
      } else {
        // 不能复用，则重新利用虚拟 dom 创建 unit
        let nextUnit = createReactUnit(newElement, this._fatherCompositUnit);
        newChildrenUnits.push(nextUnit);
        newChildrenUnitMap[newKey] = nextUnit;
        // this._renderedChildrenUnits[index] = nextUnit;
      }
    });
    return {
      newChildrenUnitMap,
      newChildrenUnits: newChildrenUnits.filter((e) => e),
    };
  }
  getOldChildrenMap(childrenUnits: Unit[] = []) {
    let map: Record<string, Unit> = {};
    for (let i = 0; i < childrenUnits.length; i++) {
      let unit = childrenUnits[i];
      let element: Element = unit._currentElement as Element;
      let key = element.props?.key || i.toString();
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
    let propName: string;
    for (propName in oldProps) {
      if (!newProps.hasOwnProperty(propName)) {
        // 更新真实 dom，删除属性
        document
          .querySelector(`[data-reactid="${this._nodeId}"]`)
          .removeAttribute(propName);

        // 如果老的属性有，担新的属性没有，且该属性是事件，需要解绑事件
        // 在这里加是不对的，想想为什么？因为后面还会再次绑定事件
      }
      if (/^on[A-Z]/.test(propName)) {
        $(document).undelegate(`.${this._nodeId}`);
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

        const callback = newProps[propName];

        // 如果新属性有事件，增添加事件委托，看起来无论如何都再新增一次事件
        $(document).delegate(
          `[data-reactid="${this._nodeId}"]`,
          `${eventName}.${this._nodeId}`,
          this.hoCallback(callback)
        );
      } else if (propName == "className") {
        document
          .querySelector(`[data-reactid="${this._nodeId}"]`)
          .setAttribute("class", newProps[propName]);
      } else if (propName == "style") {
        // $(`[data-reactid="${}"]`)
        let styleObj = newProps[propName];
        for (let attr in styleObj) {
          (
            document.querySelector(`[data-reactid="${this._nodeId}"]`) as any
          ).style[attr] = styleObj[attr];
        }
      } else {
        // 给真实 dom 添加属性
        $(`[data-reactid="${this._nodeId}"]`).prop(
          propName,
          newProps[propName]
        );
      }
    }
  }
}
