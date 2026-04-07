# Fresh Press

A fresh brew for your fresh machine. Terraforms a bare macOS install into a fully configured dev environment via an interactive TUI.

## Quickstart

On a brand new Mac with nothing installed:

```bash
# One-liner bootstrap (installs xcode tools, brew, nvm, node, pnpm, then launches TUI)
MACHINE_RESTORE_REPO=https://github.com/mrprkr/fresh-press.git \
  bash <(curl -fsSL https://raw.githubusercontent.com/mrprkr/fresh-press/main/bootstrap.sh)

# — or clone first, then bootstrap —
git clone https://github.com/mrprkr/fresh-press.git ~/Developer/fresh-press
cd ~/Developer/fresh-press
./bootstrap.sh
```

## If you already have Node.js

```bash
cd ~/Developer/fresh-press
pnpm install
pnpm start
```

## Restore phases

The TUI runs steps in dependency order across 5 phases:

| Phase | What it does |
|-------|-------------|
| **Foundation** | Rosetta 2, Homebrew taps, directory structure |
| **Accounts & Auth** | 1Password + CLI, git identity, GitHub CLI auth |
| **Dev Environment** | Formulae, nvm/Node.js, global packages, shell, editor extensions |
| **Applications** | GUI apps via casks, Docker/OrbStack |
| **Preferences** | Dock, Finder, dark mode, keyboard, trackpad |

## What's included

| Source | Contents |
|--------|----------|
| `config/taps.txt` | Homebrew taps |
| `config/formulae.txt` | CLI tools and libraries |
| `config/casks.txt` | GUI applications |
| `config/pnpm-globals.txt` | Global pnpm packages |
| `config/uv-tools.txt` | Python CLI tools |
| `config/cursor-extensions.txt` | Cursor/VS Code extensions |
| `config/iterm2-profile.json` | iTerm2 colors, font, and terminal settings |
| `config/claude-code-settings.json` | Claude Code plugins and preferences |
| `config/p10k.zsh` | Powerlevel10k prompt config |
| `zshrc` | Zinit + Powerlevel10k + aliases |
| `Brewfile` | Declarative `brew bundle` alternative |

## Customizing

Edit the `config/*.txt` files to add or remove packages. Each file is a simple
newline-separated list with `#` comments. The TUI reads them at runtime.

## Updating your snapshot

```bash
brew list --formula > config/formulae.txt
brew list --cask > config/casks.txt
brew tap > config/taps.txt
cursor --list-extensions | sort -u > config/cursor-extensions.txt
```

Then review and re-add comments/grouping as needed.
