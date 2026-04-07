# Machine Restore

Terraforms a fresh macOS install into a fully configured dev environment.
Safe to host publicly — no secrets, credentials, or personal data.

## Fresh machine quickstart

On a brand new Mac with nothing installed:

```bash
# One-liner bootstrap (installs xcode tools, brew, node, pnpm, then launches TUI)
curl -fsSL https://raw.githubusercontent.com/<user>/<repo>/main/bootstrap.sh | bash

# — or clone first, then bootstrap —
git clone <repo-url> ~/Developer/machine-restore
cd ~/Developer/machine-restore
./bootstrap.sh
```

## If you already have Node.js

```bash
cd ~/Developer/machine-restore
pnpm install
pnpm start
```

## Restore phases

The TUI runs steps in dependency order across 5 phases:

| # | Phase | What it does |
|---|-------|-------------|
| 1 | **Foundation** | Rosetta 2, Homebrew taps, ~/Developer directory |
| 2 | **Accounts & Auth** | 1Password + CLI, git identity, GitHub CLI auth |
| 3 | **Dev Environment** | Formulae, nvm/Node.js, global packages, shell, editor extensions |
| 4 | **Applications** | GUI apps via casks, Docker/OrbStack |
| 5 | **Preferences** | Dock, Finder, dark mode, keyboard, trackpad |

## What's included

| Source | Contents |
|--------|----------|
| `config/taps.txt` | 7 Homebrew taps |
| `config/formulae.txt` | ~70 CLI tools and libraries |
| `config/casks.txt` | ~35 GUI applications |
| `config/pnpm-globals.txt` | Global pnpm packages |
| `config/npm-globals.txt` | Global npm packages |
| `config/uv-tools.txt` | Python CLI tools |
| `config/cursor-extensions.txt` | ~55 Cursor/VS Code extensions |
| `zshrc` | Oh My Zsh + Zinit + Powerlevel10k + aliases |
| `Brewfile` | Declarative `brew bundle` alternative |
| `dock-apps.txt` | Dock layout reference |

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

## Manual steps after restore

1. Install non-brew apps: Stunt Double, Ableton Live 12 Suite, Adobe Lightroom
2. `tailscale up`
3. Import GPG keys from backup
4. `p10k configure`
5. Arrange Dock (see `dock-apps.txt`)
