import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildActionChoices,
  getHeaderStatus,
  resolveContextTarget,
  resolveNavigationState,
} from '../bin/navigation.js';

test('resolveContextTarget prefers the highlighted item', () => {
  assert.deepEqual(
    resolveContextTarget('/workspace', {
      kind: 'directory',
      label: '/projects',
      path: '/workspace/projects',
    }),
    {
      kind: 'directory',
      label: '/projects',
      path: '/workspace/projects',
    },
  );
});

test('resolveContextTarget falls back to the current directory when nothing is selected', () => {
  assert.deepEqual(resolveContextTarget('/workspace', null), {
    kind: 'directory',
    label: '/workspace',
    path: '/workspace',
  });
});

test('buildActionChoices includes directory actions for directory targets', () => {
  const choices = buildActionChoices({
    kind: 'directory',
    label: '/projects',
    path: '/workspace/projects',
  }, {
    homeDir: '/workspace/home',
    favorites: [],
  });

  assert.deepEqual(choices, [
    { label: 'Open directory', value: 'open-target' },
    { label: 'Set as home', value: 'set-home' },
    { label: 'Add to favorites', value: 'add-favorite' },
    { label: 'Cancel', value: 'cancel' },
  ]);
});

test('buildActionChoices limits file targets to file actions', () => {
  const choices = buildActionChoices({
    kind: 'file',
    label: 'notes.txt',
    path: '/workspace/notes.txt',
  }, {
    homeDir: null,
    favorites: ['/workspace'],
  });

  assert.deepEqual(choices, [
    { label: 'Open file', value: 'open-target' },
    { label: 'Cancel', value: 'cancel' },
  ]);
});

test('getHeaderStatus shows home only while the displayed directory is the configured home', () => {
  assert.equal(getHeaderStatus({
    mode: 'home',
    notice: '',
    dirPath: '/workspace/home',
    homeDir: '/workspace/home',
  }), 'home');

  assert.equal(getHeaderStatus({
    mode: 'home',
    notice: '',
    dirPath: '/workspace/home/projects',
    homeDir: '/workspace/home',
  }), 'browse');
});

test('getHeaderStatus shows configured-home message only on the home directory itself', () => {
  assert.equal(getHeaderStatus({
    mode: 'home',
    notice: 'Starting from your configured home directory.',
    dirPath: '/workspace/home',
    homeDir: '/workspace/home',
  }), 'home | starting from configured home directory');

  assert.equal(getHeaderStatus({
    mode: 'home',
    notice: 'Starting from your configured home directory.',
    dirPath: '/workspace/home/src',
    homeDir: '/workspace/home',
  }), 'browse');
});

test('getHeaderStatus shows favorites only while the displayed directory is a saved favorite', () => {
  assert.equal(getHeaderStatus({
    mode: 'favorites',
    notice: '',
    dirPath: '/workspace/favorite-one',
    homeDir: null,
    favoritePaths: ['/workspace/favorite-one', '/workspace/favorite-two'],
  }), 'favorites');

  assert.equal(getHeaderStatus({
    mode: 'favorites',
    notice: '',
    dirPath: '/workspace/favorite-one/src',
    homeDir: null,
    favoritePaths: ['/workspace/favorite-one', '/workspace/favorite-two'],
  }), 'browse');
});

test('resolveNavigationState uses cwd in default mode', async () => {
  const state = await resolveNavigationState({
    cwd: '/workspace',
    mode: 'default',
    config: {
      homeDir: '/home',
      favorites: ['/favorite'],
    },
    isDirectory: async () => true,
  });

  assert.deepEqual(state, {
    startDir: '/workspace',
    notice: '',
    favoriteChoices: [],
  });
});

test('resolveNavigationState uses home when configured and valid', async () => {
  const state = await resolveNavigationState({
    cwd: '/workspace',
    mode: 'home',
    config: {
      homeDir: '/home',
      favorites: [],
    },
    isDirectory: async (dirPath) => dirPath === '/home',
  });

  assert.deepEqual(state, {
    startDir: '/home',
    notice: 'Starting from your configured home directory.',
    favoriteChoices: [],
  });
});

test('resolveNavigationState falls back to cwd when home is missing', async () => {
  const state = await resolveNavigationState({
    cwd: '/workspace',
    mode: 'home',
    config: {
      homeDir: null,
      favorites: [],
    },
    isDirectory: async () => false,
  });

  assert.deepEqual(state, {
    startDir: '/workspace',
    notice: 'Home is not set. Press Tab to set this directory as home.',
    favoriteChoices: [],
  });
});

test('resolveNavigationState returns favorite choices when valid favorites exist', async () => {
  const state = await resolveNavigationState({
    cwd: '/workspace',
    mode: 'favorites',
    config: {
      homeDir: null,
      favorites: ['/favorite-one', '/favorite-two', '/invalid'],
    },
    isDirectory: async (dirPath) => dirPath !== '/invalid',
  });

  assert.deepEqual(state, {
    startDir: null,
    notice: '',
    favoriteChoices: [
      { label: '/favorite-one', value: '/favorite-one' },
      { label: '/favorite-two', value: '/favorite-two' },
    ],
  });
});

test('resolveNavigationState falls back to cwd when no valid favorites exist', async () => {
  const state = await resolveNavigationState({
    cwd: '/workspace',
    mode: 'favorites',
    config: {
      homeDir: null,
      favorites: ['/invalid'],
    },
    isDirectory: async () => false,
  });

  assert.deepEqual(state, {
    startDir: '/workspace',
    notice: 'No favorites saved yet. Press Tab to add this directory.',
    favoriteChoices: [],
  });
});
