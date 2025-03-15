import React from "../react/index.ts";

export class TestDiff extends React.Component<any> {
  constructor(props) {
    super(props);
    this.state = {
      number: 0,
      number2: 2,
    };
  }

  handleClick = () => {
    this.setState({
      number: this.state.number + 1,
    });

    this.setState({
      number2: this.state.number2 + 1,
    });
    console.log('[p2.0]', this.state)
  };

  render() {
    const { number, number2 } = this.state;
    return (
      <div>
        <div>{number}</div>
        <div>{number2}</div>
        <button key={"button"} onClick={this.handleClick}>
          show
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
