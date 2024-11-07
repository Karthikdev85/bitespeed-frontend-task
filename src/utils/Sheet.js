export function computeRowsAndColumnsCells(
  size,
  subSize,
  offset,
  cellOffset,
  scrolledDistance
) {
  //   const availablePlaces = Math.floor(size / subSize);
  const visibleCells = [];
  const cellStartPos = [];
  const cellEndPos = [];

  let cellCount = cellOffset;
  let i = offset;

  while (i < size) {
    const cell = {
      id: cellCount,
      point1: i - scrolledDistance,
      point2: i + subSize - scrolledDistance,
      content: getEncodedCharacter(cellCount + 1),
      get width() {
        return this.point2 - this.point1;
      },
    };
    // if (cellCount > 0) {
    //   cell.center += visibleCells[cellCount - 1].center;
    // }
    // + Math.abs(colEndPos[i] - colStartPos[i]) * 0.5
    visibleCells.push(cell);
    cellStartPos.push(i);

    cellCount++;
    i += subSize;
    cellEndPos.push(i);
  }
  //   console.log(visibleCells, cellStartPos, cellEndPos);

  // console.log(visibleCells);
  return visibleCells;
}

export function sheetUtils({
  canvasWidth: width,
  canvasHeight: height,
  CELL_WIDTH: cellWidth,
  CELL_HEIGHT: cellHeight,
  rowHeaderWidth,
  colHeaderHeight,
  cellsOffset,
} = {}) {
  const {
    visibleCells: visibleRows,
    cellStartPos: rowStartPos,
    cellEndPos: rowEndPos,
  } = computeRowsAndColumnsCells(
    height,
    cellHeight,
    colHeaderHeight,
    cellsOffset.y
  );

  const {
    visibleCells: visibleCols,
    cellStartPos: colStartPos,
    cellEndPos: colEndPos,
  } = computeRowsAndColumnsCells(
    width,
    cellWidth,
    rowHeaderWidth,
    cellsOffset.x
  );
  // console.log(visibleRows, visibleCols);

  // console.log("visible cols", visibleCols);
  // console.log("visible rows", visibleRows);

  // console.log("cols start", colStartPos);
  // console.log("cols end", colEndPos);
  //   console.log(rowStartPos, rowEndPos);

  return {
    visibleCols,
    visibleRows,
    colStartPos,
    colEndPos,
    rowStartPos,
    rowEndPos,
  };
}

export function resizeCanvas(canvas) {
  const { width, height } = canvas.getBoundingClientRect();

  const ratio = window.devicePixelRatio;

  const newCanvasWidth = Math.round(width * ratio);
  const newCanvasHeight = Math.round(height * ratio);

  const context = canvas.getContext("2d");

  canvas.width = newCanvasWidth;
  canvas.height = newCanvasHeight;
  context.scale(ratio, ratio);
}

export function getEncodedCharacter(num) {
  let result = "";

  while (num > 0) {
    const rem = (num - 1) % 26;
    result = String.fromCharCode(65 + rem) + result;
    num = Math.floor((num - 1) / 26);
  }
  return result;
}

export function sheetColumns(rowHeaderWidth) {
  const cols = 50;
  const width = 100;
  const colCells = [];

  for (let i = 0; i < cols; i++) {
    const cell = {
      id: i,
      point1: rowHeaderWidth,
      point2: rowHeaderWidth + width,
      content: getEncodedCharacter(i + 1),
      get width() {
        return this.point2 - this.point1;
      },
    };
    colCells.push(cell);
    rowHeaderWidth += width;
  }
  return colCells;
}

export function sheetRows(colHeaderHeight) {
  const rows = 300;
  const height = 24;
  const rowCells = [];

  for (let i = 0; i < rows; i++) {
    const cell = {
      id: i,
      point1: colHeaderHeight,
      point2: colHeaderHeight + height,
      get height() {
        return this.point2 - this.point1;
      },
    };
    rowCells.push(cell);
    colHeaderHeight += height;
  }

  return rowCells;
}

export const decodeRowCol = (cell) => {
  const [, colLetter, rowNum] = cell.match(/([A-Z]+)(\d+)/);
  const colIndex =
    colLetter
      .split("")
      .reduce((acc, char) => acc * 26 + char.charCodeAt(0) - 64, 0) - 1;
  const rowIndex = parseInt(rowNum, 10) - 1;
  return [rowIndex, colIndex];
};

