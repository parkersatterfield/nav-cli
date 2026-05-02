# nav-cli 🚀 [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`Nav` is an open-source Node.js CLI tool designed to improve productivity and developer experience by simplifying file system navigation. `Nav` improves on the standard command line navigation by simplifying it into a seamless, interactive experience. As a developer myself, this tool has become a critical part of my workflow.

- **NPM**: [nav-cli](https://www.npmjs.com/package/nav-cli)
- **GitHub**: [nav-cli](https://github.com/parkersatterfield/nav-cli)
- **Product Hunt**: [nav-cli](https://www.producthunt.com/posts/nav-cli)


## ✨ Features
- **Interactive Navigation**: Use arrow keys to browse directories and files. Type to filter in the current working directory for easy fuzzy finding. 
- **Quick Editor Access**: Open files in your favorite editor with an explicit picker (VS Code, IntelliJ, or Notepad).
- **Clipboard Integration**: Automatically generate and copy `cd` commands for seamless navigation across sessions.
- **Search Functionality**: Filter files and directories in real-time as you type.
- **Cross-Platform**: Works on Windows, macOS, and Linux in any shell (hopefully!).
- **Easy Install, No Setup**: One command download and works out of the box.


## 🎥 Demo (V1)
![Demo Screenshot](https://github.com/parkersatterfield/nav-cli/blob/main/public/screenshot1.png?raw=true) 
![Demo GIF](https://github.com/parkersatterfield/nav-cli/blob/main/public/demo.gif?raw=true)


## 📦 Installation
```bash
npm i -g nav-cli
```


## 🛠️ Requirements
- **Node.js** (latest LTS recommended)
- **Editor Support**: VS Code, IntelliJ, or Notepad for file opening features.


## 🚀 Usage
After installing globally via npm, simply run the `nav` command in your terminal. Here's what you can do:

- **Stay Here**: Copy the `cd` command for the current directory to your clipboard with `Ctrl + Y`.
- **Back Directory**: Use the left arrow to move to the previous directory.
- **Directory Navigation**: Press `Enter` on a directory to browse into it.
- **File Opening**: Press `Enter` on a file and choose which editor to open it with.
- **Search**: Type at any time to filter the current folder.

### Hotkeys
- **Ctrl + y**: Stay here and copy the current directory as a `cd` command.
- **Left Arrow**: Go back to the previous directory.
- **Enter**: Browse into a directory or open a file with an editor picker.
- **Escape**: Exit the application.


## 🐛 Feature Requests & Bug Reports
We welcome contributions and feedback!
- Submit issues or feature requests on [GitHub](https://github.com/parkersatterfield/nav-cli/issues).
- Reach out via [Parker Satterfield's website](https://www.parkersatterfield.com/contact).


## 🔮 Future Plans
- **Enhanced UX**: Replace clipboard-based navigation with direct shell integration.
- **Custom Editor Support**: Allow users to configure their preferred editors.
- **Favorites**: Allow users to add favorite directories as starting points to navigating.
- **More Hotkeys**: Add shortcuts for faster navigation and file selection.


## 🤝 Contributing
Contributions are welcome!


## 📜 License
This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

![Product Hunt Badge](https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=372606&theme=light)
