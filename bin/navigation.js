import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import { copyCurrentDirectory, handleInteliJOpen, handleNotepadOpen, handleVSCodeOpen } from './utils.js';
import { DIRECTORY_PREFIX } from './constants.js';

const ACTION_GO_PARENT = 'go-parent';
const ACTION_COPY_HERE = 'copy-here';
const ACTION_SELECT = 'select';

const renderTUI = (dirPath, items, tui) => {
  let selectedIdx = 0;

  const getFiltered = () => {
    if (!tui.filterText) return items;

    const needle = tui.filterText.toLowerCase();
    return items.filter(item => item.name.toLowerCase().includes(needle));
  };

  const redraw = () => {
    const filtered = getFiltered();
    if (filtered.length > 0 && selectedIdx >= filtered.length) {
      selectedIdx = filtered.length - 1;
    }

    if (filtered.length === 0) {
      selectedIdx = 0;
    }

    const activeItem = filtered[selectedIdx] ?? null;

    tui.clearScreen();
    tui.renderHeader(dirPath, {
      totalCount: items.length,
      filteredCount: filtered.length,
      filterText: tui.filterText,
      headerHint: 'ctrl+y stay here',
    });
    tui.renderList(filtered, selectedIdx);
    tui.renderFooter({
      filterText: tui.filterText,
      helpText: activeItem
        ? '↑↓ move | type filter | esc quit'
        : 'type filter | ← back / | esc quit',
    });
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
      const filtered = getFiltered();

      if ((key.ctrl && key.name === 'c') || key.name === 'escape') {
        cleanup();
        tui.exit();
        process.exit(0);
      }

      if (key.name === 'left') {
        cleanup();
        resolve({ action: ACTION_GO_PARENT });
        return;
      }

      if (key.ctrl && key.name === 'y') {
        cleanup();
        resolve({ action: ACTION_COPY_HERE });
        return;
      }

      if (key.name === 'up') {
        selectedIdx = Math.max(0, selectedIdx - 1);
        redraw();
        return;
      }

      if (key.name === 'down') {
        selectedIdx = filtered.length === 0
          ? 0
          : Math.min(filtered.length - 1, selectedIdx + 1);
        redraw();
        return;
      }

      if (key.name === 'return') {
        if (filtered.length > 0) {
          cleanup();
          resolve({
            action: ACTION_SELECT,
            item: filtered[selectedIdx],
          });
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
    tui.renderFooter({
      filterText: '',
      helpText: '↑↓ move | enter select | esc cancel',
      promptLabel: 'Editor',
      placeholder: 'Choose how to open this path',
    });
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
    .map(i => ({
      kind: i.isDirectory() ? 'directory' : 'file',
      name: i.name,
      label: i.isDirectory() ? `${DIRECTORY_PREFIX}${i.name}` : i.name,
      path: path.join(dir, i.name),
    }))
    .sort((a, b) => {
      const aIsDir = a.kind === 'directory';
      const bIsDir = b.kind === 'directory';

      if (aIsDir !== bIsDir) {
        return aIsDir ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });

  const result = await renderTUI(dir, newItems, tui);

  if (result.action === ACTION_GO_PARENT) {
    return nav(path.dirname(dir), tui);
  }

  if (result.action === ACTION_COPY_HERE) {
    return copyCurrentDirectory(dir, tui);
  }

  if (result.action === ACTION_SELECT && result.item) {
    if (result.item.kind === 'directory') {
      return nav(result.item.path, tui);
    }

    await selectEditor(true, result.item.path, tui);
    return nav(dir, tui);
  }
};

export const selectEditor = async (isFile, filePath, tui) => {
  const VS_CODE_ANSWER = 'VS Code';
  const INTELI_J_ANSWER = 'IntelliJ';
  const NOTEPAD_ANSWER = 'Notepad';

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
