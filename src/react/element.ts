import Component from "./component";

export class Element {
  type?: string | Component<any, any>;
  props?: any;
  constructor(type, props) {
    this.type = type;
    this.props = props;
  }
}

function createElement(type, props, ...children) {
  props = props || {};
  console.log('[p4.1] children', children)
  props.children = children.flat();
  return new Element(type, props);
}

export default createElement;
