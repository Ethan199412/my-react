import Component from "../component";
import { Unit } from "./unit.ts";
import { createReactUnit, shouldDeepCompare } from "./utils.ts";
import { Element } from "../element";
import $ from "jquery";

// 生成组件类型的 Unit
export class ReactCompositUnit extends Unit {
    componentInstance: Component<any, any>;
    _renderUnit: Unit;
    update(nextElement: Element, partialState: Record<string, any>) {
      // _currentElement 是 Unit 自带的属性，代表一个组件的 jsx
      this._currentElement = nextElement || this._currentElement;
      // 合并状态，同时更新了组件实例的 state
      let nextState = (this.componentInstance.state = Object.assign(
        this.componentInstance.state || {},
        partialState
      ));
      // 新的属性对象
      const nextProps = (this._currentElement as Element).props;
  
      const prevProps = this.componentInstance.props;
      const prevState = this.componentInstance.state;
  
      // 执行 shouldComponentUpdate 生命周期
      if (
        this.componentInstance.shouldComponentUpdate &&
        !this.componentInstance.shouldComponentUpdate(nextProps, nextState)
      ) {
        return;
      }
      // 更新比较，这里的 _renderUnit 是 getMarkUp 之前创造的
      let preRenderUnitInstance = this._renderUnit;
  
      // 老的 jsx
      let preRenderElement = preRenderUnitInstance._currentElement;
  
      // componentInstance 已经改了 state，所以 jsx 也是最新的。
      // 注意 react 的 render
      let nextRenderElement = this.componentInstance.render();
  
      if (shouldDeepCompare(preRenderElement, nextRenderElement)) {
        // 如果可以进行深比较，则把更新的工作交给更新前的 unit
        preRenderUnitInstance.update(nextRenderElement);
        this.componentInstance.componentDidUpdate &&
          this.componentInstance.componentDidUpdate(prevProps, prevState);
      } else {
        // 直接创建了一个新的 unit
        this._renderUnit = createReactUnit(nextRenderElement);
        let nextMarkUp = this._renderUnit.getMarkUp();
        $(`[data-reactid]="${this._rootId}"`).replaceWith(nextMarkUp);
      }
    }
    // 生成组件类型的真实 dom
    getMarkUp(rootId) {
      this._rootId = rootId;
      let { type: Component, props } = this._currentElement as Element;
  
      let componentInstance: Component<any, any> = (this.componentInstance =
        new (Component as any)(props));
      componentInstance._currentUnit = this;
      //生命周期
      componentInstance.componentWillMount &&
        componentInstance.componentWillMount();
  
      // 拿到的是 jsx，Element
      const jsx: Element = componentInstance.render();
  
      let renderUnit: Unit = (this._renderUnit = createReactUnit(jsx));
  
      // unit 转换后的 html 字符串
      let markup = renderUnit.getMarkUp(this._rootId);
  
      // 在递归后绑定的事件，儿子先绑定成功，再绑定父亲。
      document.addEventListener("mounted", () => {
        componentInstance.componentDidMount &&
          componentInstance.componentDidMount();
      });
  
      return markup;
    }
  }