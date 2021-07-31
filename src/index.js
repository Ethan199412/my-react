import React from "./react";

class Counter extends React.Component {
  constructor(props) {
    super(props);
    this.state = { number: 1 };
  }
  componentWillMount() {
    console.log("father will mount");
  }
  componentDidMount() {
    setInterval(() => {
      this.setState({
        number: this.state.number + 1,
      });
    }, 1000);
  }
  shouldComponentUpdate(nextProps,nextState){
      return true
  }
  componentDidUpdate(){
      console.log('father did update')
  }
  onClick = () => {
    console.log("haha");
  };
  render() {
    return (
      <div>
        <div>{this.state.number}</div>
        <button onClick={this.onClick}>add</button>
        <button>minus</button>
        <SubComponent number={this.state.number} />
      </div>
    );
  }
}

class SubComponent extends React.Component {
  componentWillMount() {
    console.log("sub will mount");
  }
  componentDidMount() {
    console.log("sub did mount");
  }
  constructor(props) {
    super(props);
  }
  render() {
    return <div>{this.props.number}</div>;
  }
}
// let element = (
//   <div>
//     <button onClick={()=>{
//         console.log('add clicked')
//     }}>add</button>
//     <button>minus</button>
//     <div>mike</div>
//   </div>
// );

React.render(<Counter />, document.getElementById("root"));
