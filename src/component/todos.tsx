import React from "../react/index.ts";
import Header from "./header.tsx";

const { Component } = React;

export default class Todos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: ["to learn js", "to learn react"],
      text: "",
    };
  }

  componentDidMount() {}

  onChange = (e) => {
    console.log("e", e);
    this.setState({
      text: e.target.value,
    });
  };

  handleAdd = () => {
    const { text } = this.state;

    this.setState({
      list: [...this.state.list, text],
      text: "",
    });
  };

  onDel = (index) => {
    const { list } = this.state;
    list.splice(index, 1);
    this.setState({
      list: [...list],
    });
  };

  renderList = (list) => {
    return list.map((e, index) => {
      return (
        <div key={"key" + e}>
          <span>{e}</span>
          <button onClick={() => this.onDel(index)}>删除</button>
        </div>
      );
    });
  };
  // remember, div in jsx means React.createElement('div', null, children)
  render() {
    return (
      <div className="container">
        <Header title="To do list" />
        <input value={this.state.text} onChange={this.onChange} />
        <button onClick={this.handleAdd}>添加</button>
        {this.renderList(this.state.list)}
      </div>
    );
  }
}
