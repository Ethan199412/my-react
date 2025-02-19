import React from '../react/index.ts'

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
            {this.state.list.map(e=><div>
                <div>{e}</div>
                <div>haha</div>
            </div>)}
        </div>
    }
}
