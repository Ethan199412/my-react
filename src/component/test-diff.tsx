import React from "../react/index.ts";
// import React from 'react'

// import * as React from 'react'
export class TestDiff extends React.Component<any, any> {
  state: any;
  constructor(props) {
    super(props);
    this.state = {
      list: [3, 1, 5, 2, 4],
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
    list.push(Math.max(...list) + 1);
    this.setState({
      list: [...list],
    });
  };

  handleUpdate = () => {
    this.setState({
      list: [3, 5, 1, 4, 2],
    });
  };

  // 问题的原因在于 oldChildrenMap 里面的 rootId 重复了
  render() {
    const { list } = this.state;
    return (
      <div>
        <div>
          {list.map((e, index) => (
            <div key={e} onClick={() => this.handleDel(index)}>
              {e}
            </div>
          ))}
          <button key={"btn-add"} onClick={this.handleAdd}>
            add
          </button>
          <button key={"btn-up"} onClick={this.handleUpdate}>
            update
          </button>
        </div>
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
