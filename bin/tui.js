import process from 'process';

export class TUI {
  constructor() {
    this.rows = process.stdout.rows || 24;
    this.cols = process.stdout.columns || 80;
    this.scrollOffset = 0;
    this.filterText = '';
    this._active = false;
    this._onResize = () => {
      this.rows = process.stdout.rows || 24;
      this.cols = process.stdout.columns || 80;
    };
  }

  enter() {
    this._active = true;
    process.stdout.write('\x1b[?1049h'); // enter alternate screen
    process.stdout.write('\x1b[?25l');   // hide cursor
    process.stdout.on('resize', this._onResize);
  }

  exit() {
    if (!this._active) return;
    this._active = false;
    process.stdout.removeListener('resize', this._onResize);
    process.stdout.write('\x1b[?25h');   // show cursor
    process.stdout.write('\x1b[?1049l'); // exit alternate screen
  }

  clearScreen() {
    process.stdout.write('\x1b[2J\x1b[H');
  }

  moveTo(row, col) {
    process.stdout.write(`\x1b[${row};${col}H`);
  }

  clearLine(row) {
    this.moveTo(row, 1);
    process.stdout.write('\x1b[2K');
  }

  renderHeader(text) {
    this.moveTo(1, 1);
    process.stdout.write('\x1b[2K');
    const truncated = text.length > this.cols - 4
      ? '...' + text.slice(-(this.cols - 7))
      : text;
    process.stdout.write(`📂 ${truncated}`);
  }

  renderList(items, selectedIdx) {
    const maxVisible = Math.max(1, this.rows - 2);

    if (selectedIdx < this.scrollOffset) {
      this.scrollOffset = selectedIdx;
    } else if (selectedIdx >= this.scrollOffset + maxVisible) {
      this.scrollOffset = selectedIdx - maxVisible + 1;
    }

    const visible = items.slice(this.scrollOffset, this.scrollOffset + maxVisible);

    for (let i = 0; i < maxVisible; i++) {
      const row = 2 + i;
      this.moveTo(row, 1);
      process.stdout.write('\x1b[2K');
      const item = visible[i];
      if (!item) continue;

      const absoluteIdx = this.scrollOffset + i;
      const isSelected = absoluteIdx === selectedIdx;
      const label = typeof item === 'string' ? item : item.name || String(item);
      const display = `  ${label}`;

      if (isSelected) {
        process.stdout.write(`\x1b[7m${display}\x1b[0m`);
      } else {
        process.stdout.write(display);
      }
    }

    if (items.length > maxVisible) {
      const indicator = `[${selectedIdx + 1}/${items.length}]`;
      this.moveTo(this.rows - 1, this.cols - indicator.length);
      process.stdout.write(indicator);
    }
  }

  renderFilterInput(text) {
    const row = this.rows;
    this.moveTo(row, 1);
    process.stdout.write('\x1b[2K');
    process.stdout.write(`> ${text}`);
  }
}
