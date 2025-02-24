import Component from "./component";

export class Element {
  type?: string | Component<any, any>;
  props?: Record<string, any>;
  constructor(type, props) {
    this.type = type;
    this.props = props;
  }
}

function createElement(type, props, ...children) {
  props = props || {};
  props.children = children.flat();
  return new Element(type, props);
}

export default createElement;
