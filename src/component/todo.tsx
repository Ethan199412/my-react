import React from '../react/index.ts'

export default class Todos extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            list: ['haha', 'ha'],
            text: ''
        }
    }

    onChange = (e) => {
        console.log('e', e)
        this.setState({
            text: e.target.value
        })
    }

    handleClick = () => {
        let text = this.state.text;
        this.setState({
            list: [...this.state.list, text],
            text: ''
        })
    }

    onDel = (index) => {
        this.setState({
            list: [...this.state.list.slice(0, index), ...this.state.list.slice(index + 1)]
        })
    }

    renderList = (list) => {
        return list.map((e, index) => {
            return (<div>
                <span>{e}</span>
                <button onClick={() => this.onDel(index)}>删除</button>
            </div>)
        })
    }
    // remember, div in jsx means React.createElement('div', null, children)
    render() {
        console.log('[p0] render', this.state)
        return <div>
            <input value={this.state.text} onChange={this.onChange} />
            <button onClick={this.handleClick}>添加</button>
            {this.renderList(this.state.list)}
        </div>
    }
}
