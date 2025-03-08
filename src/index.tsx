import React from "./react/index.ts";
import Todos from "./component/todos.tsx"
import {TestDiff, TestDiff2} from './component/test-diff.tsx'

React.render(<Todos />, document.getElementById("root")!);
