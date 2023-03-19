#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "fs";
import { exec } from "child_process";
import { chdir } from "process";
import clipboard from "clipboardy";
import chalk from "chalk";
import yargs from "yargs";
import { fileURLToPath } from 'url';
import path from 'path';
  
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const config = JSON.parse(fs.readFileSync(path.join(__dirname, 'config.json'), 'utf-8'));

const STAY_MESSAGE = "✅ Stay Here";
const GO_BACK_MESSAGE = "🔙 Go Back";
const OPEN_MESSAGE = `↗️ Open in ${config.editor}`

// TODO: make this function cd in current shell instance
// temp solution is copy command to clipboard
const cd = () => {
    console.clear();
    const newDir = process.cwd();
    console.log(newDir);
    clipboard.writeSync(`cd "${newDir}"`);
    console.log(chalk.blue(`📋 cd command copied to clipboard.`));
    process.exit(0);
}

// handle inquirer helper -> nav and open logic
const handleAnswer = async (answer) => {
    console.clear();
    const location = answer.navTo;

    if (location === STAY_MESSAGE) {
        return cd();
    }

    if (location === GO_BACK_MESSAGE) {
        chdir('../');
        return nav(process.cwd());
    }
    
    // if answer is directory, run nav with dir from answer
    if (location.includes("📁")) {
        const dir = location.replace("📁 ", "");
        process.chdir("./" + dir);
        nav(dir);
    } else if (location.includes("↗️")) {
        openDir();
    } else {
        // if answer is file, open() based on ext
        openFile(location.replace("📄 ", ""));
    }
}

// open file helper
const openFile = (file) => {
    // try open with editor
    try {
        exec(`${file} ${config.editorOptions[config.editor].openCommand}`);
    } catch (error) {
        console.error(error);
    }
}

// open dir helper
const openDir = () => {
    try {
        exec(`${config.editorOptions[config.editor].openCommand} ${process.cwd()}`);
    } catch (error) {
        console.error(error);
    }
}

// main function
const nav = async () => {
    const items = fs.readdirSync(process.cwd(), {withFileTypes:true});
    
    // format items with types
    const newItems = [];

    items.forEach(i => {
        if (i.isDirectory() && !i.name.startsWith(".")) {
            newItems.push("📁 " + i.name);
        } 
        if (i.isFile()) {
            newItems.push("📄 " + i.name);
        }
    });

    // sort directories first
    newItems.sort(x => {
        if (x.includes("📁")) {
            return -1;
        } 
        if (x.includes("📄")) {
            return 1;
        }
        return 0;
    });

    inquirer.prompt({
        name: 'navTo',
        type: 'list',
        message: `${chalk.blue(process.cwd())} \n`,
        choices: [
            STAY_MESSAGE,
            GO_BACK_MESSAGE,
            OPEN_MESSAGE,
            ...newItems,
            "------------"
        ]
    }).then((answer) => 
        handleAnswer(answer))
    .catch((error) => {
        console.log(error);
    });
}

// change editor function
const changeEditor = () => {
    inquirer.prompt({
        name: 'editor',
        type: 'list',
        message:`Select your default editor \n Current: ${config.editor}`,
        choices: [
            "VS Code",
            "IntelliJ"
        ]
    }).then((answer) => 
        writeEditorChange(answer))
    .catch((error) => {
        console.log(error);
    });
}

// change config.json file
const writeEditorChange = (answer) => {
    config.editor = answer.editor;
    fs.writeFileSync(path.join(__dirname, 'config.json'), JSON.stringify(config));
}

// yargs config
yargs((process.argv.slice(2)))
  .usage('nav-cli is a command line tool to help developers navigate file systems from the command line better.'
  + '\n \n Use arrow keys to navigate directories or open files in editor'
    + '\n \n For usage, check out the ReadMe here:' 
    + '\n https://github.com/parkersatterfield/nav-cli#nav-cli--')
  .command(
    'nav',
    "Run to bring up navigation interface in your terminal."
  )
  .command(
    'nav config',
    "Change default editor"
  )
  .help('help')
  .wrap(null)
  .alias('h', 'help')
  .argv
;

if (process.argv.slice(2) == 'config') {
    changeEditor();
} else {
    nav();
}