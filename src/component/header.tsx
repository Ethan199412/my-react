import React from "../react/index.ts";

interface IProps {
  title: string;
}

export default class Header extends React.Component<IProps> {
  constructor(props) {
    super(props);
    this.state = {
      color: "#065fd4",
    };
  }

  handleClick = () => {
    this.setState({
      color: "black",
    });
  };

  render() {
    const { color } = this.state;
    return (
      <h1 style={{ color }} onClick={this.handleClick}>
        {this.props.title}
      </h1>
    );
  }
}
