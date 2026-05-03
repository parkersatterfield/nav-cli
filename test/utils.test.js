import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import { getEditorLaunchArgs } from '../bin/utils.js';
import { openEditor } from '../bin/utils.js';

test('getEditorLaunchArgs uses a new window for VS Code', () => {
  assert.deepEqual(
    getEditorLaunchArgs({ label: 'VS Code', args: ['-n'] }, '/workspace/project'),
    ['-n', '/workspace/project'],
  );
});

test('getEditorLaunchArgs falls back to the file path for editors without extra args', () => {
  assert.deepEqual(
    getEditorLaunchArgs({ label: 'IntelliJ' }, '/workspace/project'),
    ['/workspace/project'],
  );
});

test('openEditor refuses unsafe Windows shim paths without executing injected commands', {
  skip: process.platform !== 'win32',
}, async () => {
  const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'nav-cli-utils-test-'));
  const injectedDirName = 'nav-cli-open-editor-injected';
  const unsafeDir = path.join(tempRoot, `shim-&mkdir ${injectedDirName}&-dir`);
  const injectedDirPath = path.join(process.cwd(), injectedDirName);

  try {
    await fs.mkdir(unsafeDir, { recursive: true });
    await fs.writeFile(path.join(unsafeDir, 'editor.cmd'), '@echo off\r\n', 'utf8');
    await fs.rm(injectedDirPath, { recursive: true, force: true });

    const didOpen = await openEditor({
      label: 'Unsafe Editor',
      resolvedCommand: path.join(unsafeDir, 'editor.cmd'),
    }, 'C:\\workspace\\target.txt');

    assert.equal(didOpen, false);
    await assert.rejects(fs.access(injectedDirPath));
  } finally {
    await fs.rm(injectedDirPath, { recursive: true, force: true });
    await fs.rm(tempRoot, { recursive: true, force: true });
  }
});
