import createReactUnit, { Unit } from "./unit.ts";
import createElement, { Element } from "./element.ts";
import Component from "./component.ts";

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
  let createReactUnitInstance: Unit = createReactUnit(element);
  let markUp: string = createReactUnitInstance.getMarkUp(React.nextRootIndex);
  container.innerHTML = markUp;

  //触发 componentDidMount
  let evt: Event = document.createEvent("HTMLEvents");
  evt.initEvent("mounted");
  document.dispatchEvent(evt);
}
export default React;
