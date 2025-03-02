interface IElement {
  key: string;
  value: number;
}

interface IDiff {
  node: IElement;
  fromIndex: number;
  toIndex?: number; // 移动的元素的新位置
  type: string; // 新增的元素的 html 字符串
}

const oldArr = [
  {
    key: "1",
    value: 1,
  },
  {
    key: "2",
    value: 2,
  },
  {
    key: "3",
    value: 3,
  },
  {
    key: '5',
    value: 5
  }
];

const newArr = [
  {
    key: "2",
    value: 2,
  },
  {
    key: "1",
    value: 1,
  },
  {
    key: "3",
    value: 3,
  },
  {
    key: "4",
    value: 4,
  },
];

const genMap = (arr: IElement[]) => {
  const map: Record<string, { item: IElement; index: number }> = {};
  arr.forEach((item, index) => {
    map[item.key] = { index, item };
  });
  return map;
};

const diff = (oldArr: IElement[], newArr: IElement[]) => {
  // 先遍历新数组
  const diffs = [];
  const oldMap = genMap(oldArr);
  const newMap = genMap(newArr);

  let tempArr = [...oldArr];
  let lastIndex = 0;
  newArr.forEach((newItem, newIndex) => {
    const oldIndex = oldMap[newItem.key]?.index;
    // 如果没有找到，说明是新增
    if (oldIndex === undefined) {
      diffs.push({
        node: newItem,
        toIndex: newIndex,
        type: "add",
      });
    }
    // 如果找到，判断是否需要移动
    else {
      if (oldIndex !== newIndex) {
        if (oldIndex < lastIndex) {
          diffs.push({
            node: newItem,
            fromIndex: oldIndex,
            toIndex: newIndex,
            type: "move",
          });
          // 先删除
          tempArr = tempArr.filter((e) => e.key !== newItem.key);
        }
        lastIndex = Math.max(lastIndex, oldIndex);
      }
    }
  });

  oldArr.forEach((oldItem, oldIndex) => {
    if (!newMap[oldItem.key]) {
      diffs.push({
        node: oldItem,
        fromIndex: oldIndex,
        type: "delete",
      });
      tempArr = tempArr.filter((e) => e.key !== oldItem.key);
    }
  });

  return {
    diffs,
    tempArr,
  };
};

const patch = (diffs: IDiff[], tempArr: IElement[]) => {
  diffs.forEach((diff) => {
    const { node, fromIndex, toIndex, type } = diff;
    if (type == "add" || type == "move") {
      tempArr.splice(toIndex, 0, node);
    }
  });
  return tempArr;
};

const { tempArr, diffs } = diff(oldArr, newArr);
const result = patch(diffs, tempArr);
