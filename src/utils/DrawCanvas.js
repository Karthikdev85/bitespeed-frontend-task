// export function drawCanvas(drawProperties) {
//   const {
//     context,
//     totalRows,
//     totalColumns,
//     rowHeaderWidth,
//     colHeaderHeight,
//     canvasWidth,
//     canvasHeight,
//     HEADER_COLOR,
//     HEADER_TEXT_COLOR,
//     GRID_LINE_COLOR,
//     scrollX,
//     scrollY,
//   } = drawProperties;
//   //rows
//   //  let y = colHeaderHeight;
//   context.strokeStyle = GRID_LINE_COLOR;
//   // for (const row of visibleRows) {
//   //   context.beginPath();
//   //   context.moveTo(rowHeaderWidth, row.point1); // x, y
//   //   context.lineTo(context.canvas.width, row.point1); // x, y
//   //   context.stroke();

//   //   //draw row header
//   //   context.beginPath();
//   //   context.moveTo(0, row.point1); // x, y
//   //   context.lineTo(rowHeaderWidth, row.point1); // x, y
//   //   context.stroke();

//   //   y += CELL_HEIGHT;
//   // }

//   // const rows = sheet.rowCells;
//   const rows = [...totalRows];
//   for (let i = 0; i < rows.length; i++) {
//     const row = rows[i];
//     if (row.point2 > canvasHeight) break;
//     context.beginPath();
//     context.moveTo(rowHeaderWidth, row.point1); // x, y
//     context.lineTo(context.canvas.width, row.point1); // x, y
//     context.stroke();

//     //draw row header
//     context.beginPath();
//     context.moveTo(0, row.point1); // x, y
//     context.lineTo(rowHeaderWidth, row.point1); // x, y
//     context.stroke();

//     //  y += CELL_HEIGHT;
//   }
//   //columns
//   //  let x = rowHeaderWidth;
//   context.fillStyle = HEADER_COLOR;
//   context.fillRect(0, 0, context.canvas.width, colHeaderHeight);
//   //
//   context.beginPath();
//   context.moveTo(rowHeaderWidth, 0); // x, y
//   context.lineTo(rowHeaderWidth, context.canvas.height); // x, y
//   context.stroke();
//   //
//   // const updatedCols = updateColumnsCord([...sheet.colCells]);
//   // console.log(visibleCols);
//   // for (const col of visibleCols) {
//   //   if (col.point2 >= rowHeaderWidth) {
//   //     context.beginPath();
//   //     context.moveTo(col.point2, colHeaderHeight); // x, y
//   //     context.lineTo(col.point2, context.canvas.height); // x, y
//   //     context.stroke();
//   //     // draw column header
//   //     context.beginPath();
//   //     context.moveTo(col.point2, 0); // x, y
//   //     context.lineTo(col.point2, colHeaderHeight); // x, y
//   //     context.stroke();
//   //   }
//   //   x += CELL_WIDTH;
//   // }
//   // const totalCols = [...updateColumnsCord([...sheet.colCells])];
//   const totalCols = updateColumnsCord([...totalColumns], scrollX);
//   const [startPos, endPos] = computeColumnStartPos(
//     totalCols,
//     rowHeaderWidth,
//     canvasWidth
//   );
//   //  let startPos = visibleCols[0].id;
//   //  let endPos = visibleCols[visibleCols.length - 1].id;
//   // console.log("sheetcol", totalColumns, startPos, endPos);
//   for (let i = startPos.id; i < totalCols.length; i++) {
//     const col = totalCols[i];
//     if (col.point1 > canvasWidth) break;
//     if (col.point2 >= rowHeaderWidth) {
//       context.beginPath();
//       context.moveTo(col.point2, colHeaderHeight); // x, y
//       context.lineTo(col.point2, context.canvas.height); // x, y
//       context.stroke();

//       // draw column header
//       context.beginPath();
//       context.moveTo(col.point2, 0); // x, y
//       context.lineTo(col.point2, colHeaderHeight); // x, y
//       context.stroke();
//     }

//     //  x += CELL_WIDTH;
//   }

//   // Fill column header
//   //  x = rowHeaderWidth;
//   context.textBaseline = "middle";
//   context.textAlign = "center";
//   context.font = "12px sans-serif";
//   context.fillStyle = HEADER_TEXT_COLOR;
//   // for (let i = 0; i < visibleCols.length; i++) {
//   //   const centerX = x + Math.abs(colEndPos[i] - colStartPos[i]) * 0.5;
//   //   const centerY = colHeaderHeight * 0.5;
//   //   const col = visibleCols[i].id;
//   //   const content = getEncodedCharacter(col + 1);
//   //   context.fillText(content, centerX, centerY);
//   //   x += CELL_WIDTH;
//   // }

//   for (let i = startPos.id; i < totalCols.length; i++) {
//     const col = totalCols[i];
//     if (col.point1 > canvasWidth) break;
//     // if (totalCols[i].point2 > canvasWidth) break;
//     // const centerX =
//     //   x + Math.abs(totalCols[i].point1 - totalCols[i].point2) * 0.5;
//     const centerX =
//       totalCols[i].point1 +
//       Math.abs(totalCols[i].point1 - totalCols[i].point2) * 0.5;
//     const centerY = colHeaderHeight * 0.5;

//     // const col = totalCols[i].id;
//     const content = col.content;
//     context.fillText(content, centerX, centerY);
//     //  x += CELL_WIDTH;
//   }

//   // Fill row header
//   //  y = colHeaderHeight;

//   // for (let i = 0; i < visibleRows.length; i++) {
//   //   const centerY = y + CELL_HEIGHT * 0.5;
//   //   const centerX = rowHeaderWidth * 0.5;
//   //   // const centerX = visibleRows[i].width * 0.5;
//   //   const row = visibleRows[i].id;
//   //   const content = row + 1;
//   //   context.fillText(content, centerX, centerY);
//   //   y += CELL_HEIGHT;
//   // }

//   for (let i = 0; i < rows.length; i++) {
//     if (rows[i].point2 > canvasHeight) break;

//     const centerY =
//       rows[i].point1 + Math.abs(rows[i].point1 - rows[i].point2) * 0.5;
//     const centerX = rowHeaderWidth * 0.5;
//     // const centerX = visibleRows[i].width * 0.5;

//     const row = rows[i].id;
//     const content = row + 1;
//     context.fillText(content, centerX, centerY);
//     //  y += CELL_HEIGHT;
//   }

//   context.fillStyle = HEADER_COLOR;
//   context.fillRect(0, 0, rowHeaderWidth, colHeaderHeight);
//   context.strokeRect(0, 0, rowHeaderWidth, colHeaderHeight);
// }

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

export function updateColumnsCord(totalCols, scrollX) {
  const updatedCols = totalCols.map((col) => ({
    ...col,
    point1: col.point1 - scrollX.current,
    point2: col.point2 - scrollX.current,
  }));
  return updatedCols;
}
