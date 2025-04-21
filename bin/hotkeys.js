import readline from "readline";
import { nav } from "./navigation.js";
import { handleInteliJOpen, handleVSCodeOpen } from "./utils.js";

let rl;

export const setupHotkeys = () => {
    if (rl) {
        rl.close();
        rl = null;
    }

    process.stdin.removeAllListeners("keypress");

    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const keypressListener = (str, key) => {
        if (key.name === "left") {
            console.clear();
            rl.close();
            process.chdir("..");
            return nav();
        }

        if (key.ctrl && key.name === "o") {
            handleVSCodeOpen(process.cwd());
            console.clear();
            rl.close();
        }

        if (key.name === "escape") {
            console.clear();
            rl.close();
            rl = null;
            process.exit(0);
        }
    };

    process.stdin.on("keypress", keypressListener);
};