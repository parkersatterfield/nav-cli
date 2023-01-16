#!/usr/bin/env node

import inquirer from "inquirer";
import fs, { opendir } from "fs";
import { exec } from "child_process";
import { chdir } from "process";
import clipboard from "clipboardy";
import chalk from "chalk";
import yargs from "yargs";
import { isNotJunk } from 'junk';

// yargs config
yargs((process.argv.slice(2)))
  .usage('nav-cli is a command line tool to help developers navigate file systems from the command line better.'
    + '\n \n Use arrow keys to navigate directories or open files in VS Code'
    + '\n \n For usage, check out the ReadMe here:' 
    + '\n https://github.com/parkersatterfield/nav-cli#nav-cli--')
  .command('nav', "Run to bring up navigation interface in your terminal.")
  .help('help')
  .alias('h', 'help')
  .argv
;

const STAY_MESSAGE = "✅ Stay Here";
const GO_BACK_MESSAGE = "🔙 Go Back";
const OPEN_MESSAGE = "↗️ Open in VS Code"

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
    // try open with VS Code
    try {
        exec(`${file} code .`);
    } catch (error) {
        console.error(error);
    }
}

// open dir helper
const openDir = () => {
    try {
        exec(`code ${process.cwd()}`);
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
        } else if (i.isFile() && i.isNotJunk) {
            newItems.push("📄 " + i.name);
        }
    });

    inquirer.prompt({
        name: 'navTo',
        type: 'list',
        message: `${chalk.blue(process.cwd())} \n`,
        choices: [
            STAY_MESSAGE,
            GO_BACK_MESSAGE,
            OPEN_MESSAGE,
            ...newItems
        ]
    }).then((answer) => 
        handleAnswer(answer))
    .catch((error) => {
        console.log(error);
    });
}

// initialize program 
nav();