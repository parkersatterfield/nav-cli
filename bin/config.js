import fs from 'fs/promises';
import os from 'os';
import path from 'path';

export const EMPTY_CONFIG = {
  homeDir: null,
  favorites: [],
};

const ensureStringArray = (value) => Array.isArray(value)
  ? value.filter((item) => typeof item === 'string' && item.trim().length > 0)
  : [];

const normalizeDirectoryPath = (dirPath) => path.resolve(dirPath);

const dedupeFavorites = (favorites) => {
  const seen = new Set();
  const normalized = [];

  for (const favorite of favorites) {
    const resolved = normalizeDirectoryPath(favorite);
    if (seen.has(resolved)) continue;
    seen.add(resolved);
    normalized.push(resolved);
  }

  return normalized;
};

export const normalizeConfig = (config) => {
  const homeDir = typeof config?.homeDir === 'string' && config.homeDir.trim().length > 0
    ? normalizeDirectoryPath(config.homeDir)
    : null;

  const favorites = dedupeFavorites(ensureStringArray(config?.favorites));

  return {
    homeDir,
    favorites,
  };
};

export const getConfigPath = ({
  platform = process.platform,
  env = process.env,
  homeDir = os.homedir(),
} = {}) => {
  if (platform === 'win32') {
    const appDataDir = env.APPDATA || path.join(homeDir, 'AppData', 'Roaming');
    return path.join(appDataDir, 'nav-cli', 'config.json');
  }

  if (platform === 'darwin') {
    return path.join(homeDir, 'Library', 'Application Support', 'nav-cli', 'config.json');
  }

  const xdgConfigHome = env.XDG_CONFIG_HOME || path.join(homeDir, '.config');
  return path.join(xdgConfigHome, 'nav-cli', 'config.json');
};

export const loadConfig = async ({
  configPath = getConfigPath(),
  fsImpl = fs,
} = {}) => {
  try {
    const raw = await fsImpl.readFile(configPath, 'utf8');
    return normalizeConfig(JSON.parse(raw));
  } catch (error) {
    if (error?.code === 'ENOENT' || error instanceof SyntaxError) {
      return { ...EMPTY_CONFIG };
    }

    throw error;
  }
};

export const saveConfig = async (config, {
  configPath = getConfigPath(),
  fsImpl = fs,
} = {}) => {
  const normalized = normalizeConfig(config);
  await fsImpl.mkdir(path.dirname(configPath), { recursive: true });
  await fsImpl.writeFile(configPath, `${JSON.stringify(normalized, null, 2)}\n`, 'utf8');
  return normalized;
};

export const isDirectoryPath = async (dirPath, { fsImpl = fs } = {}) => {
  const resolved = normalizeDirectoryPath(dirPath);

  try {
    const stats = await fsImpl.stat(resolved);
    return stats.isDirectory();
  } catch (error) {
    if (error?.code === 'ENOENT') {
      return false;
    }

    throw error;
  }
};

const ensureDirectory = async (dirPath, options = {}) => {
  const resolved = normalizeDirectoryPath(dirPath);
  const isDirectory = await isDirectoryPath(resolved, options);

  if (!isDirectory) {
    throw new Error(`Directory does not exist: ${resolved}`);
  }

  return resolved;
};

export const setHomeDir = async (dirPath, options = {}) => {
  const resolved = await ensureDirectory(dirPath, options);
  const current = await loadConfig(options);
  return saveConfig({
    ...current,
    homeDir: resolved,
  }, options);
};

export const clearHomeDir = async (options = {}) => {
  const current = await loadConfig(options);
  return saveConfig({
    ...current,
    homeDir: null,
  }, options);
};

export const addFavorite = async (dirPath, options = {}) => {
  const resolved = await ensureDirectory(dirPath, options);
  const current = await loadConfig(options);
  return saveConfig({
    ...current,
    favorites: [...current.favorites, resolved],
  }, options);
};

export const removeFavorite = async (dirPath, options = {}) => {
  const resolved = normalizeDirectoryPath(dirPath);
  const current = await loadConfig(options);
  return saveConfig({
    ...current,
    favorites: current.favorites.filter((favorite) => favorite !== resolved),
  }, options);
};

export const isFavorite = (dirPath, config) => {
  const resolved = normalizeDirectoryPath(dirPath);
  return config.favorites.includes(resolved);
};
