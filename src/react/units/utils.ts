import $ from "jquery";
import { Element } from "../element.ts";
import { COMMON_TYPE } from "./types.ts";
import { ReactTextUnit } from "./react-text-unit.ts";
import { ReactNativeUnit } from "./react-native-unit.ts";
import { ReactCompositUnit } from "./react-composit-unit.ts";
import { Unit } from "./unit.ts";


// element 转 Unit
// 这里的 type 指的是 div span 等标签
export function createReactUnit(element: Element): Unit {
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
export function shouldDeepCompare(
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
