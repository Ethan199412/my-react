import createElement, { Element } from "./element.ts";
import Component from "./component.ts";
import { Unit } from "./units/unit.ts";
import { createReactUnit } from "./units/utils.ts";

interface IReact {
  render: (element: any, container: HTMLElement) => void;
  nextRootIndex: string;
  createElement: (type: string, props: Record<string, any>, children: Element[]) => Element;
  Component
}

let React: IReact = {
  render,
  nextRootIndex: '0',
  createElement,
  Component,
};

function render(element: Element, container: HTMLElement) {
  // element: React组件 container: div 真实 dom
  // 第一步：element 转 unit，第二步：unit 转 html
  const createReactUnitInstance: Unit = createReactUnit(element);

  // 大多数情况下
  const markUp: string = createReactUnitInstance.getMarkUp(React.nextRootIndex);

  container.innerHTML = markUp;

  //触发 componentDidMount
  const evt: Event = document.createEvent("HTMLEvents");
  evt.initEvent("mounted");
  document.dispatchEvent(evt);
}
export default React;
