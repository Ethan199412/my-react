import React from "../react/index.ts";
import Header from "./header.tsx";
import './todos.less'

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
    this.setState({
      text: e.target.value,
    });
  };

  handleAdd = () => {
    const { text, list } = this.state;

    this.setState({
      list: [...list, text],
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
        <div className='item' key={"key" + e}>
          <span className='text'>{e}</span>
          <div className='button' onClick={() => this.onDel(index)}>删除</div>
        </div>
      );
    });
  };
  // remember, div in jsx means React.createElement('div', null, children)
  render() {
    return (
      <div className="container">
        <Header title="To do list" />
        <div className='input-container'>
          <input className='input' value={this.state.text} onChange={this.onChange} />
          <div className='button' onClick={this.handleAdd}>添加</div>
        </div>
        {this.renderList(this.state.list)}
      </div>
    );
  }
}
