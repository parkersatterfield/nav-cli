import fs from 'fs/promises';
import path from 'path';
import readline from 'readline';
import {
  addFavorite,
  clearHomeDir,
  isDirectoryPath,
  isFavorite,
  loadConfig,
  removeFavorite,
  setHomeDir,
} from './config.js';
import { copyCurrentDirectory, getAvailableEditors, openEditor } from './utils.js';
import { DIRECTORY_PREFIX } from './constants.js';
import { sanitizeForTerminal } from './tui.js';

const ACTION_GO_PARENT = 'go-parent';
const ACTION_COPY_HERE = 'copy-here';
const ACTION_OPEN_TARGET = 'open-target';
const ACTION_OPEN_ACTIONS = 'open-actions';
const ACTION_SELECT = 'select';

const MODE_DEFAULT = 'default';
const MODE_HOME = 'home';
const MODE_FAVORITES = 'favorites';

const BROWSER_STATUS = 'browse';

const buildDirectoryItems = async (dirPath, fsImpl = fs) => {
  const items = await fsImpl.readdir(dirPath, { withFileTypes: true });

  return items
    .filter((item) => !item.name.startsWith('.'))
    .map((item) => ({
      kind: item.isDirectory() ? 'directory' : 'file',
      name: item.name,
      label: sanitizeForTerminal(item.isDirectory() ? `${DIRECTORY_PREFIX}${item.name}` : item.name),
      path: path.join(dirPath, item.name),
    }))
    .sort((a, b) => {
      const aIsDir = a.kind === 'directory';
      const bIsDir = b.kind === 'directory';

      if (aIsDir !== bIsDir) {
        return aIsDir ? -1 : 1;
      }

      return a.name.localeCompare(b.name);
    });
};

const getModeLabel = (mode) => {
  if (mode === MODE_HOME) return 'home';
  if (mode === MODE_FAVORITES) return 'favorites';
  return BROWSER_STATUS;
};

export const getHeaderStatus = ({
  mode,
  notice,
  dirPath,
  homeDir,
  favoritePaths = [],
}) => {
  if (
    mode === MODE_HOME
    && homeDir
    && dirPath === homeDir
    && notice === 'Starting from your configured home directory.'
  ) {
    return 'home | starting from configured home directory';
  }

  if (mode === MODE_HOME && homeDir && dirPath === homeDir) {
    return 'home';
  }

  if (mode === MODE_HOME) {
    return BROWSER_STATUS;
  }

  if (mode === MODE_FAVORITES) {
    return favoritePaths.includes(dirPath) ? 'favorites' : BROWSER_STATUS;
  }

  return getModeLabel(mode);
};

const getFooterNotice = ({ mode, notice }) => {
  if (mode === MODE_HOME && notice === 'Starting from your configured home directory.') {
    return '';
  }

  return notice;
};

const getBrowserHelpText = ({ activeItem, notice }) => {
  const baseHelp = activeItem
    ? '↑↓ move | enter open | tab menu | ^o open | ^y copy | esc quit'
    : 'type filter | ← back | tab menu | ^y copy | esc quit';

  if (!notice) {
    return baseHelp;
  }

  return `${notice} | ${baseHelp}`;
};

const buildFavoriteChoices = (favorites) => favorites.map((favoritePath) => ({
  label: sanitizeForTerminal(favoritePath),
  value: favoritePath,
}));

export const resolveContextTarget = (dirPath, activeItem) => {
  if (activeItem) {
    return {
      kind: activeItem.kind,
      label: sanitizeForTerminal(activeItem.label),
      path: activeItem.path,
    };
  }

  return {
    kind: 'directory',
    label: sanitizeForTerminal(dirPath),
    path: dirPath,
  };
};

export const buildActionChoices = (target, config) => {
  const choices = [];

  choices.push({
    label: target.kind === 'directory' ? 'Open directory' : 'Open file',
    value: 'open-target',
  });

  if (target.kind !== 'directory') {
    choices.push({ label: 'Cancel', value: 'cancel' });
    return choices;
  }

  if (config.homeDir === target.path) {
    choices.push({ label: 'Clear home', value: 'clear-home' });
  } else {
    choices.push({ label: 'Set as home', value: 'set-home' });
  }

  if (isFavorite(target.path, config)) {
    choices.push({ label: 'Remove from favorites', value: 'remove-favorite' });
  } else {
    choices.push({ label: 'Add to favorites', value: 'add-favorite' });
  }

  choices.push({ label: 'Cancel', value: 'cancel' });

  return choices;
};

