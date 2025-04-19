import inquirer from "inquirer";
import fs from "fs/promises";
import chalk from "chalk";
import { handleAnswer, handleVSCodeOpen, handleInteliJOpen, handleNotepadOpen } from "./utils.js";
import { DIR_SYMBOL, FILE_SYMBOL, STAY_MESSAGE, GO_BACK_MESSAGE, OPEN_MESSAGE } from "./constants.js";
import { setupHotkeys } from "./hotkeys.js";
import inquirerAutocompletePrompt from "inquirer-autocomplete-prompt";

inquirer.registerPrompt("autocomplete", inquirerAutocompletePrompt);

export const nav = async () => {
    setupHotkeys();

    const items = await fs.readdir(process.cwd(), { withFileTypes: true });
    const newItems = items
        .filter((i) => !i.name.startsWith("."))
        .map((i) => (i.isDirectory() ? `${DIR_SYMBOL} ${i.name}` : `${FILE_SYMBOL} ${i.name}`))
        .sort((a) => (a.startsWith(DIR_SYMBOL) ? -1 : 1));

    const prompt = async () => {
        const { navTo } = await inquirer.prompt({
            name: "navTo",
            type: "autocomplete",
            loop: false,
            message: `${chalk.blue(process.cwd())} \nType to filter files/directories: \n`,
            source: (_, input) => {
                input = input || "";
                return Promise.resolve(
                    [STAY_MESSAGE, GO_BACK_MESSAGE, OPEN_MESSAGE, ...newItems]
                        .filter((item) => item.toLowerCase().includes(input.toLowerCase()))
                        .filter((item) => {
                            if (input) {
                                return item !== STAY_MESSAGE && item !== GO_BACK_MESSAGE && item !== OPEN_MESSAGE;
                            }
                            return true;
                        })
                );
            },
        });

        await handleAnswer({ navTo });
    };

    prompt();
};


export const selectEditor = async (path) => {
    const VS_CODE_ANSWER = "🆚 VS Code";
    const INTELI_J_ANSWER = "☕ InteliJ";
    const NOTEPAD_ANSWER = "🗒️ Notepad";

    inquirer
        .prompt({
            name: "editor",
            type: "list",
            message: "Select your editor:",
            choices: [VS_CODE_ANSWER, INTELI_J_ANSWER, NOTEPAD_ANSWER],
        })
        .then((answer) => {
            if (!path) {
                path = process.cwd();
            }

            if (answer.editor === VS_CODE_ANSWER) {
                handleVSCodeOpen(path);
            } else if (answer.editor === INTELI_J_ANSWER) {
                handleInteliJOpen(path);
            } else if (answer.editor === NOTEPAD_ANSWER) {
                handleNotepadOpen(path);
            }
            console.clear()
        })
        .catch((error) => console.error(chalk.red(`Error: ${error.message}`)));
}