const USAGE_TEXT = `Usage: nav [h|f]

Navigate your filesystem interactively.

Commands:
  nav      Start browsing from the current working directory
  nav h    Start browsing from your configured home directory
  nav f    Choose from your saved favorite directories

Options:
  -h, --help  Show this help message

Hotkeys:
  Tab       Open actions for the highlighted target
  Ctrl+O    Open the highlighted target in an editor
  Ctrl+Y    Copy a cd command for the current directory

If home or favorites are not configured, nav falls back to the current directory and
shows guidance inside the interface.`;

export const getUsageText = () => USAGE_TEXT;

export const parseArgs = (args) => {
  if (args.includes('--help') || args.includes('-h')) {
    return { kind: 'help' };
  }

  if (args.length === 0) {
    return { kind: 'run', mode: 'default' };
  }

  if (args.length === 1 && args[0] === 'h') {
    return { kind: 'run', mode: 'home' };
  }

  if (args.length === 1 && args[0] === 'f') {
    return { kind: 'run', mode: 'favorites' };
  }

  return { kind: 'invalid' };
};