export const resolveNavigationState = async ({
  cwd,
  mode = MODE_DEFAULT,
  config,
  isDirectory = async (dirPath) => isDirectoryPath(dirPath),
} = {}) => {
  if (mode === MODE_HOME) {
    if (config.homeDir && await isDirectory(config.homeDir)) {
      return {
        startDir: config.homeDir,
        notice: 'Starting from your configured home directory.',
        favoriteChoices: [],
      };
    }

    return {
      startDir: cwd,
      notice: 'Home is not set. Press Tab to set this directory as home.',
      favoriteChoices: [],
    };
  }

  if (mode === MODE_FAVORITES) {
    const validFavorites = [];

    for (const favorite of config.favorites) {
      if (await isDirectory(favorite)) {
        validFavorites.push(favorite);
      }
    }

    if (validFavorites.length > 0) {
      return {
        startDir: null,
        notice: '',
        favoriteChoices: buildFavoriteChoices(validFavorites),
      };
    }

    return {
      startDir: cwd,
      notice: 'No favorites saved yet. Press Tab to add this directory.',
      favoriteChoices: [],
    };
  }

  return {
    startDir: cwd,
    notice: '',
    favoriteChoices: [],
  };
};

export const renderPicker = ({
  message,
  choices,
  tui,
  helpText = '↑↓ move | enter select | esc cancel',
  promptLabel = 'Select',
  placeholder = 'Choose an option',
}) => {
  let selectedIdx = 0;

  const redraw = () => {
    tui.clearScreen();
    tui.renderHeader(message);
    tui.renderList(choices, selectedIdx);
    tui.renderFooter({
      filterText: '',
      helpText,
      promptLabel,
      placeholder,
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
      process.stdin.pause();
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

      if (key.name === 'return' && choices.length > 0) {
        cleanup();
        resolve(choices[selectedIdx]);
      }
    };

    process.stdin.on('keypress', onKey);
    redraw();
  });
};

const renderBrowser = (dirPath, items, tui, {
  notice = '',
  mode = MODE_DEFAULT,
  homeDir = null,
  favoritePaths = [],
} = {}) => {
  let selectedIdx = 0;

  const getFiltered = () => {
    if (!tui.filterText) return items;

    const needle = tui.filterText.toLowerCase();
    return items.filter((item) => item.name.toLowerCase().includes(needle));
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
    const headerStatus = getHeaderStatus({
      mode,
      notice,
      dirPath,
      homeDir,
      favoritePaths,
    });
    const footerNotice = getFooterNotice({ mode, notice });

    tui.clearScreen();
    tui.renderHeader(dirPath, {
      totalCount: items.length,
      filteredCount: filtered.length,
      filterText: tui.filterText,
      headerHint: headerStatus,
    });
    tui.renderList(filtered, selectedIdx);
    tui.renderFooter({
      filterText: tui.filterText,
      helpText: getBrowserHelpText({ activeItem, notice: footerNotice }),
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
      process.stdin.pause();
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

      if (key.name === 'tab') {
        cleanup();
        resolve({
          action: ACTION_OPEN_ACTIONS,
          target: resolveContextTarget(dirPath, filtered[selectedIdx] ?? null),
        });
        return;
      }

      if (key.ctrl && key.name === 'y') {
        cleanup();
        resolve({ action: ACTION_COPY_HERE });
        return;
      }

      if (key.ctrl && key.name === 'o') {
        cleanup();
        resolve({
          action: ACTION_OPEN_TARGET,
          target: resolveContextTarget(dirPath, filtered[selectedIdx] ?? null),
        });
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
      }
    };

    process.stdin.on('keypress', onKey);
    redraw();
  });
};

const selectFavoriteDirectory = async (favoriteChoices, tui) => {
  const selected = await renderPicker({
    message: 'Choose a favorite directory:',
    choices: favoriteChoices,
    tui,
    helpText: '↑↓ move | enter browse | esc cancel',
    promptLabel: 'Favorite',
    placeholder: 'Select a starting directory',
  });

  return selected?.value ?? null;
};

const openTargetInEditor = async (target, tui) => {
  await selectEditor(target.kind === 'file', target.path, tui);
};

