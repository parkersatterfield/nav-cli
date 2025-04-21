import { exec } from "child_process";
import chalk from "chalk";
import { nav, selectEditor } from "./navigation.js";
import clipboard from "clipboardy";
import path from "path";
import which from "which";
import { DIR_SYMBOL, FILE_SYMBOL, STAY_MESSAGE, GO_BACK_MESSAGE, OPEN_MESSAGE } from "./constants.js";

const cd = () => {
    console.clear();
    const newDir = process.cwd();
    try {
        clipboard.writeSync(`cd "${newDir}"`);
        console.log(chalk.blue(`📋 cd command copied to clipboard.`));
    } catch (error) {
        console.error(chalk.red(`Failed to copy to clipboard: ${error.message}`));
    }
    process.exit(0);
};

const openInEditor = async (filePath, command, editorName) => {
    try {
        await which(command);
        exec(`${command} ${filePath}`, (error) => {
            if (error) console.error(chalk.red(`Error opening in ${editorName}: ${error.message}`));
        });
    } catch (error) {
        console.error(chalk.red(`Is ${editorName} installed? Unexpected error: ${error.message}`));
    }
};

export const handleVSCodeOpen = (path) => {
    openInEditor(path, "code", "VS Code");
};

export const handleInteliJOpen = (path) => {
    openInEditor(path, "idea", "InteliJ");
};

export const handleNotepadOpen = (path) => {
    openInEditor(path, "notepad", "Notepad");
};

const navigateToDirectory = (dir) => {
    try {
        process.chdir(path.join(process.cwd(), dir));
        nav();
    } catch (error) {
        console.error(chalk.red(`Failed to navigate to directory: ${error.message}`));
    }
};

const extractPath = (input, symbol) => input.replace(`${symbol} `, "");

export const handleAnswer = async (answer) => {
    try {
        console.clear();
        const navTarget = answer.navTo;

        if (navTarget === STAY_MESSAGE) {
            return cd();
        }

        if (navTarget === GO_BACK_MESSAGE) {
            process.chdir("..");
            return nav();
        }

        if (navTarget.startsWith(DIR_SYMBOL)) {
            const dirPath = extractPath(navTarget, DIR_SYMBOL);
            navigateToDirectory(dirPath);
        } else if (navTarget.startsWith(FILE_SYMBOL)) {
            const filePath = extractPath(navTarget, FILE_SYMBOL);
            await selectEditor(true, filePath);
        } else if (navTarget === OPEN_MESSAGE) {
            await selectEditor(false, null);
        } else {
            console.error(chalk.red("Invalid navigation target."));
        }
    } catch (error) {
        console.error(chalk.red(`Error handling answer: ${error.message}`));
    }
};