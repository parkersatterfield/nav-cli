import test from 'node:test';
import assert from 'node:assert/strict';
import { getEditorLaunchArgs } from '../bin/utils.js';

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
