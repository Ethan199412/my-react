export default class Component {
  constructor(props) {
    this.props = props;
  }

  setState(partialState) {
    this._currentUnit.update(null, partialState);
  }
}
