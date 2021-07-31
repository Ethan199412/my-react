import createReactUnit from "./unit.js";
import createElement from "./element.js";
import Component from './component.js';

let React = {
  render,
  nextRootIndex: 0,
  createElement,
  Component
};
function render(element, container) {
  // element: React组件 container: div
  //$(container).html(element)
  //let markUp = `<span data-reactid="${React.nextRootIndex}">${element}</span>`
  let createReactUnitInstance = createReactUnit(element);
  let markUp = createReactUnitInstance.getMarkUp(React.nextRootIndex);
  container.innerHTML = markUp;

  //触发 componentDidMount
  let evt = document.createEvent("HTMLEvents");
  evt.initEvent("mounted");
  document.dispatchEvent(evt)

}
export default React;
