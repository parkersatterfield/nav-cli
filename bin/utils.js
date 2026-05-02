import { execFile } from 'child_process';
import clipboard from 'clipboardy';
import which from 'which';

export const copyCurrentDirectory = (currentDir, tui) => {
  try {
    clipboard.writeSync(`cd "${currentDir}"`);
  } catch (error) {
    tui.exit();
    console.error(`Failed to copy to clipboard: ${error.message}`);
    process.exit(1);
  }
  tui.exit();
  console.log('cd command copied to clipboard.');
  process.exit(0);
};

const openInEditor = async (filePath, command, editorName) => {
  try {
    await which(command);
    execFile(command, [filePath], (error) => {
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
  openInEditor(filePath, 'idea', 'IntelliJ');
};

export const handleNotepadOpen = (filePath) => {
  openInEditor(filePath, 'notepad', 'Notepad');
};
