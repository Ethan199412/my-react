import { ReactCompositUnit } from "./unit";

export default class Component<IProps, IState extends Record<string, any>> {
  props?: IProps;
  state?: IState;
  _currentUnit?: ReactCompositUnit;

  constructor(props) {
    this.props = props;
  }

  setState(partialState) {
    this._currentUnit.update(null, partialState);
  }
}
