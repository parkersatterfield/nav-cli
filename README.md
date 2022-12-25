# nav-cli
Nav-cli is a Node.js CLI App to help Node developers navigate file systems from the command line better by providing a basic interface and combining `cd`, `ls`, and `code .` commands into one. 

- NPM: https://www.npmjs.com/package/nav-cli
- GitHub: https://github.com/parkersatterfield/nav-cli 

## Demo
![demo gif](./public/demo.gif)

## Installation
```
npm i -g nav-cli
```

## Requirements
- Node.js
- VS Code (for open file feature)

Note: this app should work across all Operating Systems. 

## Usage
After global installation via npm, run the `nav` command from your shell of choice. You will be prompted with a list of navigation options from your current directory. Use the up and down arrow keys to:
- `✅ Stay Here`: cd [directory to navigate to] command copied to clipboard. Paste into shell to navigate to directory selected from previous run of the app. Note: this is a temporary solution hopefully. A better UX would be to automatically run a cd command in the current working shell, but this runs into some permissions and threading issues. 
- `🔙 Go Back`: navigate to the directory above the current working directory and continue navigating with the CLI app. 
-  `📁 [dir name]`: Select a directory to navigate into it and continue navigating with the CLI. 
- `📄 [file name]`: Select file to open with VS code. 

## Future Work
- Add flag handling for --help and --version.
- Better UX option for `Stay Here` feature to replace copy to clipboard. 
- Hot key integration for searching files/directories by starting letter to enhance navigation and reduce up/down arrow clicks.
- More programs to open files with, or perhaps allow users to select which program to open with. 
- Clean up console after opening file.
- Open to feature suggestions.