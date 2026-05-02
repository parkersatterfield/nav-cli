import { exec } from 'child_process';
import { nav, selectEditor } from './navigation.js';
import clipboard from 'clipboardy';
import path from 'path';
import which from 'which';
import { DIR_SYMBOL, FILE_SYMBOL, STAY_MESSAGE, GO_BACK_MESSAGE, OPEN_MESSAGE } from './constants.js';

const cd = (currentDir, tui) => {
  try {
    clipboard.writeSync(`cd "${currentDir}"`);
  } catch (error) {
    tui.exit();
    console.error(`Failed to copy to clipboard: ${error.message}`);
    process.exit(1);
  }
  tui.exit();
  console.log(`📋 cd command copied to clipboard.`);
  process.exit(0);
};

const openInEditor = async (filePath, command, editorName) => {
  try {
    await which(command);
    exec(`${command} ${filePath}`, (error) => {
      if (error) console.error(`Error opening in ${editorName}: ${error.message}`);
    });
  } catch (error) {
    console.error(`Is ${editorName} installed? Unexpected error: ${error.message}`);
  }
};

export const handleVSCodeOpen = (filePath) => {
  openInEditor(filePath, 'code', 'VS Code');
};

export const handleInteliJOpen = (filePath) => {
  openInEditor(filePath, 'idea', 'InteliJ');
};

export const handleNotepadOpen = (filePath) => {
  openInEditor(filePath, 'notepad', 'Notepad');
};

export const handleCustomEditorOpen = (filePath, command) => {
  openInEditor(filePath, command, command);
};

const extractPath = (input, symbol) => input.replace(`${symbol} `, '');

export const handleAnswer = async (answer, currentDir, tui) => {
  try {
    const navTarget = answer.navTo;

    if (navTarget === STAY_MESSAGE) {
      return cd(currentDir, tui);
    }

    if (navTarget === GO_BACK_MESSAGE) {
      return nav(path.dirname(currentDir), tui);
    }

    if (navTarget.startsWith(DIR_SYMBOL)) {
      const dirName = extractPath(navTarget, DIR_SYMBOL);
      return nav(path.join(currentDir, dirName), tui);
    } else if (navTarget.startsWith(FILE_SYMBOL)) {
      const fileName = extractPath(navTarget, FILE_SYMBOL);
      await selectEditor(true, path.join(currentDir, fileName), tui);
      return nav(currentDir, tui);
    } else if (navTarget === OPEN_MESSAGE) {
      await selectEditor(false, currentDir, tui);
      return nav(currentDir, tui);
    } else {
      console.error('Invalid navigation target.');
    }
  } catch (error) {
    console.error(`Error handling answer: ${error.message}`);
  }
};
