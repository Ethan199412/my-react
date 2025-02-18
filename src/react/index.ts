import createReactUnit, { Unit } from "./unit.js";
import createElement, { Element } from "./element.js";
import Component from "./component.js";

interface IReact {
  render: (element: any, container: HTMLElement) => void;
  nextRootIndex: number;
  createElement: (type: any, props: any, children: any[]) => Element;
  Component
}

let React: IReact = {
  render,
  nextRootIndex: 0,
  createElement,
  Component,
};

function render(element, container: HTMLElement) {
  // element: React组件 container: div 真实 dom
  //$(container).html(element)
  //let markUp = `<span data-reactid="${React.nextRootIndex}">${element}</span>`
  let createReactUnitInstance: Unit = createReactUnit(element);
  let markUp: string = createReactUnitInstance.getMarkUp(React.nextRootIndex);
  container.innerHTML = markUp;

  //触发 componentDidMount
  let evt: Event = document.createEvent("HTMLEvents");
  evt.initEvent("mounted");
  document.dispatchEvent(evt);
}
export default React;