const applyDirectoryAction = async (action, target, tui) => {
  if (action === 'open-target') {
    await openTargetInEditor(target, tui);
    return '';
  }

  if (action === 'set-home') {
    await setHomeDir(target.path);
    return 'Home directory saved.';
  }

  if (action === 'clear-home') {
    await clearHomeDir();
    return 'Home directory cleared.';
  }

  if (action === 'add-favorite') {
    await addFavorite(target.path);
    return 'Added to favorites.';
  }

  if (action === 'remove-favorite') {
    await removeFavorite(target.path);
    return 'Removed from favorites.';
  }

  return '';
};

const openActionsMenu = async (target, tui) => {
  const config = await loadConfig();
  const selected = await renderPicker({
    message: `Actions for ${sanitizeForTerminal(target.path)}`,
    choices: buildActionChoices(target, config),
    tui,
    promptLabel: 'Action',
    placeholder: 'Manage the selected target',
  });

  if (!selected || selected.value === 'cancel') {
    return '';
  }

  return applyDirectoryAction(selected.value, target, tui);
};

const browseDirectory = async (dirPath, tui, {
  mode = MODE_DEFAULT,
  notice = '',
  homeDir = null,
  favoritePaths = [],
} = {}) => {
  tui.scrollOffset = 0;
  tui.filterText = '';

  const items = await buildDirectoryItems(dirPath);
  const result = await renderBrowser(dirPath, items, tui, {
    notice,
    mode,
    homeDir,
    favoritePaths,
  });

  if (result.action === ACTION_GO_PARENT) {
    return browseDirectory(path.dirname(dirPath), tui, { mode, homeDir, favoritePaths });
  }

  if (result.action === ACTION_COPY_HERE) {
    return copyCurrentDirectory(dirPath, tui);
  }

  if (result.action === ACTION_OPEN_TARGET) {
    await openTargetInEditor(result.target, tui);
    return browseDirectory(dirPath, tui, { mode, homeDir, favoritePaths });
  }

  if (result.action === ACTION_OPEN_ACTIONS) {
    const actionNotice = await openActionsMenu(result.target, tui);
    const updatedConfig = await loadConfig();
    return browseDirectory(dirPath, tui, {
      mode,
      notice: actionNotice,
      homeDir: updatedConfig.homeDir,
      favoritePaths: updatedConfig.favorites,
    });
  }

  if (result.action === ACTION_SELECT && result.item) {
    if (result.item.kind === 'directory') {
      return browseDirectory(result.item.path, tui, { mode, homeDir, favoritePaths });
    }

    await selectEditor(true, result.item.path, tui);
    return browseDirectory(dirPath, tui, { mode, homeDir, favoritePaths });
  }
};

export const nav = async ({
  cwd,
  mode = MODE_DEFAULT,
  tui,
} = {}) => {
  const config = await loadConfig();
  const state = await resolveNavigationState({
    cwd,
    mode,
    config,
  });

  if (mode === MODE_FAVORITES && state.favoriteChoices.length > 0) {
    const selectedFavorite = await selectFavoriteDirectory(state.favoriteChoices, tui);

    if (!selectedFavorite) {
      tui.exit();
      return;
    }

    return browseDirectory(selectedFavorite, tui, {
      mode,
      homeDir: config.homeDir,
      favoritePaths: config.favorites,
    });
  }

  return browseDirectory(state.startDir, tui, {
    mode,
    notice: state.notice,
    homeDir: config.homeDir,
    favoritePaths: config.favorites,
  });
};

export const selectEditor = async (isFile, filePath, tui) => {
  const availableEditors = await getAvailableEditors(isFile);
  if (availableEditors.length === 0) {
    tui.exit();
    console.error('No supported editors were found on your PATH.');
    process.exit(1);
  }

  const choices = availableEditors.map((editor) => ({
    label: editor.label,
    value: editor.label,
  }));
  const answer = await renderPicker({
    message: 'Select your editor:',
    choices,
    tui,
    promptLabel: 'Editor',
    placeholder: 'Choose how to open this path',
  });
  if (!answer) return;

  const selectedEditor = availableEditors.find((editor) => editor.label === answer.value);
  if (!selectedEditor) return;

  const didOpen = await openEditor(selectedEditor, filePath);
  if (didOpen) {
    tui.exit();
    process.exit(0);
  }
};
