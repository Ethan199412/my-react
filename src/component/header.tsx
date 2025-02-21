import React from '../react/index.ts'

interface IProps {
    title: string
}

export default class Header extends React.Component<IProps> {
    constructor(props) {
        super(props)
    }

    render() {
        return <h1>
            {this.props.title}
        </h1>
    }
}
