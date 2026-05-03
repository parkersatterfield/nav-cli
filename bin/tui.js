import process from 'process';

const ANSI = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  inverse: '\x1b[7m',
  cyan: '\x1b[36m',
};

const DEFAULT_SHORTCUTS = 'up/down move | enter open | tab actions | ^o open | ^y copy | esc quit';

export const HEADER_HEIGHT = 2;
export const FOOTER_HEIGHT = 2;
export const LIST_START_ROW = HEADER_HEIGHT + 1;

const buildCountLabel = ({ totalCount = null, filteredCount, filterText = '' } = {}) => {
  if (totalCount === null) return '';

  if (filterText) {
    return `${filteredCount}/${totalCount} shown`;
  }

  return `${totalCount} item${totalCount === 1 ? '' : 's'}`;
};

export const getMaxVisibleRows = (rows) => Math.max(1, rows - HEADER_HEIGHT - FOOTER_HEIGHT);

export const buildHeaderModel = (text, meta = {}, cols = 80) => {
  const {
    totalCount = null,
    filteredCount = totalCount ?? 0,
    filterText = '',
    headerHint = '',
  } = meta;

  const countLabel = buildCountLabel({ totalCount, filteredCount, filterText });
  const statusLabel = headerHint || '';
  const statusText = statusLabel ? `nav ${statusLabel}` : 'nav';
  const statusWidth = countLabel
    ? Math.max(0, cols - countLabel.length - 3)
    : cols;
  const statusLine = statusWidth > 0
    ? statusText.length <= statusWidth
      ? statusText
      : `${statusText.slice(0, Math.max(0, statusWidth - 3))}...`
    : '';

  const pathPrefix = '  └── ';
  const pathWidth = Math.max(0, cols - pathPrefix.length);
  const pathLine = `${pathPrefix}${pathWidth > 0
    ? text.length <= pathWidth
      ? text
      : pathWidth <= 3
        ? '.'.repeat(pathWidth)
        : `...${text.slice(-(pathWidth - 3))}`
    : ''}`;

  return {
    countLabel,
    pathLine,
    statusLabel,
    statusLine,
  };
};

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
    return `${enterAction} | tab menu`;
  }

  renderHeader(text, meta = {}) {
    const {
      countLabel,
      pathLine,
      statusLabel,
      statusLine,
    } = buildHeaderModel(text, meta, this.cols);

    this.moveTo(1, 1);
    process.stdout.write('\x1b[2K');
    process.stdout.write(`${ANSI.inverse}${ANSI.bold} nav ${ANSI.reset}`);

    const statusContent = statusLine.startsWith('nav ')
      ? statusLine.slice('nav '.length)
      : statusLabel;
    if (statusContent) {
      process.stdout.write(` ${ANSI.dim}${statusContent}${ANSI.reset}`);
    }

    if (countLabel) {
      const countColumn = Math.max(1, this.cols - countLabel.length + 1);
      this.moveTo(1, countColumn);
      process.stdout.write(`${ANSI.dim}${countLabel}${ANSI.reset}`);
    }

    this.moveTo(2, 1);
    process.stdout.write('\x1b[2K');
    process.stdout.write(`${ANSI.cyan}${ANSI.bold}${pathLine.slice(0, 6)}${ANSI.reset}${ANSI.cyan}${ANSI.bold}${pathLine.slice(6)}${ANSI.reset}`);
  }

  renderList(items, selectedIdx) {
    const maxVisible = getMaxVisibleRows(this.rows);

    if (selectedIdx < this.scrollOffset) {
      this.scrollOffset = selectedIdx;
    } else if (selectedIdx >= this.scrollOffset + maxVisible) {
      this.scrollOffset = selectedIdx - maxVisible + 1;
    }

    const visible = items.slice(this.scrollOffset, this.scrollOffset + maxVisible);

    for (let i = 0; i < maxVisible; i++) {
      const row = LIST_START_ROW + i;
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
      const prefix = isSelected
        ? `${ANSI.cyan}${ANSI.bold}›${ANSI.reset} `
        : '  ';
      const hint = isSelected ? this.getActiveHint(item) : '';
      const hintStart = hint ? this.cols - hint.length + 1 : 0;
      const maxLabelWidth = hint && hintStart > 6
        ? hintStart - 4
        : this.cols - 2;
      const truncated = this.truncateFromEnd(label, Math.max(0, maxLabelWidth));
      process.stdout.write(`${prefix}${this.styleItem(item, truncated, isSelected)}`);

      if (hint && hintStart > truncated.length + 5) {
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
    process.stdout.write(`${ANSI.cyan}${ANSI.bold}${promptLabel}${ANSI.reset} ${filterValue}`);
  }
}
