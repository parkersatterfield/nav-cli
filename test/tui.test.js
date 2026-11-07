import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHeaderModel,
  getMaxVisibleRows,
  LIST_START_ROW,
  sanitizeForTerminal,
} from '../bin/tui.js';

test('buildHeaderModel preserves the tail of long paths', () => {
  const model = buildHeaderModel(
    'C:\\Users\\Parker\\Repos\\nav-cli\\some\\really\\long\\nested\\directory',
    { totalCount: 24, headerHint: 'browse' },
    32,
  );

  assert.equal(model.pathLine.startsWith('  └── ...'), true);
  assert.equal(model.pathLine.endsWith('\\nested\\directory'), true);
});

test('buildHeaderModel keeps count label stable in narrow widths', () => {
  const model = buildHeaderModel('/workspace/project', {
    totalCount: 128,
    filteredCount: 12,
    filterText: 'nav',
    headerHint: 'favorites',
  }, 28);

  assert.equal(model.countLabel, '12/128 shown');
  assert.equal(model.statusLine.length <= 28, true);
  assert.equal(model.pathLine.startsWith('  └── '), true);
});

test('getMaxVisibleRows accounts for two header rows and two footer rows', () => {
  assert.equal(getMaxVisibleRows(24), 20);
  assert.equal(getMaxVisibleRows(4), 1);
  assert.equal(LIST_START_ROW, 3);
});

test('sanitizeForTerminal strips terminal control characters', () => {
  assert.equal(
    sanitizeForTerminal('repo\u001b[2J\u0007\nname'),
    'repo[2Jname',
  );
});

test('buildHeaderModel strips control sequences from displayed paths', () => {
  const model = buildHeaderModel(
    'C:\\safe\\\u001b]8;;https://evil.example\u0007click\u001b]8;;\u0007',
    { totalCount: 1, headerHint: 'browse\u001b[31m' },
    80,
  );

  assert.equal(model.pathLine.includes('\u001b]8'), false);
  assert.equal(model.pathLine.includes('\u0007'), false);
  assert.equal(model.statusLine.includes('\u001b'), false);
});
