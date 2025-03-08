import { Element } from "./element";
import { ReactCompositUnit } from "./units/react-composit-unit";

export default class Component<IProps extends Record<string, any>, IState extends Record<string, any>> {
  props?: IProps;
  state?: IState;
  _currentUnit?: ReactCompositUnit;
  shouldComponentUpdate?: (nextProps?: IProps, nextState?: IState) => boolean;
  componentDidUpdate?: (prevProps?: IProps, prevState?: IState) => void;
  componentDidMount?: () => void;
  componentWillUnmount?: () => void;
  componentWillMount?: () => void;
  render?: () => Element;

  constructor(props) {
    this.props = props;
  }

  setState(partialState) {
    // update 方法你可以理解为更新真实 dom
    this._currentUnit!.update(null, partialState);
  }
}