export const checkFormulaExpr = (formula, sheetData) => {
  if (!formula.startsWith("=")) {
    return { valid: false, error: 'Formula must start with "=".' };
  }

  // Remove the leading '='
  const expression = formula.substring(1).trim();

  // Define allowed operators and patterns
  const operatorPattern = /[+\-*/()]/;
  const cellRefPattern = /^[A-Z]+[0-9]+$/;
  const numberPattern = /^\d+(\.\d+)?$/;

  // Tokenize the expression
  // This regex matches cell references, numbers, and operators
  const tokenRegex = /([A-Z]+[0-9]+|\d+(\.\d+)?|[+\-*/()])/g;
  const tokens = expression.match(tokenRegex);

  if (!tokens) {
    return { valid: false, error: "Invalid formula syntax." };
  }

  // Validate each token
  for (let token of tokens) {
    if (operatorPattern.test(token)) {
      // Token is a valid operator
      continue;
    } else if (numberPattern.test(token)) {
      // Token is a valid number
      continue;
    } else if (cellRefPattern.test(token)) {
      // Token is a potential cell reference
      const decoded = decodeRowCol(token);
      if (!decoded) {
        return { valid: false, error: `Invalid cell reference "${token}".` };
      }
      const [row, col] = decoded;
      if (
        row < 0 ||
        row >= sheetData.length ||
        col < 0 ||
        col >= sheetData[0].length
      ) {
        return {
          valid: false,
          error: `Cell reference "${token}" is out of bounds.`,
        };
      }
      continue;
    } else {
      // Token is invalid
      return { valid: false, error: `Invalid token "${token}" in formula.` };
    }
  }

  // Check for balanced parentheses
  let balance = 0;
  for (let char of expression) {
    if (char === "(") balance++;
    if (char === ")") balance--;
    if (balance < 0) {
      return { valid: false, error: "Unbalanced parentheses in formula." };
    }
  }
  if (balance !== 0) {
    return { valid: false, error: "Unbalanced parentheses in formula." };
  }

  return { valid: true };
};

export const createAdjanceyList = (formula, curRow, curCol, sheet) => {
  const cellRegex = /([A-Z]+)(\d+)/g;
  const cells = formula.match(cellRegex);
  const rows = [];
  const cols = [];
  cells.forEach((cell) => {
    const [rowIndex, colIndex] = decodeRowCol(cell);
    rows.push(rowIndex);
    cols.push(colIndex);
  });

  const adjanceyList = {
    [`${curRow}-${curCol}`]: [...sheet[curRow][curCol].dependencies],
  };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const col = cols[i];
    const dep = [...sheet[row][col].dependencies];
    console.log("sheet", dep);
    // dep.add(`${curRow}-${curCol}`);
    adjanceyList[`${row}-${col}`] = dep;
  }

  console.log(adjanceyList);
  return adjanceyList;
};

export const hasCycle = (adjList) => {
  const visited = new Set();
  const recStack = new Set();

  function dfs(node) {
    if (!visited.has(node)) {
      visited.add(node);
      recStack.add(node);

      const neighbors = adjList[node] || [];
      for (let neighbor of neighbors) {
        if (!visited.has(neighbor) && dfs(neighbor)) {
          return true;
        } else if (recStack.has(neighbor)) {
          return true;
        }
      }
    }
    recStack.delete(node);
    return false;
  }

  for (let node in adjList) {
    if (dfs(node)) {
      return true;
    }
  }
  return false;
};

export const checkRefErrInFormula = (formula, sheetData) => {
  const cellRegex = /([A-Z]+)(\d+)/g;
  const cells = formula.match(cellRegex);
  cells.forEach((cell) => {
    const [rowIndex, colIndex] = decodeRowCol(cell);
    if (sheetData[rowIndex][colIndex].refError) {
      return true;
    }
  });
  return false;
};

export function computeStartEndPos(list, offset, size) {
  let startPos;
  let endPos;

  for (let i = 0; i < list.length; i++) {
    const tab = list[i];
    if (!startPos && tab.point2 > offset) {
      startPos = tab;
    }
    if (!endPos && tab.point2 > size) {
      endPos = tab;
      break;
    }
  }
  return [startPos, endPos];
}

// export function updateColumnsCord(totalCols, scrollX) {
//   const updatedCols = totalCols.map((col) => ({
//     ...col,
//     point1: col.point1 - scrollX.current,
//     point2: col.point2 - scrollX.current,
//   }));
//   return updatedCols;
// }
