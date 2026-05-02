import fs from "fs/promises";
import readline from "readline";
import { handleAnswer, handleVSCodeOpen, handleInteliJOpen, handleNotepadOpen, handleCustomEditorOpen } from "./utils.js";
import { DIR_SYMBOL, FILE_SYMBOL, STAY_MESSAGE, GO_BACK_MESSAGE, OPEN_MESSAGE } from "./constants.js";
import { setupHotkeys } from "./hotkeys.js";

const LEFT = "@@LEFT";
const VSCODE_OPEN = "@@VSCODE";

const runPrompt = (cwd, items) => {
    const allChoices = [STAY_MESSAGE, GO_BACK_MESSAGE, OPEN_MESSAGE, ...items];
    let input = "";
    let selectedIndex = 0;

    const getFiltered = () => {
        if (!input) return allChoices;
        return items.filter((item) => item.toLowerCase().includes(input.toLowerCase()));
    };

    const render = () => {
        console.clear();
        const filtered = getFiltered();
        if (filtered.length > 0 && selectedIndex >= filtered.length) {
            selectedIndex = filtered.length - 1;
        }
        process.stdout.write(`📂 ${cwd}\nSearch: ${input}\n\n`);
        if (filtered.length === 0) {
            process.stdout.write("  No matches.\n");
        } else {
            filtered.forEach((item, i) => {
                process.stdout.write(`${i === selectedIndex ? "> " : "  "}${item}\n`);
            });
        }
    };

    return new Promise((resolve) => {
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.removeAllListeners("keypress");

        const cleanup = () => {
            process.stdin.removeListener("keypress", onKey);
            if (process.stdin.isTTY) process.stdin.setRawMode(false);
        };

        const onKey = (str, key) => {
            if (!key) return;

            if ((key.ctrl && key.name === "c") || key.name === "escape") {
                cleanup();
                console.clear();
                process.exit(0);
            }

            if (key.name === "left") {
                cleanup();
                resolve(LEFT);
                return;
            }

            if (key.ctrl && key.name === "o") {
                cleanup();
                resolve(VSCODE_OPEN);
                return;
            }

            const filtered = getFiltered();

            if (key.name === "up") {
                selectedIndex = Math.max(0, selectedIndex - 1);
                render();
                return;
            }

            if (key.name === "down") {
                selectedIndex = Math.min(filtered.length - 1, selectedIndex + 1);
                render();
                return;
            }

            if (key.name === "return") {
                if (filtered.length > 0) {
                    cleanup();
                    resolve(filtered[selectedIndex]);
                }
                return;
            }

            if (key.name === "backspace") {
                input = input.slice(0, -1);
                selectedIndex = 0;
                render();
                return;
            }

            if (str && str.length === 1 && !key.ctrl && !key.meta) {
                input += str;
                selectedIndex = 0;
                render();
                return;
            }
        };

        process.stdin.on("keypress", onKey);
        render();
    });
};

const runListPrompt = (message, choices) => {
    let selectedIndex = 0;

    const render = () => {
        console.clear();
        process.stdout.write(`${message}\n\n`);
        choices.forEach((choice, i) => {
            process.stdout.write(`${i === selectedIndex ? "> " : "  "}${choice}\n`);
        });
    };

    return new Promise((resolve) => {
        readline.emitKeypressEvents(process.stdin);
        if (process.stdin.isTTY) process.stdin.setRawMode(true);
        process.stdin.resume();
        process.stdin.removeAllListeners("keypress");

        const cleanup = () => {
            process.stdin.removeListener("keypress", onKey);
            if (process.stdin.isTTY) process.stdin.setRawMode(false);
        };

        const onKey = (str, key) => {
            if (!key) return;

            if (key.ctrl && key.name === "c") {
                cleanup();
                process.exit(0);
            }

            if (key.name === "escape") {
                cleanup();
                resolve(null);
                return;
            }

            if (key.name === "up") {
                selectedIndex = Math.max(0, selectedIndex - 1);
                render();
                return;
            }

            if (key.name === "down") {
                selectedIndex = Math.min(choices.length - 1, selectedIndex + 1);
                render();
                return;
            }

            if (key.name === "return") {
                cleanup();
                resolve(choices[selectedIndex]);
                return;
            }
        };

        process.stdin.on("keypress", onKey);
        render();
    });
};

export const nav = async () => {
    setupHotkeys();

    const items = await fs.readdir(process.cwd(), { withFileTypes: true });
    const newItems = items
        .filter((i) => !i.name.startsWith("."))
        .map((i) => (i.isDirectory() ? `${DIR_SYMBOL} ${i.name}` : `${FILE_SYMBOL} ${i.name}`))
        .sort((a) => (a.startsWith(DIR_SYMBOL) ? -1 : 1));

    const selected = await runPrompt(process.cwd(), newItems);

    if (selected === LEFT) {
        process.chdir("..");
        return nav();
    }

    if (selected === VSCODE_OPEN) {
        handleVSCodeOpen(process.cwd());
        return nav();
    }

    await handleAnswer({ navTo: selected });
};

export const selectEditor = async (isFile, filePath) => {
    const openPath = filePath || process.cwd();

    // Set NAV_EDITOR to any editor command (e.g. "code", "vim", "subl") to skip the
    // interactive prompt and open directly in that editor every time.
    const navEditor = process.env.NAV_EDITOR;
    if (navEditor) {
        handleCustomEditorOpen(openPath, navEditor);
        return;
    }

    const VS_CODE_ANSWER = "🆚 VS Code";
    const INTELI_J_ANSWER = "☕ InteliJ";
    const NOTEPAD_ANSWER = "🗒️ Notepad";

    const choices = [VS_CODE_ANSWER, INTELI_J_ANSWER];
    if (isFile) {
        choices.push(NOTEPAD_ANSWER);
    }

    const answer = await runListPrompt("Select your editor:", choices);
    if (!answer) return;

    if (answer === VS_CODE_ANSWER) {
        handleVSCodeOpen(openPath);
    } else if (answer === INTELI_J_ANSWER) {
        handleInteliJOpen(openPath);
    } else if (answer === NOTEPAD_ANSWER) {
        handleNotepadOpen(openPath);
    }

    console.clear();
};
