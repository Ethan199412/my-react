import React from '../react'

export default class Test extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            list: [1,2,3,4,5],
            text: ''
        }
    }

    render() {
        return <div>
            {this.state.list.map(e=><div>{e}</div>)}
        </div>
    }
}
