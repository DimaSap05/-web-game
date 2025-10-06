import {
  PLAYFIELD_COLUMNS,
  PLAYFIELD_ROWS,
  linerMatrix,
  obstaclesMatrix,
  levelName,
} from "./utilities.js";

export class Liner {
  constructor() {
    this.playfield;
    this.plane;
    this.obstacle;
    this.init();
  }

  init() {
    this.generatePlayfield();
    this.generatePlane();
    this.Shot();
    this.generateObstacles(0);

  }
  generatePlayfield() {
    this.playfield = new Array(PLAYFIELD_ROWS)
      .fill()
      .map(() => new Array(PLAYFIELD_COLUMNS).fill(0));
  }

  bottomMostOccupiedRow(matrix) {
    let bottom = -1;
    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) bottom = Math.max(bottom, r);
      }
    }
    return bottom;
  }

  generatePlane() {
    const name = "T";
    const matrix = linerMatrix[name];

    const column = Math.floor((PLAYFIELD_COLUMNS - matrix[0].length) / 2);

    const bottomIndex = this.bottomMostOccupiedRow(matrix);
    const topRow = PLAYFIELD_ROWS - 1 - bottomIndex;

    this.plane = {
      name,
      matrix,
      row: topRow,
      column,
    };
  }

  generateObstacles(levelIndex) {
    let name = Array.isArray(levelName) && levelName[levelIndex] !== undefined
    ? levelName[levelIndex]
    : Object.keys(obstaclesMatrix)[0];

  const matrix = obstaclesMatrix[name];
  if (!matrix) {
    this.obstacle = null;
    return false;
  }
    for (let r = 0; r < PLAYFIELD_ROWS; r++) {
    for (let c = 0; c < PLAYFIELD_COLUMNS; c++) {
      this.playfield[r][c] = 0;
    }
  }
    const column = 0;
    const row = 0;

    for (let r = 0; r < matrix.length; r++) {
      for (let c = 0; c < matrix[r].length; c++) {
        if (matrix[r][c]) {
          const absR = row + r;
          const absC = column + c;
          if (absR >= 0 && absR < PLAYFIELD_ROWS && absC >= 0 && absC < PLAYFIELD_COLUMNS) {
            this.playfield[absR][absC] = 1;
          }
        }
      }
    }
  }

  canPlaceAt(testRow, testCol) {
    const m = this.plane.matrix;
    for (let r = 0; r < m.length; r++) {
      for (let c = 0; c < m[r].length; c++) {
        if (!m[r][c]) continue;
        const absR = testRow + r;
        const absC = testCol + c;
        if (
          absC < 0 ||
          absC >= PLAYFIELD_COLUMNS ||
          absR < 0 ||
          absR >= PLAYFIELD_ROWS
        )
          return false;

        if (this.playfield[absR][absC] !== 0) return false;
      }
    }
    return true;
  }

  moveX(dx) {
    const newCol = this.plane.column + dx;
    if (this.canPlaceAt(this.plane.row, newCol)) {
      this.plane.column = newCol;
      return true;
    }
    return false;
  }

  Shot(){
    const damage = 1;

    const col = this.plane.column;

    if (col < 0 || col >= PLAYFIELD_COLUMNS) return false;
    for (let r = PLAYFIELD_ROWS - 1; r >= 0; r--) {
    if (this.playfield[r][col+1] && this.playfield[r][col+1] > 0) {
      this.playfield[r][col+1] = Math.max(0, this.playfield[r][col+1] - damage);
      return true;
    }
  }
  return false;
  }
}