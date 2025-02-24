import React from "../react/index.ts";

export class TestDiff extends React.Component<any> {
  constructor(props) {
    super(props);
    this.state = {
      list: [1, 2, 3],
    };
  }

  handleClick = (index) => {
    const { list } = this.state;
    list.splice(index, 1);
    this.setState({
      list: [...list],
    });
  };

  handleAdd = () => {
    const { list } = this.state;
    list.push(list[list.length - 1] ? list[list.length - 1]+1 :  1);
    this.setState({
      list: [...list],
    });
  };

  render() {
    const { list } = this.state;
    return (
      <div>
        {list.map((e, index) => (
          <div key={e} onClick={() => this.handleClick(index)}>
            {e}
          </div>
        ))}
        <button onClick={this.handleAdd}>
          add
        </button>
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

  handleClick = () => {
    const { list } = this.state;

    this.setState({
      list: [1,3],
    });
  };

  handleAdd = () => {
    const {list} = this.state;
    const lastNumber = list[list.length - 1] ? list[list.length - 1] : 0;

    list.push(lastNumber + 1);
    this.setState({
      list: [...list],
    })
    
  }

  render() {
    const { list } = this.state;
    return (
      <div>
        <div>
          {list.map((e, index) => (
            <div key={'key-'+e}>{e}</div>
          ))}
        </div>
        <button onClick={this.handleClick}>del</button>
        <button onClick={this.handleAdd}>Add</button>
      </div>
    );
  }
}
