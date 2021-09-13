import React from "./react";
import Todo from "./component/todo"
// class Counter extends React.Component {
//   constructor(props) {
//     super(props);
//     this.state = {
//       number: 1,
//       value: '',
//       odd: true
//     };
//   }

//   componentDidMount() {
//     setTimeout(() => {
//       this.setState({
//         odd: !this.state.odd
//       })
//     }, 1000)
//   }

//   onClick = () => {
//     this.setState({
//       number: this.state.number + 1
//     })
//   };
//   handleChange = (e) => {
//     this.setState({
//       value: e.target.value
//     })
//   }
//   render() {
//     console.log('[p0] render state', this.state)
//     if (this.state.odd) {
//       return <ul>
//         <li key='a'>a</li>
//         <li key='b'>b</li>
//         <li key='c'>c</li>
//         <li key='d'>d</li>
//       </ul>
//     }
//     else {
//       return <ul>
//         <li key='a'>a1</li>
//         <li key='c'>c1</li>
//         <li key='b'>b1</li>
//         <li key='e'>e</li>
//         <li key='f'>f1</li>
//       </ul>
//     }
//   }
// }

// class SubComponent extends React.Component {
//   componentWillMount() {
//     console.log("sub will mount");
//   }
//   componentDidMount() {
//     console.log("sub did mount");
//   }
//   constructor(props) {
//     super(props);
//   }
//   render() {
//     return <div>{this.props.number}</div>;
//   }
// }
// let element = (
//   <div>
//     <button onClick={()=>{
//         console.log('add clicked')
//     }}>add</button>
//     <button>minus</button>
//     <div>mike</div>
//   </div>
// );

React.render(<Todo />, document.getElementById("root"));
