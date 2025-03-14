import React from "../react/index.ts";

export class TestDiff extends React.Component<any> {
  constructor(props) {
    super(props);
    this.state = {
      show: true
    };
  }

  handleClick=()=>{
    this.setState({
      show: !this.state.show
    })
  }

  render() {
    const { show } = this.state;
    return (
      <div>
        {show && <div key={'haha'}>
            <div>haha</div>
            <div>haha</div>
            <div>haha</div>
            <div>haha</div>
          </div>}
        <button key={'button'} onClick={this.handleClick}>show</button>
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
        <button onClick={this.handleClick}>click</button>
      </div>
    );
  }
}
