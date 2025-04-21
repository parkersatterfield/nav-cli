#!/usr/bin/env node

import { nav } from "./navigation.js";
import yargs from "yargs";

yargs(process.argv.slice(2))
    .usage(
        "nav-cli is a command line tool to help developers navigate file systems from the command line better." +
        "\n \n Use up and down arrow keys to navigate directories or open files in editor." +
        "\n \n Use left arrow to go back a directory." +
        "\n \n Use ctrl + o to open cwd in VS Code." +
        "\n \n Use esc to exit." +
        "\n \n For usage, check out the ReadMe here:" +
        "\n https://github.com/parkersatterfield/nav-cli#nav-cli--"
    )
    .command("nav", "Run to bring up navigation interface in your terminal.")
    .help("help")
    .wrap(null)
    .alias("h", "help").argv;

nav();