import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { handleAnswer, handleVSCodeOpen, handleInteliJOpen, handleNotepadOpen, handleCustomEditorOpen } from './utils.js';
import { DIR_SYMBOL, FILE_SYMBOL, STAY_MESSAGE, GO_BACK_MESSAGE, OPEN_MESSAGE } from './constants.js';

const LEFT = '@@LEFT';
const VSCODE_OPEN = '@@VSCODE';

const renderTUI = (dirPath, items, tui) => {
  const allItems = [STAY_MESSAGE, GO_BACK_MESSAGE, OPEN_MESSAGE, ...items];
  let selectedIdx = 0;

  const getFiltered = () => {
    if (!tui.filterText) return allItems;
    return items.filter(item => item.toLowerCase().includes(tui.filterText.toLowerCase()));
  };

  const redraw = () => {
    const filtered = getFiltered();
    if (filtered.length > 0 && selectedIdx >= filtered.length) {
      selectedIdx = filtered.length - 1;
    }
    tui.clearScreen();
    tui.renderHeader(dirPath);
    tui.renderList(filtered, selectedIdx);
    tui.renderFilterInput(tui.filterText);
  };

  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.removeAllListeners('keypress');

    const cleanup = () => {
      process.stdin.removeListener('keypress', onKey);
      process.stdout.removeListener('resize', onResize);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
    };

    const onResize = () => {
      tui.rows = process.stdout.rows || 24;
      tui.cols = process.stdout.columns || 80;
      redraw();
    };

    process.stdout.on('resize', onResize);

    const onKey = (str, key) => {
      if (!key) return;

      if ((key.ctrl && key.name === 'c') || key.name === 'escape') {
        cleanup();
        tui.exit();
        process.exit(0);
      }

      if (key.name === 'left') {
        cleanup();
        resolve(LEFT);
        return;
      }

      if (key.ctrl && key.name === 'o') {
        cleanup();
        resolve(VSCODE_OPEN);
        return;
      }

      const filtered = getFiltered();

      if (key.name === 'up') {
        selectedIdx = Math.max(0, selectedIdx - 1);
        redraw();
        return;
      }

      if (key.name === 'down') {
        selectedIdx = Math.min(filtered.length - 1, selectedIdx + 1);
        redraw();
        return;
      }

      if (key.name === 'return') {
        if (filtered.length > 0) {
          cleanup();
          resolve(filtered[selectedIdx]);
        }
        return;
      }

      if (key.name === 'backspace' || key.name === 'delete') {
        tui.filterText = tui.filterText.slice(0, -1);
        selectedIdx = 0;
        tui.scrollOffset = 0;
        redraw();
        return;
      }

      if (str && str.length === 1 && !key.ctrl && !key.meta) {
        tui.filterText += str;
        selectedIdx = 0;
        tui.scrollOffset = 0;
        redraw();
        return;
      }
    };

    process.stdin.on('keypress', onKey);
    redraw();
  });
};

const renderListPrompt = (message, choices, tui) => {
  let selectedIdx = 0;

  const redraw = () => {
    tui.clearScreen();
    tui.renderHeader(message);
    tui.renderList(choices, selectedIdx);
  };

  return new Promise((resolve) => {
    readline.emitKeypressEvents(process.stdin);
    if (process.stdin.isTTY) process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.removeAllListeners('keypress');

    const cleanup = () => {
      process.stdin.removeListener('keypress', onKey);
      process.stdout.removeListener('resize', onResize);
      if (process.stdin.isTTY) process.stdin.setRawMode(false);
    };

    const onResize = () => {
      tui.rows = process.stdout.rows || 24;
      tui.cols = process.stdout.columns || 80;
      redraw();
    };

    process.stdout.on('resize', onResize);

    const onKey = (str, key) => {
      if (!key) return;

      if (key.ctrl && key.name === 'c') {
        cleanup();
        tui.exit();
        process.exit(0);
      }

      if (key.name === 'escape') {
        cleanup();
        resolve(null);
        return;
      }

      if (key.name === 'up') {
        selectedIdx = Math.max(0, selectedIdx - 1);
        redraw();
        return;
      }

      if (key.name === 'down') {
        selectedIdx = Math.min(choices.length - 1, selectedIdx + 1);
        redraw();
        return;
      }

      if (key.name === 'return') {
        cleanup();
        resolve(choices[selectedIdx]);
        return;
      }
    };

    process.stdin.on('keypress', onKey);
    redraw();
  });
};

export const nav = async (dir, tui) => {
  tui.scrollOffset = 0;
  tui.filterText = '';

  const items = await fs.readdir(dir, { withFileTypes: true });
  const newItems = items
    .filter(i => !i.name.startsWith('.'))
    .map(i => (i.isDirectory() ? `${DIR_SYMBOL} ${i.name}` : `${FILE_SYMBOL} ${i.name}`))
    .sort(a => (a.startsWith(DIR_SYMBOL) ? -1 : 1));

  const selected = await renderTUI(dir, newItems, tui);

  if (selected === LEFT) {
    return nav(path.dirname(dir), tui);
  }

  if (selected === VSCODE_OPEN) {
    handleVSCodeOpen(dir);
    return nav(dir, tui);
  }

  await handleAnswer({ navTo: selected }, dir, tui);
};

export const selectEditor = async (isFile, filePath, tui) => {
  const navEditor = process.env.NAV_EDITOR;
  if (navEditor) {
    handleCustomEditorOpen(filePath, navEditor);
    return;
  }

  const VS_CODE_ANSWER = '🆚 VS Code';
  const INTELI_J_ANSWER = '☕ InteliJ';
  const NOTEPAD_ANSWER = '🗒️ Notepad';

  const choices = [VS_CODE_ANSWER, INTELI_J_ANSWER];
  if (isFile) {
    choices.push(NOTEPAD_ANSWER);
  }

  const answer = await renderListPrompt('Select your editor:', choices, tui);
  if (!answer) return;

  if (answer === VS_CODE_ANSWER) {
    handleVSCodeOpen(filePath);
  } else if (answer === INTELI_J_ANSWER) {
    handleInteliJOpen(filePath);
  } else if (answer === NOTEPAD_ANSWER) {
    handleNotepadOpen(filePath);
  }
};
