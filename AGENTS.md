# Repository Guidelines

## Project Structure & Module Organization

`nav-cli` is a cross-platform, keyboard-driven filesystem navigator. Runtime code lives in `bin/`: `index.js` starts the CLI, `cli.js` parses arguments, `navigation.js` coordinates browsing and actions, `tui.js` renders the terminal interface, `config.js` persists home/favorites, and `utils.js` handles editors and clipboard operations. Shared constants live in `constants.js`. Tests are in `test/`; the README screenshot is in `public/`. Only `bin/` is included through the package's `files` setting.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from `package-lock.json`.
- `npm test`: run the full suite using `node --test`.
- `node --test test/navigation.test.js`: run a focused test file.
- `node bin/index.js`: launch locally in an interactive terminal.
- `node bin/index.js h` or `node bin/index.js f`: exercise saved-home or favorites entry modes.
- `npm link`: register the local checkout's `nav` command for manual testing.

There is no compilation step or configured lint/format script.

## Coding Style & Naming Conventions

Use JavaScript ES modules with explicit `.js` extensions in relative imports. Follow existing two-space indentation, single quotes, semicolons, and trailing commas in multiline structures. Use `camelCase` for functions and variables, `PascalCase` for classes such as `TUI`, and `UPPER_SNAKE_CASE` for constants. Keep terminal rendering, navigation state, configuration, and process launching in their respective modules.

## Testing Guidelines

Use `node:test` and `node:assert/strict`. Name files `test/<module>.test.js` and give tests descriptive behavioral names. Cover changed behavior, error paths, and platform-specific cases; no numeric coverage threshold is configured. Use temporary directories or injected dependencies for filesystem/configuration tests. Run `npm test` before submitting, and manually check interactive keyboard behavior for UI changes.

## Commit & Pull Request Guidelines

History uses short, informal descriptions such as `codex security hardening`; no strict commit prefix convention is evident. Write concise, action-oriented subjects. Keep pull requests focused, describe the behavior change, link relevant issues, and report tests performed. Include terminal screenshots for visible interface changes and update README usage or hotkeys when behavior changes.

## Configuration & Platform Considerations

User settings live outside the repository: `%APPDATA%/nav-cli/config.json` on Windows, `~/Library/Application Support/nav-cli/config.json` on macOS, and the XDG configuration directory on Linux. Keep tests isolated from personal settings. Preserve terminal cleanup and safe handling of paths when changing editor launches or clipboard commands.
