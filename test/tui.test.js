import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildHeaderModel,
  getMaxVisibleRows,
  LIST_START_ROW,
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
