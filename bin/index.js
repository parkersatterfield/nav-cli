#!/usr/bin/env node

import inquirer from "inquirer";
import fs from "fs";
import path from "path";
import { exec, execSync, spawn, spawnSync } from "child_process";
import { chdir, execArgv } from "process";
import clipboard from "clipboardy";
import chalk from "chalk";

const STAY_MESSAGE = "✅ Stay Here";
const GO_BACK_MESSAGE = "🔙 Go Back";

// TODO: make this function cd in current shell instance
// temp solution is copy command to clipboard
const cd = () => {
    console.clear();
    clipboard.writeSync(`cd ${process.cwd()}`);
    console.log(chalk.blue(`📋 cd command copied to clipboard.`));
    process.exit(0);
}

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
    
    // if answer is directory, run nav with dire from answer
    if (location.includes("📁")) {
        const dir = location.replace("📁 ", "");
        process.chdir("./" + dir);
        nav(dir);
    } else {
        // if answer is file, open() based on ext
        open(location.replace("📄 ", ""));
    }
}

const open = (file) => {
    console.clear();

    // try open with VS Code
    try {
        exec(`${file} code .`);
    } catch (error) {
        console.error(error);
    }
}

const nav = async () => {
    const items = fs.readdirSync(process.cwd(), {withFileTypes:true});
    
    // format items with types
    const newItems = [];
    items.forEach(i => {
        if (i.isDirectory()) {
            newItems.push("📁 " + i.name);
        } else {
            newItems.push("📄 " + i.name);
        }
    });

    inquirer.prompt({
        name: 'navTo',
        type: 'list',
        message: `${process.cwd()} \n`,
        choices: [
            STAY_MESSAGE,
            GO_BACK_MESSAGE,
            ...newItems
        ]
    }).then((answer) => 
        handleAnswer(answer))
    .catch((error) => {
        console.log(error);
    });
}

nav();