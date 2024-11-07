import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkFormulaExpr,
  checkRefErrInFormula,
  computeRowsAndColumnsCells,
  createAdjanceyList,
  decodeRowCol,
  getEncodedCharacter,
  hasCycle,
  resizeCanvas,
  sheetColumns,
  sheetRows,
  sheetUtils,
  computeStartEndPos,
} from "./utils/Sheet";
import { column, evaluate } from "mathjs";
import _ from "lodash";

const sheetData = [];
for (let row = 0; row < 300; row++) {
  const rowData = [];
  for (let col = 0; col < 50; col++) {
    const cellInfo = {
      id: `${row}-${col}`,
      value: `${col}`,
      formula: "",
      dependencies: new Set(),
      isMerged: false, // For merge functionality
      masterCellId: null,
      refError: false,
      formulaErr: false,
    };
    rowData.push(cellInfo);
  }
  sheetData.push(rowData);
}

export default function Sheet({
  excludeHeight,
  setAddressBar,
  handleInputChange,
  sharedValue,
  setSharedValue,
  formulaEditState,
  setFormulaEditState,
  mergeSte,
}) {
  const canvasRef = useRef(null);
  const scrollX = useRef(0);
  const scrollY = useRef(0);
  // const sheetStore = useRef(sheetData);
  const [sheetStore, setSheetStore] = useState(() => [...sheetData]);
  const [mergedCells, setMergedCells] = useState([]);
  const activeCellRef = useRef({
    x: 0,
    y: 0,
    value: "",
    formula: "",
    edited: false,
  });
  // const [scrollEnded, setScrollEnded] = useState(false);

  const [canvasWidth, setCanvasWidth] = useState(window.innerWidth);
  const [canvasHeight, setCanvasHeight] = useState(
    window.innerHeight - excludeHeight
  );
  const [cellsOffset, setCellsOffset] = useState({ x: 0, y: 0 });

  const [selectionInProgress, setSelectionInProgress] = useState(false);
  const [singleSelect, setSingleSelect] = useState({ x: -1, y: -1 });
  const [selection, setSelection] = useState({
    x1: 0,
    y1: 0,
    x2: 0,
    y2: 0,
  });

  const [columnResizeState, setColumnResizeState] = useState(false);
  const [columnResizeCord, setColumnResizeCord] = useState({
    x: 0,
    y: 0,
    id: -1,
  });

  const [rowResizeState, setRowResizeState] = useState(false);
  const [rowResizeCord, setRowResizeCord] = useState({
    x: 0,
    y: 0,
    id: -1,
  });

  // cell Input
  const [isEditable, setIsEditable] = useState(false); // State to toggle between editable and non-editable
  const [content, setContent] = useState(""); // Initial content
  const [editCell, setEditCell] = useState({ x: -1, y: -1 });
  const contentEditableRef = useRef(null);
  const debounceTimeout = useRef(null);
  const [inputCord, setInputCord] = useState({
    x: 0,
    y: 0,
    width: 100,
    height: 20,
  });

  //     setRowResizeState(true);
  // setRowResizeCord

  const rowHeaderWidth = 50;
  const colHeaderHeight = 24;

  const HEADER_COLOR = "#f3f3f3";
  const GRID_LINE_COLOR = "#e2e3e3";
  const HEADER_TEXT_COLOR = "#666666";
  const SELECTION_COLOR = "#e9f0fd";
  const SELECTION_BORDER_COLOR = "#0b57d0";
  const cursor = ["default", "col-resize", "row-resize"];

  const CELL_WIDTH = 100;
  const CELL_HEIGHT = 22;

  // visi
  const columnStartRef = useRef(0);
  const rowStartRef = useRef(0);

  const totalColumns = useRef(null);
  const totalRows = useRef(null);

  if (!totalColumns.current) {
    totalColumns.current = sheetColumns(rowHeaderWidth, scrollX.current);
  }
  if (!totalRows.current) {
    totalRows.current = sheetRows(colHeaderHeight);
  }

  const scrollTimeout = useRef(null);
  const animationFrameRef = useRef(null);

  function cellPositionFromCoordinate(x, y) {
    let cellX = 0;
    let cellY = 0;

    for (let i = columnStartRef.current; i < totalColumns.current.length; i++) {
      const col = totalColumns.current[i];
      if (col.point1 > canvasWidth) break;
      if (x >= col.point1 && x <= col.point2) {
        cellX = col.id;
      }
    }

    for (let i = rowStartRef.current; i < totalRows.current.length; i++) {
      const row = totalRows.current[i];
      if (row.point1 > canvasHeight) break;
      if (y >= row.point1 && y <= row.point2) {
        cellY = row.id;
      }
    }

    return { x: cellX, y: cellY };
  }

  useEffect(() => {
    const threshold = 5;

    if (!columnResizeState && columnResizeCord.id !== -1) {
      const columnId = columnResizeCord.id;

      let newColOffset = 0;
      totalColumns.current = totalColumns.current.map((c) => {
        if (c.id === columnId) {
          const newPoint2 =
            columnResizeCord.x <= c.point1 + threshold
              ? c.point1 + threshold
              : columnResizeCord.x;
          newColOffset = newPoint2 - c.point2;
          return { ...c, point2: newPoint2 };
        }
        if (c.id > columnId) {
          return {
            ...c,
            point1: c.point1 + newColOffset,
            point2: c.point2 + newColOffset,
          };
        }
        return c;
      });
    }

    if (!rowResizeState && rowResizeCord.id !== -1) {
      const rowId = rowResizeCord.id;
      let newRowOffset = 0;
      totalRows.current = totalRows.current.map((r) => {
        if (r.id === rowId) {
          const newPoint2 =
            rowResizeCord.y <= r.point1 + threshold
              ? r.point1 + threshold
              : rowResizeCord.y;
          newRowOffset = newPoint2 - r.point2;
          return { ...r, point2: newPoint2 };
        }
        if (r.id > rowId) {
          return {
            ...r,
            point1: r.point1 + newRowOffset,
            point2: r.point2 + newRowOffset,
          };
        }
        return r;
      });
    }
  }, [columnResizeCord, columnResizeState, rowResizeCord, rowResizeState]);

  useEffect(() => {
    drawCanvas();
  }, [
    canvasHeight,
    canvasWidth,
    // cellsOffset.x,
    // cellsOffset.y,
    selection,
    // scrollX.cur,
    columnResizeCord,
    columnResizeState,
    rowResizeCord,
    rowResizeState,
    sheetStore,
  ]);

  useEffect(() => {
    const resizeCanvas = () => {
      setCanvasWidth(window.innerWidth);
      setCanvasHeight(window.innerHeight);
    };
    window.addEventListener("resize", resizeCanvas);
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, []);

  function updateColumnsCord() {
    totalColumns.current = totalColumns.current.map((col) => ({
      ...col, // Maintain other properties of the column
      point1: Math.abs(col.point1) - scrollX.current,
      point2: Math.abs(col.point2) - scrollX.current,
    }));
  }

  function handleCellsOffset(cord) {
    let sx = cord.sx;
    let sy = cord.sy;
    // const col = cord.cellsOffsetX;
    // scrollX.cur = sx;

    // setCellsOffset({ x: cord.cellsOffsetX, y: cord.cellsOffsetY });
  }

  function onScroll(e) {
    const sx = e.target.scrollLeft;
    const sy = e.target.scrollTop;
    const cellWidth = totalColumns.current[0].width;
    const cellHeight = totalRows.current[0].height;
    const cellsOffsetX = Math.floor(sx / cellWidth);
    const cellsOffsetY = Math.floor(sy / cellHeight);

    const scrollOffsetX = sx - scrollX.current;
    scrollX.current = sx;
    const scrollOffsetY = sy - scrollY.current;
    scrollY.current = sy;

    handleCellsOffset({ cellsOffsetX, cellsOffsetY, sx, sy });
    // setCellsOffset({ x: cellsOffsetX, y: cellsOffsetY });
    // setScrollEnded(false);
    if (scrollTimeout.current) {
      clearTimeout(scrollTimeout.current);
    }
    updateLineCoordinates(scrollOffsetX, scrollOffsetY);
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(drawLinesOnCanvas);
    } else {
      cancelAnimationFrame(animationFrameRef.current);
    }
    // drawLinesOnCanvas();

    // Set a new timeout to detect when scrolling ends (e.g., after 200ms of no scrolling)
    scrollTimeout.current = setTimeout(() => {
      // setScrollEnded(true); // Update state when scrolling has stopped
      // setTotalColumns([...globalCols]);
      // updateStateAfterScroll(); // Call your state update logic here
      drawCanvas();
    }, 100);
  }

  const drawLinesOnCanvas = () => {
    // // Clear canvas
    // context.clearRect(0, 0, canvas.width, canvas.height);
    drawCanvas();

    // Reset the animation frame reference
    animationFrameRef.current = null;
  };

  const updateLineCoordinates = (scrollOffsetX, scrollOffsetY) => {
    totalColumns.current = totalColumns.current.map((line) => ({
      ...line,
      point1: line.point1 - scrollOffsetX,
      point2: line.point2 - scrollOffsetX,
    }));
    // drawLinesOnCanvas();

    totalRows.current = totalRows.current.map((line) => ({
      ...line,
      point1: line.point1 - scrollOffsetY,
      point2: line.point2 - scrollOffsetY,
    }));
  };

  function drawColumnResizeBar(x) {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    ctx.strokeStyle = "#ff0015";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  function getColumnForResize(x, threshold = 3) {
    let columnBar;

    // totalColumns.current.find(
    //   (c) => Math.abs(x - c.point2) <= threshold
    // );

    for (let i = columnStartRef.current; i < totalColumns.current.length; i++) {
      let col = totalColumns.current[i];
      if (col.point2 > canvasWidth) break;
      if (Math.abs(col.point2 - x) <= threshold) {
        columnBar = col;
        break;
      }
    }
    return columnBar;
  }

  function getRowForResize(y, threshold = 3) {
    let rowBar;
    for (let i = rowStartRef.current; i < totalRows.current.length; i++) {
      let row = totalRows.current[i];
      if (row.point2 > canvasHeight) break;
      if (Math.abs(row.point2 - y) <= threshold) {
        rowBar = row;
        break;
      }
    }
    return rowBar;
  }

  function columnResize(e, x, y, mouseDown = false) {
    if (y < colHeaderHeight && x < canvasWidth && x > rowHeaderWidth) {
      const column = getColumnForResize(x);
      if (column) {
        e.target.style.cursor = "col-resize";
      }
      if (mouseDown && column) {
        return column;
      }
    }
  }

  function rowResize(e, x, y, mouseDown = false) {
    if (x < rowHeaderWidth && y < canvasHeight && y > colHeaderHeight) {
      const row = getRowForResize(y);
      if (row) {
        e.target.style.cursor = "row-resize";
      }
      if (mouseDown && row) {
        return row;
      }
    }
  }

  function onMouseDown(e) {
    console.log("mousedown");
    setIsEditable(false);
    setFormulaEditState(false);

    const x = e.clientX;
    const y = e.clientY - excludeHeight;
    const threshold = 16;
    console.log(y, window.innerHeight - threshold);
    if (
      x >= window.innerWidth - threshold ||
      e.clientY >= window.innerHeight - threshold
    )
      return;

    const column = columnResize(e, x, y, true);

    if (column) {
      setColumnResizeState(true);
      setColumnResizeCord((prev) => ({
        ...prev,
        x: column.point2,
        y: canvasHeight,
        id: column.id,
      }));
      setRowResizeCord({ x: 0, y: 0, id: -1 });
      return;
    }

    const row = rowResize(e, x, y, true);

    if (row) {
      setRowResizeState(true);
      setRowResizeCord((prev) => ({
        ...prev,
        x: canvasWidth,
        y: row.point2,
        id: row.id,
      }));
      setColumnResizeCord({ x: 0, y: 0, id: -1 });
      return;
    }

    setSelectionInProgress(true);

    const select1 = cellPositionFromCoordinate(x, y);
    const select2 = { ...select1 };

    // setSingleSelect({
    //   x: select1.x,
    //   y: select1.y,
    // });
    activeCellRef.current.x = select1.x;
    activeCellRef.current.y = select1.y;

    setSelection({
      x1: select1.x,
      y1: select1.y,
      x2: select2.x,
      y2: select2.y,
    });

    // setEditCell({ x: select1.x, y: select1.y });
    // const width =
    //   totalColumns.current[select1.x]?.point2 -
    //   totalColumns.current[select1.x]?.point1 -
    //   2;
    // const height =
    //   totalRows.current[select1.y]?.point2 -
    //   totalRows.current[select1.y]?.point1 -
    //   2;

    // setInputCord({
    //   x: totalColumns.current[select1.x]?.point1 + 1,
    //   y: totalRows.current[select1.y]?.point1 + 1,
    //   // width: totalColumns.current[select1.x]?.width - 2,
    //   // height: totalRows.current[select1.y]?.height - 2,
    //   width,
    //   height,
    // });
    // fillCellContentOnSelection(selection.x1,selection.y1);
    const content = sheetStore[selection.y1][selection.x1].value;
    // setSharedValue(content);
  }

  function fillCellContentOnSelection(x, y) {
    const value = sheetStore[y][x].value;
    const formula = sheetStore[y][x].formula;
    let content = formula ? formula : value;
    // setContent(content);
    // setSharedValue(content);
  }

  useEffect(() => {
    // sheetStore[selection.y1][selection.x1].value = sharedValue;
    // drawCanvas();
  }, [sharedValue]);

  function onMouseMove(e) {
    const x = e.clientX;
    const y = e.clientY - excludeHeight;

    if (e.target.style.cursor !== "default" && !columnResizeState) {
      e.target.style.cursor = "default";
    }

    columnResize(e, x, y);
    if (columnResizeState) {
      setColumnResizeCord((prev) => ({ ...prev, x, y }));
    }

    rowResize(e, x, y);
    if (rowResizeState) {
      setRowResizeCord((prev) => ({ ...prev, x, y }));
    }

    if (selectionInProgress) {
      const select2 = cellPositionFromCoordinate(x, y);
      setSelection({ ...selection, x2: select2.x, y2: select2.y });
    }
  }

  function onMouseUp() {
    console.log("mouseup");
    setSelectionInProgress(false);
    setColumnResizeState(false);
    setRowResizeState(false);
    // setIsEditable(false);
  }

  function handleDoubleClick(e) {
    const x = e.clientX;
    const y = e.clientY - excludeHeight;
    const cell = cellPositionFromCoordinate(x, y);

    // setEditCell({ x: cell.x, y: cell.y });
    setIsEditable(true);
  }

  const getMissingCells = useCallback((oldExpression, newExpression) => {
    const newExpressionSet = new Set(newExpression);

    // Find cells present in expr1 but missing in expr2
    const missingCells = oldExpression.filter(
      (cell) => !newExpressionSet.has(cell)
    );

    return missingCells;
  }, []);

  const reEvaluateFormula = useCallback(
    (dependentCell, row, col, newValue, newSheetData) => {
      const formula = dependentCell.formula.substring(1);
      const regex = /[A-Z]+[0-9]+/g;
      const matches = formula.match(regex);
      // const [depRow, depCol] = dependentCell.id.split("-").map(Number);
      const value = resolveExpression(
        formula,
        matches,
        newSheetData,
        row,
        col,
        newValue
      );
      return value;
    },
    []
  );

  useEffect(() => {
    // console.log(sheetStore);
  }, [sheetStore]);

  useEffect(() => {
    console.log(mergedCells, selection);
    const { x1, y1, x2, y2 } = selection;
    let isMergedCell;
    if (mergedCells || Array.isArray(mergedCells)) {
      isMergedCell = mergedCells.find(
        (cell) => cell.x1 === x1 && cell.y1 === y1
      );
    }
    if (mergeSte) {
      setMergedCells((m) => {
        console.log(m);
        if (!isMergedCell) {
          const mergeCell = { ...selection };
          mergeCell.masterCellId = `${y1}-${x1}`;
          return [...m, mergeCell];
        }
        return m;
      });
    } else {
      setMergedCells((m) => {
        if (isMergedCell) {
          return m.filter(
            (c) => c.x1 !== isMergedCell.x1 && c.y1 !== isMergedCell.y1
          );
        }
        return m;
      });
    }

    setSheetStore((prevSheetData) => {
      const newSheetData = prevSheetData.map((r) => r.map((c) => ({ ...c })));
      if (mergeSte) {
        // const { x1, y1, x2, y2 } = selection;
        for (let i = x1; i <= x2; i++) {
          for (let j = y1; j <= y2; j++) {
            newSheetData[j][i].isMerged = true;
            newSheetData[j][i].masterCellId = `${y1}-${x1}`;
          }
        }
      } else {
        const { x1, y1, x2, y2 } = selection;
        for (let i = x1; i <= x2; i++) {
          for (let j = y1; j <= y2; j++) {
            newSheetData[j][i].isMerged = false;
            newSheetData[j][i].masterCellId = null;
          }
        }
      }
      // console.log(newSheetData);
      return newSheetData;
    });
    drawCanvas();
  }, [mergeSte]);

  const updateCellValue = useCallback((row, col, inputValue) => {
    console.log("updateCellValue", inputValue);
    setSheetStore((prevSheetData) => {
      // Shallow copy the previous state to avoid mutating the original
      const newSheetData = prevSheetData.map((r) => r.map((c) => ({ ...c })));
      // const newSheetData = JSON.parse(JSON.stringify(prevSheetData));
      const updatedRow = [...newSheetData[row]];
      const updatedCell = newSheetData[row][col];
      const oldDependencies = new Set(updatedCell.dependencies);

      if (inputValue.startsWith("=")) {
        const formula = inputValue.substring(1);
        const oldFormula = updatedCell.formula;

        const cellRegex = /([A-Z]+)(\d+)/g;
        // clear or update dependency

        const validFormula = checkFormulaExpr(formula, newSheetData);

        if (oldFormula) {
          const oldExpression = oldFormula.match(cellRegex);
          const newExpression = formula.match(cellRegex);
          const missingCells = getMissingCells(oldExpression, newExpression);

          console.log("missing cells", missingCells);
          missingCells.forEach((cell) => {
            const [rowIndex, colIndex] = decodeRowCol(cell);
            newSheetData[rowIndex][colIndex].dependencies.delete(
              `${row}-${col}`
            );
          });
        }

        const adjanceyList = createAdjanceyList(
          formula,
          row,
          col,
          newSheetData
        );
        const isFormulaCyclic = hasCycle(adjanceyList);
        const isRefError = checkRefErrInFormula(formula, sheetData);
        if (isFormulaCyclic || isRefError) {
          updatedCell.formula = inputValue;
          // updatedCell.value = "0";
          updatedCell.refError = true;
          updatedCell.formulaErr = false;
        } else {
          updatedCell.formula = inputValue;
          updatedCell.value = evaluateFormula(formula, newSheetData);
          updatedCell.refError = false;
          updatedCell.formulaErr = false;
        }
        /* 
        A1: new Set(B1)
        B1: new Set(A1)
        C1: new Set(B1)
        */
        // Update dependencies
        const newDependencies = new Set(formula.match(cellRegex) || []);
        // updatedCell.dependencies = newDependencies;

        newDependencies.forEach((dep) => {
          const [rowIndex, colIndex] = decodeRowCol(dep);
          newSheetData[rowIndex][colIndex].dependencies.add(`${row}-${col}`);
          // console.log(rowIndex, colIndex);
        });

        // Remove this cell from old dependencies that are no longer used
      } else {
        updatedCell.formula = "";
        updatedCell.value = inputValue;
        // updatedCell.dependencies.clear();

        // Remove this cell from all old dependencies
      }

      if (!updatedCell.refError && updatedCell.dependencies.size > 0) {
        // update dependent cells
        updatedCell.dependencies.forEach((dep) => {
          const [depRow, depCol] = dep.split("-").map(Number);
          // newSheetData[rowIndex][colIndex].dependencies.add(`${row}-${col}`);
          // console.log(rowIndex, colIndex);
          const dependentCell = newSheetData[depRow][depCol];
          const updatedValue = reEvaluateFormula(
            dependentCell,
            row,
            col,
            updatedCell.value,
            newSheetData
          );
          newSheetData[depRow][depCol].value = updatedValue;
        });
      }
      // Only update the specific cell

      newSheetData[row][col] = updatedCell;
      return newSheetData; // Return the new sheetDB
    });
  }, []);

  const updateDependentCells = useCallback((sheetData, changedCellId) => {
    console.log("Updating dependencies for cell:", changedCellId);
    const [row, col] = changedCellId.split("-").map(Number);
    const cell = sheetData[row][col];
    console.log("Changed cell:", cell);

    const updateQueue = Array.from(cell.dependencies);
    console.log("Initial update queue:", updateQueue);
    const updatedCells = new Set();

    while (updateQueue.length > 0) {
      const depCellId = updateQueue.shift();
      console.log("Processing cell:", depCellId);

      if (updatedCells.has(depCellId)) {
        console.log("Cell already updated, skipping");
        continue;
      }

      // Add error checking for depCellId format
      if (!depCellId || !depCellId.includes("-")) {
        // console.error("Invalid cell ID:", depCellId);
        continue;
      }

      const [depRow, depCol] = depCellId.split("-").map(Number);

      // Add additional error checking
      if (isNaN(depRow) || isNaN(depCol)) {
        // console.error("Invalid row or column:", depRow, depCol);
        continue;
      }

      // Check if the cell exists in sheetData
      if (!sheetData[depRow] || !sheetData[depRow][depCol]) {
        // console.error("Cell not found in sheetData:", depRow, depCol);
        continue;
      }

      // const depCell = sheetData[depRow][depCol];
    }

    return updatedCells;
  }, []);

  useEffect(() => {
    // window.addEventListener("keydown", handleGlobalKeyDown);

    let addressBarValue;
    if (selection.x1 !== selection.x2 || selection.y1 !== selection.y2) {
      //
      let col1 = getEncodedCharacter(selection.x1 + 1),
        col2 = getEncodedCharacter(selection.x2 + 1);
      let row1 = selection.y1,
        row2 = selection.y2;
      if (selection.x2 < selection.x1 && selection.y2 < selection.y1) {
        col1 = getEncodedCharacter(selection.x2 + 1);
        col2 = getEncodedCharacter(selection.x1 + 1);
        row1 = selection.y2;
        row2 = selection.y1;
      } else if (selection.x2 < selection.x1) {
        col1 = getEncodedCharacter(selection.x2 + 1);
        col2 = getEncodedCharacter(selection.x1 + 1);
      } else if (selection.y2 < selection.y1) {
        row1 = selection.y2;
        row2 = selection.y1;
      }
      setAddressBar((p) => {
        return {
          ...p,
          value: `${col1}${row1 + 1} : ${col2}${row2 + 1}`,
        };
      });
    } else {
      addressBarValue = getEncodedCharacter(selection.x1 + 1);
      setAddressBar((p) => {
        return {
          ...p,
          value: `${addressBarValue}${selection.y1 + 1}`,
          decoded: `${selection.y1}-${selection.x1}`,
        };
      });
    }
    const width =
      totalColumns.current[selection.x1]?.point2 -
      totalColumns.current[selection.x1]?.point1;
    const height =
      totalRows.current[selection.y1]?.point2 -
      totalRows.current[selection.y1]?.point1;
    setInputCord({
      x: totalColumns.current[selection.x1]?.point1 + 1,
      y: totalRows.current[selection.y1]?.point1 + 1,
      // width: totalColumns.current[select1.x]?.width - 2,
      // height: totalRows.current[select1.y]?.height - 2,
      width,
      height,
    });
    // setSharedValue(sheetStore[selection.y1][selection.x1].value);
    fillCellContentOnSelection(selection.x1, selection.y1);
    activeCellRef.current.edited = false;
    activeCellRef.current.value = "";
    activeCellRef.current.formula = "";
    return () => {
      const value = activeCellRef.current.value;
      const formula = activeCellRef.current.formula;
      const isEdit = activeCellRef.current.edited;
      if (!isEdit) return;
      if (formula) {
        const content = formula.slice(1);
        const result = evaluateFormula(content, [...sheetStore]);
        // updateCellValue(selection.y1, selection.x1, result, formula);
        updateCellValue(selection.y1, selection.x1, formula);
      } else {
        // updateCellValue(selection.y1, selection.x1, value, "");
        updateCellValue(selection.y1, selection.x1, value);
      }
    };
  }, [selection]);

  function evaluateFormula(content, newSheetData) {
    const regex = /[A-Z]+[0-9]+/g;
    const matches = content.match(regex);
    // console.log("matches", matches, selection); //A1+D2+3+5
    if (!matches) {
      const result = evaluate(content);

      return result;
    } else {
      const result = resolveExpression(content, matches, newSheetData);

      return result;
    }
  }

  function decodeRowColumn(matches) {
    const columnNumbers = matches.map((item) => {
      const letters = item.match(/[A-Z]+/)[0]; // Extract column letters
      return getColumnNumber(letters); // Convert letters to column number
    });
    const rowNumbers = matches.map((item) => Number(item.match(/\d+/)[0]) - 1);
    return [rowNumbers, columnNumbers];
  }

  const getColumnNumber = (letters) => {
    let columnNumber = 0;
    for (let i = 0; i < letters.length; i++) {
      columnNumber = columnNumber * 26 + (letters.charCodeAt(i) - 65 + 1);
    }
    return columnNumber - 1; // Convert from 1-based to 0-based index
  };

  function resolveExpression(
    expr,
    matches,
    newSheetData,
    depRow = -1,
    depCol = -1,
    value = ""
  ) {
    // Replace the variable names with their corresponding values
    const [rowNumbers, columnNumbers] = decodeRowColumn(matches);
    const exprVariables = {};
    let i = 0;
    matches.forEach((item) => {
      if (depRow === rowNumbers[i] && depCol === columnNumbers[i]) {
        exprVariables[item] = value;
      } else {
        exprVariables[item] =
          newSheetData[rowNumbers[i]][columnNumbers[i]].value;
      }
      i += 1;
    });
    for (let variable in exprVariables) {
      expr = expr.replace(new RegExp(variable, "g"), exprVariables[variable]);
    }
    return evaluate(expr); //
  }

  const handleGlobalKeyDown = (e) => {
    if (e.key === "Enter") {
      // if (!isEditable) setIsEditable(true);
      // else setIsEditable(false);
      // if (!isEditable) {
      //   setSelection((prev) => {
      //     console.log(prev);
      //     return { ...prev, y1: prev.y1 + 1, y2: prev.y2 + 1 };
      //   });
      //   drawCanvas();
      // }

      setIsEditable((v) => !v);
      return;
    }
    // if (e.key === "Enter" && isEditable) {
    //   setIsEditable(false);
    //   // setSelection((prev) => {
    //   //   console.log(prev);
    //   //   return { ...prev, y1: prev.y1 + 1, y2: prev.y2 + 1 };
    //   // });
    //   // drawCanvas();
    // }
    if (selection.x1 !== -1 && !isEditable) {
      const id = `${selection.y1}-${selection.x1}`;
      const cell = sheetStore[selection.y1][selection.x1];

      // inputCordRef.current = {
      //   x: totalColumns.current[editCell.x]?.point1 + 1,
      //   y: totalRows.current[editCell.y]?.point1 + 1,
      //   width: totalColumns.current[editCell.x]?.width - 2,
      //   height: totalRows.current[editCell.y]?.height - 2,
      // };
      setIsEditable(true);
    }
  };

  function handleInputKeyDown(e) {
    if (e.key === "Enter" && isEditable) {
      e.preventDefault();
      console.log(isEditable, sharedValue, content);
      setSelection((prev) => {
        return { ...prev, y1: prev.y1 + 1, y2: prev.y2 + 1 };
      });
      // drawCanvas();
    }
  }

  const handleBlur = () => {
    setIsEditable(false);
  };

  function evaluateContent(content) {
    // const isExpression = content[0] === "=";
    const regex = /[A-Z]+[0-9]+/g;
    const matches = content.match(regex);
    // sheetStore[selection.y1][selection.x1].formula = content;
    // console.log(matches);
  }

  useEffect(() => {
    if (isEditable && contentEditableRef.current) {
      contentEditableRef.current.focus();
    }
    if (isEditable) console.log(sharedValue);
  }, [isEditable]);

  const moveCursorToEnd = () => {
    const element = contentEditableRef.current;
    if (element) {
      element.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(element);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    }
  };

  function handleInput(e) {
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }
    const newContent = e.target.innerText;
    debounceTimeout.current = setTimeout(() => {
      //moveCursorToEnd();
    }, 300);

    // handleInputChange(e);
    const isExpression = newContent[0] === "=";
    if (isExpression) {
      activeCellRef.current.formula = newContent;
      activeCellRef.current.edited = true;
      // evaluateContent(newContent);
    } else {
      activeCellRef.current.value = newContent;
      activeCellRef.current.edited = true;
    }
  }

  function getCellData() {
    const formula = sheetStore[selection.y1][selection.x1].formula;
    const value = sheetStore[selection.y1][selection.x1].value;
    if (formula) {
      return formula;
    }
    return value;
  }

  const drawCanvas = useCallback(() => {
    canvasRef.current.height = canvasHeight;
    canvasRef.current.width = canvasWidth;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");
    context.clearRect(0, 0, canvasWidth, canvasHeight);
    resizeCanvas(canvas);

    context.fillStyle = "white";
    context.fillRect(0, 0, context.canvas.width, context.canvas.height);
    context.fillStyle = HEADER_COLOR;
    context.fillRect(0, 0, rowHeaderWidth, context.canvas.height);
    context.fillStyle = HEADER_COLOR;
    context.fillRect(0, 0, colHeaderHeight, context.canvas.width);
    const { minX, minY, maxX, maxY, singleCellSelectX, singleCellSelectY } =
      getOverlayDimensions();
    if (selection.x1 !== selection.x2 || selection.y1 !== selection.y2) {
      const width = maxX - minX;
      const height = maxY - minY;
      context.fillStyle = SELECTION_COLOR;
      context.fillRect(minX, minY, width, height);
    }

    //rows
    context.strokeStyle = GRID_LINE_COLOR;
    context.fillStyle = HEADER_COLOR;
    // context.fillRect(0, colHeaderHeight, rowHeaderWidth, canvasHeight);

    // const rows = sheet.rowCells;
    const rows = [...totalRows.current];
    const [rowStart, rowEnd] = computeStartEndPos(
      // totalCols
      totalRows.current,
      colHeaderHeight,
      canvasHeight
    );
    rowStartRef.current = rowStart.id;
    for (let i = rowStart.id; i < rows.length; i++) {
      const row = rows[i];
      if (row.point1 > canvasHeight) break;
      context.beginPath();
      context.moveTo(rowHeaderWidth, row.point1); // x, y
      context.lineTo(context.canvas.width, row.point1); // x, y
      context.stroke();
    }
    //columns
    context.beginPath();
    context.moveTo(rowHeaderWidth, 0); // x, y
    context.lineTo(rowHeaderWidth, context.canvas.height); // x, y
    context.stroke();
    const [columnStart, columnEnd] = computeStartEndPos(
      // totalCols
      totalColumns.current,
      rowHeaderWidth,
      canvasWidth
    );
    columnStartRef.current = columnStart.id;

    for (let i = columnStart.id; i < totalColumns.current.length; i++) {
      const col = totalColumns.current[i];
      if (col.point1 > canvasWidth) break;
      if (col.point2 >= rowHeaderWidth) {
        context.beginPath();
        // context.strokeStyle = "black";
        context.moveTo(col.point2, colHeaderHeight); // x, y
        context.lineTo(col.point2, context.canvas.height); // x, y
        context.stroke();
      }
    }

    //Selecting cells

    if (singleCellSelectX && singleCellSelectY) {
      // const width = singleCellSelectX.width;
      // const height = singleCellSelectY.height;
      const width =
        totalColumns.current[selection.x1]?.point2 -
        totalColumns.current[selection.x1]?.point1;

      const height =
        totalRows.current[selection.y1]?.point2 -
        totalRows.current[selection.y1]?.point1;

      context.clearRect(
        singleCellSelectX.point1,
        singleCellSelectY.point1,
        width,
        height
      );
      context.lineWidth = 1.1;
      context.strokeStyle = SELECTION_BORDER_COLOR;
      context.strokeRect(
        singleCellSelectX.point1,
        singleCellSelectY.point1,
        width,
        height
      );
    }

    if (minX !== -1 && minY !== -1 && maxX !== -1 && maxY !== -1) {
      const width = maxX - minX;
      const height = maxY - minY;

      // context.fillStyle = SELECTION_COLOR;
      // context.fillRect(minX, minY, width, height);
      context.lineWidth = 1.3;
      context.strokeStyle = SELECTION_BORDER_COLOR;
      context.strokeRect(minX, minY, width, height);
    }

    fillCellsValue(context);

    context.fillStyle = SELECTION_BORDER_COLOR; //Start path
    context.beginPath(); //Start path
    context.arc(maxX, maxY, 3, 0, Math.PI * 2, false); // Draw a point using the arc function of the canvas with a point structure.
    context.fill();
    context.stroke();

    // Fill column header
    context.fillStyle = HEADER_COLOR;
    context.fillRect(0, 0, context.canvas.width, colHeaderHeight);

    context.strokeStyle = GRID_LINE_COLOR;
    context.fillRect(0, colHeaderHeight, rowHeaderWidth, canvasHeight);

    context.textBaseline = "middle";
    context.textAlign = "center";
    context.font = "12px sans-serif";
    context.fillStyle = HEADER_TEXT_COLOR;

    for (let i = columnStart.id; i < totalColumns.current.length; i++) {
      const col = totalColumns.current[i];
      if (col.point1 > canvasWidth) break;
      const centerX =
        totalColumns.current[i].point1 +
        Math.abs(
          totalColumns.current[i].point1 - totalColumns.current[i].point2
        ) *
          0.5;
      const centerY = colHeaderHeight * 0.5;

      const content = col.content;
      context.fillText(content, centerX, centerY);
    }

    // Fill row header
    // context.strokeStyle = GRID_LINE_COLOR;
    // context.fillStyle = HEADER_COLOR;
    // context.fillRect(0, colHeaderHeight, rowHeaderWidth, canvasHeight);

    for (let i = rowStart.id; i < rows.length; i++) {
      if (rows[i].point2 > canvasHeight) break;

      const centerY =
        rows[i].point1 + Math.abs(rows[i].point1 - rows[i].point2) * 0.5;
      const centerX = rowHeaderWidth * 0.5;

      const row = rows[i].id;
      const content = row + 1;
      context.fillText(content, centerX, centerY);
    }

    //draw row header
    for (let i = rowStart.id; i < rows.length; i++) {
      const row = rows[i];
      if (row.point1 > canvasHeight) break;
      context.beginPath();
      context.moveTo(0, row.point1); // x, y
      context.lineTo(rowHeaderWidth, row.point1); // x, y
      context.stroke();
    }

    // draw column header
    for (let i = columnStart.id; i < totalColumns.current.length; i++) {
      const col = totalColumns.current[i];
      if (col.point1 > canvasWidth) break;
      if (col.point2 >= rowHeaderWidth) {
        context.beginPath();
        context.moveTo(col.point2, 0); // x, y
        context.lineTo(col.point2, colHeaderHeight); // x, y
        context.stroke();
      }
    }

    // totalColumns.current = [...totalCols];
    if (columnResizeState) {
      const threshold = 5;
      const col = totalColumns.current[columnResizeCord.id];
      let offset = columnResizeCord.x;
      if (offset <= col.point1 + threshold) {
        offset = col.point1 + threshold;
      }
      context.beginPath();
      context.strokeStyle = "#1a9b2b";
      context.lineWidth = 3;
      context.moveTo(offset, 0);
      context.lineTo(offset, canvasHeight);
      context.stroke();
    }

    if (rowResizeState) {
      const threshold = 5;
      const row = totalRows.current[rowResizeCord.id];
      let offset = rowResizeCord.y;
      if (offset <= row.point1 + threshold) {
        offset = row.point1 + threshold;
      }
      context.strokeStyle = "#1a9b2b";
      context.lineWidth = 3;
      context.beginPath();
      context.moveTo(0, offset);
      context.lineTo(canvasWidth, offset);
      context.stroke();
    }
    context.beginPath();
    context.fillStyle = HEADER_COLOR;
    context.strokeStyle = "#c2c2c2";

    context.lineWidth = 3;
    context.moveTo(rowHeaderWidth - 1, 0);
    context.lineTo(rowHeaderWidth - 1, colHeaderHeight);
    context.moveTo(0, colHeaderHeight - 1);
    context.lineTo(rowHeaderWidth, colHeaderHeight - 1);
    context.fillRect(0, 0, rowHeaderWidth, colHeaderHeight);
    // context.strokeRect(0, 0, rowHeaderWidth, colHeaderHeight);
    context.stroke();
  });

  function fillCellsValue(context) {
    context.textBaseline = "middle";
    context.textAlign = "left";
    context.fillStyle = "black";
    context.font = "12px sans-serif";
    for (let i = rowStartRef.current; i < totalRows.current.length; i++) {
      const row = totalRows.current[i];
      if (row.point2 > canvasHeight) break;
      for (
        let j = columnStartRef.current;
        j < totalColumns.current.length;
        j++
      ) {
        const col = totalColumns.current[j];
        if (col.point1 > canvasWidth) break;
        const x = col.point1 + 5;
        const y = row.point1 + row.height * 0.5 + 1;
        let content = "";
        if (sheetStore[i][j].refError) {
          content = "REF!!";
        } else {
          content = sheetStore[i][j].value;
        }
        context.fillText(content, x, y);
      }
    }
    console.log(rowStartRef.current, columnStartRef.current);
  }

  function getOverlayDimensions() {
    const x1 = Math.min(selection.x1, selection.x2);
    const y1 = Math.min(selection.y1, selection.y2);
    const x2 = Math.max(selection.x1, selection.x2);
    const y2 = Math.max(selection.y1, selection.y2);

    // const minX = colStartPos[x1];
    // const minY = rowStartPos[y1];
    // const maxX = colEndPos[x2];
    // const maxY = rowEndPos[y2];

    const minX = totalColumns.current[x1]?.point1;
    const minY = totalRows.current[y1]?.point1;
    const maxX = totalColumns.current[x2]?.point2;
    const maxY = totalRows.current[y2]?.point2;

    const singleCellSelectX = totalColumns.current[selection.x1];
    const singleCellSelectY = totalRows.current[selection.y1];
    let width = 0;
    let height = 0;
    if (minX !== -1 && minY !== -1 && maxX !== -1 && maxY !== -1) {
      width = maxX - minX;
      height = maxY - minY;
    }
    return {
      minX,
      minY,
      maxX,
      maxY,
      singleCellSelectX,
      singleCellSelectY,
      width,
      height,
    };
  }
  return (
    <div
      style={{
        height: `calc(100vh - ${excludeHeight}px)`,
        width: "100vw",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <canvas ref={canvasRef} style={{ height: "100%", width: "100%" }} />
      <div
        onScroll={onScroll}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onDoubleClick={handleDoubleClick}
        // onKeyDown={handleGlobalKeyDown}
        style={{
          position: "absolute",
          width: "100%",
          height: "100%",
          top: 0,
          left: 0,
          overflow: "scroll",
        }}
        tabIndex={0}
      >
        {/* <div
          style={{
            position: "sticky",
            top: 0,
            left: rowHeaderWidth,
            zIndex: 4,
            width: canvasWidth - rowHeaderWidth,
            height: colHeaderHeight,
            backgroundColor: "#e6e6e6",
          }}
        ></div> */}
        <div
          style={{
            position: "absolute",
            width: totalColumns.current[totalColumns.current.length - 1].point2,
            height: "1px",
          }}
        ></div>
        <div
          style={{
            position: "absolute",
            width: "1px",
            height: totalRows.current[totalRows.current.length - 1].point2,
          }}
        ></div>
        {/* {(selection.x1 !== selection.x2 || selection.y1 !== selection.y2) && (
          <div
            id="overlay"
            style={{
              position: "absolute",
              backgroundColor: "rgb(14, 101, 235)",
              opacity: "0.1",
              left: getOverlayDimensions().minX,
              top: getOverlayDimensions().minY,
              width: getOverlayDimensions().width,
              height: getOverlayDimensions().height,
            }}
          ></div>
        )} */}
      </div>
      {(isEditable || formulaEditState) && (
        <div
          style={{
            position: "absolute",
            top: inputCord.y,
            left: inputCord.x,
            minWidth: inputCord.width,
            minHeight: inputCord.height,
            fontSize: "13px",
            backgroundColor: "white",
            border: "2px solid #0b57d0",
            outline: "2px solid #a8c7fa",
            paddingLeft: "2px",
            paddingTop: "2px",
          }}
          ref={contentEditableRef} // Attach the ref to the contentEditable div
          onInput={handleInput}
          onFocus={moveCursorToEnd}
          // onKeyUp={handleInputKeyDown}
          onBlur={handleBlur}
          id="editable"
          contentEditable={true}
          spellCheck="false"
          suppressContentEditableWarning={true}
        >
          {getCellData()}
        </div>
        // <textarea
        //   id=""
        //   value={content}
        //   style={{
        //     position: "absolute",
        //     top: inputCord.y,
        //     left: inputCord.x,
        //     width: inputCord.width,
        //     height: inputCord.height,
        //     fontSize: "12px",
        //     backgroundColor: "white",
        //     border: "2px solid #0b57d0",
        //     outline: "2px solid #a8c7fa",
        //     paddingLeft: "2px",
        //   }}
        //   onChange={handleInput}
        //   ref={contentEditableRef}
        // ></textarea>
      )}
    </div>
  );
}
