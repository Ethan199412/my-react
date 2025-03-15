import { Unit } from "./unit.ts";

// 生成数字和字符串的 Unit
export class ReactTextUnit extends Unit {
  constructor(element) {
    super(element);
  }
  getMarkUp(nodeId: string): string {
    this._nodeId = nodeId;
    let markUp = `<span data-reactid="${this._nodeId}">${
      this._currentElement as String | Number
    }</span>`;
    return markUp;
  }
  // 在本例中 nextElement 是一个改变后的状态，一个数字
  update(nextElement: string) {
    if (this._currentElement !== nextElement) {
      this._currentElement = nextElement;
      //$(`[data-reactid="${this._nodeId}"]`).html(nextElement);

      // 此处更新真实 dom
      document.querySelector(`[data-reactid="${this._nodeId}"]`).innerHTML =
        nextElement;
    }
  }
}