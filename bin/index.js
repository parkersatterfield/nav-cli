#!/usr/bin/env node

import { nav } from './navigation.js';
import { TUI } from './tui.js';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(
    'Usage: nav\n\nNavigate your filesystem interactively.'
  );
  process.exit(0);
}

if (!process.stdout.isTTY) {
  console.error('nav requires an interactive terminal');
  process.exit(1);
}

const tui = new TUI();

const cleanup = () => {
  try { tui.exit(); } catch {}
  try { if (process.stdin.isTTY) process.stdin.setRawMode(false); } catch {}
};

process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('exit', cleanup);
process.on('uncaughtException', (err) => { cleanup(); console.error(err); process.exit(1); });

tui.enter();
await nav(process.cwd(), tui);
cleanup();
