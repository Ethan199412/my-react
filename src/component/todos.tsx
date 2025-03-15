import React from "../react/index.ts";
import Header from "./header.tsx";
import "./todos.less";

const { Component } = React;

export const generateUuid = () => {
  return Math.random().toString(36).slice(10);
};

export default class Todos extends Component {
  constructor(props) {
    super(props);
    this.state = {
      list: [
        { text: "to learn js", key: generateUuid() },
        { text: "to learn react", key: generateUuid() },
      ],
      text: "",
    };
  }

  componentDidMount() {}

  onChange = (e) => {
    this.setState({
      text: e.target.value,
    });
  };

  handleAdd = () => {
    const { text, list } = this.state;
    setTimeout(() => {
      this.setState({
        list: [...list, { text, key: generateUuid() }],
        text: "",
      });
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
      const { text, key } = e;
      return (
        <div className="item" key={key}>
          <span className="text">{text}</span>
          <div className="button" onClick={() => this.onDel(index)}>
            删除
          </div>
        </div>
      );
    });
  };
  // remember, div in jsx means React.createElement('div', null, children)
  render() {
    return (
      <div className="container">
        <Header title="To do list" />
        <div className="input-container">
          <input
            className="input"
            value={this.state.text}
            onChange={this.onChange}
          />
          <div className="button" onClick={this.handleAdd}>
            添加
          </div>
        </div>
        {this.renderList(this.state.list)}
      </div>
    );
  }
}
