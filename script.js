import { Liner } from "./liner.js";
import {
  PLAYFIELD_COLUMNS,
  PLAYFIELD_ROWS,
  convertPositionToIndex,
  levelName,
  levelDurations,
  defaultLevelMs,
} from "./utilities.js";

let countLevel = 0;
const gridEl = document.querySelector(".grid");

function createCells() {
  const existing = gridEl.querySelectorAll(".cell");
  const total = PLAYFIELD_COLUMNS * PLAYFIELD_ROWS;
  if (existing.length === total) return;
  gridEl.innerHTML = "";
  for (let i = 0; i < total; i++) {
    const d = document.createElement("div");
    d.classList.add("cell");
    gridEl.appendChild(d);
  }
}
createCells();
const cells = Array.from(document.querySelectorAll(".grid > .cell"));

const liner = new Liner();

let startBtn = document.getElementById("start-btn");

let countdownEl = document.getElementById("countdown");
if (!countdownEl) {
  countdownEl = document.createElement("div");
  countdownEl.id = "countdown";
  countdownEl.innerHTML = '<span class="time">00:00</span>';
  gridEl.parentNode.insertBefore(countdownEl, gridEl);
  countdownEl.style.display = "none";
}
const countdownTimeEl = countdownEl.querySelector(".time");

let cdRaf = null;
let cdEndTs = null;
let cdRemaining = 0;
let cdRunning = false;

function formatCountdown(ms) {
  const msNonNeg = Math.max(0, Math.floor(ms));
  const centis = Math.floor(msNonNeg / 10) % 100;
  const seconds = Math.floor(msNonNeg / 1000);
  const ss = String(seconds).padStart(2, "0");
  const cc = String(centis).padStart(2, "0");
  return `${ss}:${cc}`;
}

function updateCountdownUI(ms) {
  countdownTimeEl.textContent = formatCountdown(ms);
}

function cdTick() {
  const now = performance.now();
  const msLeft = Math.max(0, cdEndTs - now);
  updateCountdownUI(msLeft);
  if (msLeft <= 0) {
    cdRunning = false;
    if (cdRaf) {
      cancelAnimationFrame(cdRaf);
      cdRaf = null;
    }
    onCountdownFinished();
    return;
  }
  cdRaf = requestAnimationFrame(cdTick);
}

function startCountdownForLevel(levelIndex) {
  const key =
    Array.isArray(levelName) && levelName[levelIndex] !== undefined
      ? levelName[levelIndex]
      : undefined;
  const duration =
    key && levelDurations[key] ? levelDurations[key] : defaultLevelMs;

  cdEndTs = performance.now() + duration;
  cdRunning = true;
  countdownEl.style.display = "";
  if (cdRaf) cancelAnimationFrame(cdRaf);
  cdRaf = requestAnimationFrame(cdTick);
}

function onCountdownFinished() {
  setTimeout(() => {
    nextLevel();
  }, 50);
}

function renderPlayfield() {
  for (const cell of cells) cell.className = "cell";

  for (let r = 0; r < PLAYFIELD_ROWS; r++) {
    for (let c = 0; c < PLAYFIELD_COLUMNS; c++) {
      if (liner.playfield[r][c] === 1) {
        const idx = convertPositionToIndex(r, c);
        cells[idx].classList.add("cell--obs");
      }
    }
  }
  const m = liner.plane.matrix;
  for (let r = 0; r < m.length; r++) {
    for (let c = 0; c < m[r].length; c++) {
      if (!m[r][c]) continue;
      const absR = liner.plane.row + r;
      const absC = liner.plane.column + c;
      if (
        absR < 0 ||
        absR >= PLAYFIELD_ROWS ||
        absC < 0 ||
        absC >= PLAYFIELD_COLUMNS
      )
        continue;
      const idx = convertPositionToIndex(absR, absC);
      cells[idx].classList.add(`cell--${liner.plane.name}`);
    }
  }
}

renderPlayfield();

function applyAndRenderLevel(index) {
  liner.generateObstacles(index);
  renderPlayfield();
  startCountdownForLevel(index);
}

let gameStarted = false;
let controlsEnabled = false;

function startGame() {
  if (gameStarted) return;
  gameStarted = true;
  controlsEnabled = true;

  applyAndRenderLevel(countLevel);

  if (startBtn) {
    startBtn.remove();
  }
}
if (startBtn) startBtn.addEventListener("click", startGame);

function nextLevel() {
  const maxLevels =
    Array.isArray(levelName) && levelName.length ? levelName.length : 0;
  if (maxLevels > 0) countLevel = (countLevel + 1) % maxLevels;
  else countLevel++;

  let col = liner.plane.column;
  if (
    liner.playfield[0][col + 1] == 0 &&
    liner.playfield[0][col] == 0 &&
    liner.playfield[0][col + 2] == 0
  ) {
    applyAndRenderLevel(countLevel);
  } else {
    controlsEnabled = false;
    return;
  }
}

window.addEventListener("keydown", (e) => {
  if (!controlsEnabled) {
    return;
  }
  if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
    e.preventDefault();
    liner.moveX(-1);
    renderPlayfield();
  } else if (e.key === "ArrowRight" || e.key === "d" || e.key === "D") {
    e.preventDefault();
    liner.moveX(+1);
    renderPlayfield();
  } else if (e.key === "ArrowUp" || e.key === "w" || e.key === "W") {
    e.preventDefault();
    if (typeof liner.Shot === "function") liner.Shot();
    renderPlayfield();
  }
});

window.addEventListener("mousedown", (e) => {
  if (!controlsEnabled) return;
  if (e.button === 0) {
    e.preventDefault();
    if (typeof liner.Shot === "function") liner.Shot();
    renderPlayfield();
  }
});
