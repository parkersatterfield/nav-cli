import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArgs } from '../bin/cli.js';

test('parseArgs returns default mode with no args', () => {
  assert.deepEqual(parseArgs([]), { kind: 'run', mode: 'default' });
});

test('parseArgs returns home mode for h', () => {
  assert.deepEqual(parseArgs(['h']), { kind: 'run', mode: 'home' });
});

test('parseArgs returns favorites mode for f', () => {
  assert.deepEqual(parseArgs(['f']), { kind: 'run', mode: 'favorites' });
});

test('parseArgs treats --help as help', () => {
  assert.deepEqual(parseArgs(['--help']), { kind: 'help' });
});

test('parseArgs treats -h as help', () => {
  assert.deepEqual(parseArgs(['-h']), { kind: 'help' });
});

test('parseArgs rejects unsupported arguments', () => {
  assert.deepEqual(parseArgs(['--wat']), { kind: 'invalid' });
  assert.deepEqual(parseArgs(['h', 'extra']), { kind: 'invalid' });
});
