#!/usr/bin/env node

import { nav } from "./navigation.js";
import yargs from "yargs";

yargs(process.argv.slice(2))
    .usage(
        "nav-cli is a command line tool to help developers navigate file systems from the command line better." +
        "\n \n Use arrow keys to navigate directories or open files in editor." +
        "\n \n Use o key to open files or directories in VS Code." +
        "\n \n For usage, check out the ReadMe here:" +
        "\n https://github.com/parkersatterfield/nav-cli#nav-cli--"
    )
    .command("nav", "Run to bring up navigation interface in your terminal.")
    .help("help")
    .wrap(null)
    .alias("h", "help").argv;

nav();