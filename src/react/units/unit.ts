import {Element} from '../element.ts';

export abstract class Unit {
    _nodeId?: string; // 当前节点的 id
    _currentElement?: Element | string | number;
    _mountIndex?: number;
  
    constructor(element: Element | string | number) {
      this._currentElement = element;
      this._nodeId = undefined;
    }
    abstract getMarkUp(nodeId?: string): string;
    abstract update(
      nextElement: Element | string | number,
      partialState?: any
    ): void;
    // getMarkUp(id: string): string {
    //   return '';
    // }
  }
  