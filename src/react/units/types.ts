import { NodeAction } from "../types";
import $ from "jquery";

export interface IDiff {
  parentId: string; // 父 dom 的 id
  parentNode: $<HTMLElement>; // 父 dom 的 JQ 节点
  type: NodeAction; // 对比后判断是新增，删除，还是移动
  fromIndex?: number; // 移动的元素的原来的位置
  toIndex?: number; // 移动的元素的新位置
  markup?: string; // 新增的元素的 html 字符串
}

export const COMMON_TYPE = new Set<string>(["string", "number"]);
