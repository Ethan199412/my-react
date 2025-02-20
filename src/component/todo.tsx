import React from '../react/index.ts'

export default class Todos extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            list: ['to learn js', 'to learn react'],
            text: ''
        }
    }

    onChange = (e) => {
        console.log('e', e)
        this.setState({
            text: e.target.value
        })
    }

    handleAdd = () => {
        let text = this.state.text;
        if(!text){
            alert('please input something')
            return
        }
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
        return <div>
            <input value={this.state.text} onChange={this.onChange} />
            <button onClick={this.handleAdd}>添加</button>
            {this.renderList(this.state.list)}
        </div>
    }
}
