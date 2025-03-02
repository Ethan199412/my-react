import { IDiff } from "./types";

let diffQueue: IDiff[] = []; //差异队列
let updateDepth = 0; //更新的级别

export const unitGlobal = {
    diffQueue,
    updateDepth
}