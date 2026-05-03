import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addFavorite,
  EMPTY_CONFIG,
  getConfigPath,
  loadConfig,
  saveConfig,
  setHomeDir,
} from '../bin/config.js';

const createTempDir = async () => fs.mkdtemp(path.join(os.tmpdir(), 'nav-cli-test-'));

test('loadConfig returns empty config when file is missing', async () => {
  const tempDir = await createTempDir();

  try {
    const config = await loadConfig({
      configPath: path.join(tempDir, 'config.json'),
    });

    assert.deepEqual(config, EMPTY_CONFIG);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('loadConfig returns empty config when file is malformed', async () => {
  const tempDir = await createTempDir();
  const configPath = path.join(tempDir, 'config.json');

  try {
    await fs.writeFile(configPath, '{not valid json}', 'utf8');
    const config = await loadConfig({ configPath });

    assert.deepEqual(config, EMPTY_CONFIG);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('saveConfig and loadConfig round-trip home and favorites', async () => {
  const tempDir = await createTempDir();
  const homeDir = path.join(tempDir, 'home');
  const favoriteDir = path.join(tempDir, 'favorite');
  const configPath = path.join(tempDir, 'config.json');

  try {
    await fs.mkdir(homeDir);
    await fs.mkdir(favoriteDir);

    await saveConfig({
      homeDir,
      favorites: [favoriteDir],
    }, { configPath });

    const loaded = await loadConfig({ configPath });
    assert.deepEqual(loaded, {
      homeDir: path.resolve(homeDir),
      favorites: [path.resolve(favoriteDir)],
    });
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('addFavorite deduplicates favorites', async () => {
  const tempDir = await createTempDir();
  const favoriteDir = path.join(tempDir, 'favorite');
  const configPath = path.join(tempDir, 'config.json');

  try {
    await fs.mkdir(favoriteDir);

    await addFavorite(favoriteDir, { configPath });
    await addFavorite(favoriteDir, { configPath });

    const loaded = await loadConfig({ configPath });
    assert.deepEqual(loaded.favorites, [path.resolve(favoriteDir)]);
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('setHomeDir rejects non-directories', async () => {
  const tempDir = await createTempDir();
  const configPath = path.join(tempDir, 'config.json');
  const filePath = path.join(tempDir, 'not-a-directory.txt');

  try {
    await fs.writeFile(filePath, 'hello', 'utf8');

    await assert.rejects(
      () => setHomeDir(filePath, { configPath }),
      /Directory does not exist/,
    );
  } finally {
    await fs.rm(tempDir, { recursive: true, force: true });
  }
});

test('getConfigPath resolves platform-specific locations', () => {
  assert.equal(
    getConfigPath({
      platform: 'win32',
      env: { APPDATA: 'C:\\Users\\Parker\\AppData\\Roaming' },
      homeDir: 'C:\\Users\\Parker',
    }),
    path.join('C:\\Users\\Parker\\AppData\\Roaming', 'nav-cli', 'config.json'),
  );

  assert.equal(
    getConfigPath({
      platform: 'darwin',
      env: {},
      homeDir: '/Users/parker',
    }),
    path.join('/Users/parker', 'Library', 'Application Support', 'nav-cli', 'config.json'),
  );

  assert.equal(
    getConfigPath({
      platform: 'linux',
      env: { XDG_CONFIG_HOME: '/tmp/config-home' },
      homeDir: '/home/parker',
    }),
    path.join('/tmp/config-home', 'nav-cli', 'config.json'),
  );
});
