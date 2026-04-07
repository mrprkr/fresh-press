# Machine Restore

Terraforms a fresh macOS install to match my dev environment.

## Quick start

```bash
# Clone this repo
git clone <repo-url> ~/Developer/machine-restore
cd ~/Developer/machine-restore

# Option A: Interactive TUI (recommended)
pnpm install
pnpm start

# Option B: Headless shell script
chmod +x restore.sh
./restore.sh

# Option C: Just Homebrew packages (declarative)
brew bundle --file=Brewfile
```

## What's included

| Category | Method |
|----------|--------|
| Homebrew taps, formulae, casks | `Brewfile` + TUI/`restore.sh` |
| Shell config (oh-my-zsh, zinit, p10k, aliases) | `zshrc` |
| Node.js via nvm | TUI/`restore.sh` |
| Global pnpm/npm packages | TUI/`restore.sh` |
| Python tools via uv | TUI/`restore.sh` |
| Cursor extensions | TUI/`restore.sh` |
| macOS preferences (dock, dark mode, finder) | TUI/`restore.sh` |
| Dock app layout reference | `dock-apps.txt` |

## TUI

The interactive TUI (`pnpm start`) lets you:
- Select/deselect individual restore steps
- Toggle all steps at once
- See real-time progress with spinners
- Review failures and manual steps at the end

Built with [Ink](https://github.com/vadimdemedes/ink) (React for CLI).

## Manual steps after restore

1. Sign into 1Password, Google, iCloud
2. Sign into Slack, Linear, Figma
3. `tailscale up`
4. Import GPG keys
5. `p10k configure`
6. Install non-brew apps: Stunt Double, Ableton Live 12 Suite, Adobe Lightroom
7. Restore Dock layout from `dock-apps.txt`

## Updating

Re-snapshot your current machine:

```bash
brew list --formula > formulae.txt
brew list --cask > casks.txt
brew tap > taps.txt
cursor --list-extensions > extensions.txt
```

Then update `Brewfile`, `src/steps.ts`, and `zshrc` accordingly.
