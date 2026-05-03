import { spawn } from 'child_process';
import clipboard from 'clipboardy';
import which from 'which';

const formatCdCommand = (currentDir) => {
  if (process.platform === 'win32') {
    return `cd "${currentDir.replace(/"/g, '""')}"`;
  }

  // Single-quote the path on POSIX shells to avoid command substitution.
  return `cd '${currentDir.replace(/'/g, `'\\''`)}'`;
};

export const copyCurrentDirectory = (currentDir, tui) => {
  try {
    clipboard.writeSync(formatCdCommand(currentDir));
  } catch (error) {
    tui.exit();
    console.error(`Failed to copy to clipboard: ${error.message}`);
    process.exit(1);
  }
  tui.exit();
  console.log('cd command copied to clipboard.');
  process.exit(0);
};

const EDITORS = [
  { label: 'VS Code', command: 'code', fileOnly: false, args: ['-n'] },
  { label: 'IntelliJ', command: 'idea', fileOnly: false },
  { label: 'Notepad', command: 'notepad', fileOnly: true },
];

export const getEditorLaunchArgs = (editor, filePath) => [
  ...(editor.args ?? []),
  filePath,
];

export const getAvailableEditors = async (isFile) => {
  const candidates = EDITORS.filter((editor) => isFile || !editor.fileOnly);

  const resolvedEditors = await Promise.all(
    candidates.map(async (editor) => {
      try {
        const resolvedCommand = await which(editor.command);
        return { ...editor, resolvedCommand };
      } catch {
        return null;
      }
    }),
  );

  return resolvedEditors.filter(Boolean);
};

export const openEditor = async (editor, filePath) => {
  try {
    const isWindowsShim =
      process.platform === 'win32' && /\.(cmd|bat)$/i.test(editor.resolvedCommand);
    const launchArgs = getEditorLaunchArgs(editor, filePath);

    const child = isWindowsShim
      ? spawn(process.env.ComSpec || 'cmd.exe', ['/c', editor.resolvedCommand, ...launchArgs], {
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
        })
      : spawn(editor.resolvedCommand, launchArgs, {
          detached: true,
          stdio: 'ignore',
          windowsHide: true,
        });

    return await new Promise((resolve) => {
      child.once('error', (error) => {
        console.error(`Error opening in ${editor.label}: ${error.message}`);
        resolve(false);
      });

      child.once('spawn', () => {
        child.unref();
        resolve(true);
      });
    });
  } catch (error) {
    console.error(`Is ${editor.label} installed? Unexpected error: ${error.message}`);
    return false;
  }
};
