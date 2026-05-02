import process from 'process';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  inverse: '\x1b[7m',
};

const DEFAULT_SHORTCUTS = '↑↓ move | type filter | esc quit';

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

  truncateFromStart(text, width) {
    if (width <= 0) return '';
    if (text.length <= width) return text;
    if (width <= 3) return '.'.repeat(width);
    return `...${text.slice(-(width - 3))}`;
  }

  truncateFromEnd(text, width) {
    if (width <= 0) return '';
    if (text.length <= width) return text;
    if (width <= 3) return '.'.repeat(width);
    return `${text.slice(0, width - 3)}...`;
  }

  styleItem(item, label, isSelected) {
    if (!isSelected) {
      return `${ANSI.dim}${label}${ANSI.reset}`;
    }

    return `${ANSI.bold}${label}${ANSI.reset}`;
  }

  getItemLabel(item) {
    if (typeof item === 'string') return item;
    return item?.label ?? '';
  }

  getActiveHint(item) {
    if (!item?.kind) return '';

    const enterAction = item.kind === 'directory' ? 'enter browse' : 'enter open';
    return `${enterAction} | ← back /`;
  }

  renderHeader(text, meta = {}) {
    const {
      totalCount = null,
      filteredCount = totalCount ?? 0,
      filterText = '',
      headerHint = '',
    } = meta;

    this.moveTo(1, 1);
    process.stdout.write('\x1b[2K');

    const countLabel = totalCount === null
      ? ''
      : filterText
        ? `${filteredCount}/${totalCount} shown`
        : `${totalCount} item${totalCount === 1 ? '' : 's'}`;
    const prefix = `${ANSI.inverse}${ANSI.bold} nav ${ANSI.reset} `;
    const hintText = headerHint ? ` | ${headerHint}` : '';
    const availablePathWidth = Math.max(
      0,
      this.cols - countLabel.length - hintText.length - (countLabel ? 8 : 6),
    );
    const truncated = this.truncateFromStart(text, availablePathWidth);
    process.stdout.write(`${prefix}${ANSI.bold}${truncated}${ANSI.reset}`);

    if (hintText) {
      process.stdout.write(`${ANSI.dim}${hintText}${ANSI.reset}`);
    }

    if (countLabel) {
      const countColumn = Math.max(1, this.cols - countLabel.length + 1);
      this.moveTo(1, countColumn);
      process.stdout.write(`${ANSI.dim}${countLabel}${ANSI.reset}`);
    }
  }

  renderList(items, selectedIdx) {
    const maxVisible = Math.max(1, this.rows - 3);

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
      if (!item) {
        if (items.length === 0 && i === 0) {
          process.stdout.write(`${ANSI.dim}  No matches. Keep typing or backspace to broaden the search.${ANSI.reset}`);
        }
        continue;
      }

      const absoluteIdx = this.scrollOffset + i;
      const isSelected = absoluteIdx === selectedIdx;
      const label = this.getItemLabel(item);
      const prefix = isSelected ? '› ' : '  ';
      const hint = isSelected ? this.getActiveHint(item) : '';
      const hintStart = hint ? this.cols - hint.length + 1 : 0;
      const maxLabelWidth = hint && hintStart > prefix.length + 4
        ? hintStart - prefix.length - 3
        : this.cols - prefix.length;
      const truncated = this.truncateFromEnd(label, Math.max(0, maxLabelWidth));
      process.stdout.write(`${prefix}${this.styleItem(item, truncated, isSelected)}`);

      if (hint && hintStart > prefix.length + truncated.length + 2) {
        this.moveTo(row, hintStart);
        process.stdout.write(`${ANSI.dim}${hint}${ANSI.reset}`);
      }
    }

  }

  renderFooter({
    filterText,
    helpText = DEFAULT_SHORTCUTS,
    promptLabel = 'Search',
    placeholder = 'Type to filter the current folder',
  }) {
    const helpRow = this.rows - 1;
    const inputRow = this.rows;
    const helpLine = this.truncateFromEnd(helpText, this.cols);
    const filterValue = filterText || `${ANSI.dim}${placeholder}${ANSI.reset}`;

    this.moveTo(helpRow, 1);
    process.stdout.write('\x1b[2K');
    process.stdout.write(`${ANSI.dim}${helpLine}${ANSI.reset}`);

    this.moveTo(inputRow, 1);
    process.stdout.write('\x1b[2K');
    process.stdout.write(`${ANSI.bold}${promptLabel}${ANSI.reset} ${filterValue}`);
  }
}
