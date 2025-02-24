import React from "../react/index.ts";

export default class TestDiff extends React.Component<any> {
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

  render() {
    const { list } = this.state;
    return (
      <div>
        {list.map((e, index) => (
          <div onClick={() => this.handleClick(index)}>{e}</div>
        ))}
      </div>
    );
  }
}
