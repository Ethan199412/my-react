import React from "../react/index.ts";

export class TestDiff extends React.Component<any> {
  constructor(props) {
    super(props);
    this.state = {
      list: [1, 2, 3, 4],
    };
  }

  handleDel = (index) => {
    const { list } = this.state;
    list.splice(index, 1);
    this.setState({
      list: [...list],
    });
  };

  handleAdd = () => {
    const { list } = this.state;
    list.push(list[list.length - 1]+1);
    this.setState({
      list: [...list],
    });
  }

  handleUpdate=()=>{
    this.setState({
      list: [3,1,4,2],
    });
  }

  render() {
    const { list } = this.state;
    return (
      <div>
        <div>
          {list.map((e, index) => (
            <div key={'key-'+e} onClick={() => this.handleDel(index)}>
              {e}
            </div>
          ))}
        </div>
        <button onClick={this.handleAdd}>add</button>
        <button onClick={this.handleUpdate}>update</button>
      </div>
    );
  }
}

export class TestDiff2 extends React.Component<any> {
  constructor(props) {
    super(props);
    this.state = {
      list: [1, 2, 3, 4],
    };
  }

  handleDel = () => {
    const { list } = this.state;
    list.splice(0, 1);
    list.splice(1, 1);
    this.setState({
      list: [...list],
    });
  };

  render() {
    const { list } = this.state;
    return (
      <div>
        <div>
          {list.map((e, index) => (
            <div key={e}>{e}</div>
          ))}
        </div>
        <button onClick={this.handleDel}>click</button>
      </div>
    );
  }
}
