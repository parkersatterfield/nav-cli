# nav-cli [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

`nav-cli` is a keyboard-first filesystem navigator for developers. It gives you a clean terminal UI for browsing directories, opening files with an editor picker, and copying your current working directory when you want to stay put.

- **NPM**: [nav-cli](https://www.npmjs.com/package/nav-cli)
- **GitHub**: [nav-cli](https://github.com/parkersatterfield/nav-cli)
- **Product Hunt**: [nav-cli](https://www.producthunt.com/posts/nav-cli)

![nav-cli interface preview](./public/nav-cli-demo.png)

## ✨ Features
- **Clean terminal UI**: Slash-prefixed directories, plain files, and lightweight keyboard hints.
- **Fast directory browsing**: Use arrow keys to move and `Enter` to browse deeper.
- **Explicit editor picker**: Open files in VS Code, IntelliJ, or Notepad without hidden defaults.
- **Stay here flow**: Press `Ctrl + Y` to copy a ready-to-run `cd` command for the current directory.
- **Instant filtering**: Type at any time to narrow the current folder.
- **Cross-platform**: Works on Windows, macOS, and Linux in any shell.

## 📦 Installation
```bash
npm i -g nav-cli
```


## 🛠️ Requirements
- **Node.js** (latest LTS recommended)
- **Editor Support**: VS Code, IntelliJ, or Notepad for file opening features


## 🚀 Usage
After installing globally via npm, run:

```bash
nav
```

From there you can:

- **Stay Here**: Copy a ready-to-run `cd` command for the current directory with `Ctrl + Y`.
- **Back Directory**: Use the left arrow to move to the previous directory.
- **Directory Navigation**: Press `Enter` on a directory to browse into it.
- **File Opening**: Press `Enter` on a file and choose which editor to open it with.
- **Search**: Type at any time to filter the current folder.

### Hotkeys
- **Ctrl + y**: Stay here and copy a `cd` command for the current directory.
- **Left Arrow**: Go back to the previous directory.
- **Enter**: Browse into a directory or open a file with an editor picker.
- **Arrow Keys**: Move through the list.
- **Escape**: Exit the application.

## Why It Feels Fast
- **No mode switching**: browsing, filtering, and opening all happen in one screen.
- **Low-noise visuals**: directories are distinguished by `/`, not heavy color or icons.
- **Predictable actions**: `Enter` acts on the selected item, `Ctrl + Y` always means stay here.


## 🐛 Feature Requests & Bug Reports
We welcome contributions and feedback!
- Submit issues or feature requests on [GitHub](https://github.com/parkersatterfield/nav-cli/issues).
- Reach out via [Parker Satterfield's website](https://www.parkersatterfield.com/contact).


## 🔮 Future Plans
- **Enhanced UX**: Replace clipboard-based navigation with direct shell integration.
- **Custom Editor Support**: Expand editor options beyond the built-in picker.
- **Favorites**: Allow users to add favorite directories as starting points to navigating.
- **More Hotkeys**: Add shortcuts for faster navigation and file selection.


## 🤝 Contributing
Contributions are welcome!


## 📜 License
This project is licensed under the [MIT License](https://opensource.org/licenses/MIT).

---

![Product Hunt Badge](https://api.producthunt.com/widgets/embed-image/v1/featured.svg?post_id=372606&theme=light)
