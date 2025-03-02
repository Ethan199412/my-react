import {Element} from '../element.ts';

export abstract class Unit {
    _rootId?: string; // 父元素的 id
    _currentElement?: Element | string | number;
    _mountIndex?: number;
  
    constructor(element: Element | string | number) {
      this._currentElement = element;
      this._rootId = undefined;
    }
    abstract getMarkUp(rootId?: string): string;
    abstract update(
      nextElement: Element | string | number,
      partialState?: any
    ): void;
    // getMarkUp(id: string): string {
    //   return '';
    // }
  }
  