import React from "../react/index.ts";

export default class Test extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      list: [1, 2, 3, 4, 5],
      text: "",
    };
  }

  handleDel = (index) => {
    this.setState({
      list: this.state.list.filter((e, i) => i !== index),
    });
  };

  render() {
    return (
      <div>
        {this.state.list.map((e,index) => (
          <div key={e} onClick={() => this.handleDel(index)}>
            <div >{e}</div>
          </div>
        ))}
      </div>
    );
  }
}
