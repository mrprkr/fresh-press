#!/bin/bash
set -euo pipefail

# ============================================================================
# Machine Restore Script
# Terraforms a fresh macOS install with a configured dev environment
# Last snapshot: 2026-04-07
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

step() { echo -e "\n${BLUE}▸ $1${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
fail() { echo -e "${RED}  ✗ $1${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="$SCRIPT_DIR/restore-$(date +%Y%m%d-%H%M%S).log"

exec > >(tee -a "$LOG_FILE") 2>&1

# ============================================================================
# Pre-flight
# ============================================================================
step "Pre-flight checks"

if [[ "$(uname -s)" != "Darwin" ]]; then
  fail "This script is for macOS only"
  exit 1
fi

ARCH="$(uname -m)"
ok "macOS detected (${ARCH})"

# Accept Xcode CLI tools license / install
if ! xcode-select -p &>/dev/null; then
  step "Installing Xcode Command Line Tools"
  xcode-select --install
  echo "Press enter once the install finishes..."
  read -r
fi
ok "Xcode CLI tools ready"

# ============================================================================
# Homebrew
# ============================================================================
step "Installing Homebrew"

if ! command -v brew &>/dev/null; then
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [[ "$ARCH" == "arm64" ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
  else
    eval "$(/usr/local/bin/brew shellenv)"
  fi
fi
ok "Homebrew installed"

brew update
brew upgrade

# ============================================================================
# Taps
# ============================================================================
step "Adding Homebrew taps"

TAPS=(
  antoniorodr/memo
  arthur-ficial/tap
  homebrew/cask-fonts
  michidk/tools
  openhue/cli
  steipete/tap
  stripe/stripe-cli
  supabase/tap
)

for tap in "${TAPS[@]}"; do
  brew tap "$tap" 2>/dev/null || warn "Failed to tap $tap"
done
ok "Taps configured"

# ============================================================================
# Formulae (CLI tools & libraries)
# ============================================================================
step "Installing Homebrew formulae"

FORMULAE=(
  # Core tools
  git
  gh
  curl
  wget
  ripgrep
  fzf
  z

  # Languages & runtimes (node managed via nvm)
  nvm
  python@3.13
  uv

  # JS/TS ecosystem
  pnpm
  nx
  typescript
  typescript-language-server
  swc

  # Cloud & infra
  cloudflare-wrangler
  supabase
  stripe
  vercel-cli
  tailscale
  gnupg

  # Container & dev tools
  act
  devcontainer
  docker-completion
  vscode-langservers-extracted
  yamllint
  platformio

  # Media & image processing
  ffmpeg
  imagemagick
  whisper-cpp

  # ML
  mlx

  # Custom tap formulae
  memo
  goplaces
  himalaya
  imessage-exporter
  imsg
  mcp-publisher
  openhue-cli
  peekaboo
  remindctl
  rmrfrs
  sag
  songsee
  summarize
  svg2png
  vscli
  wacli
  autocode
  gemini-cli
)

for formula in "${FORMULAE[@]}"; do
  brew install "$formula" 2>/dev/null || warn "Failed to install formula: $formula"
done
ok "Formulae installed"

# ============================================================================
# Casks (GUI applications)
# ============================================================================
step "Installing Homebrew casks"

CASKS=(
  # Essentials
  1password
  1password-cli
  arc
  busycal
  google-chrome
  google-drive
  iterm2
  raycast
  slack

  # Dev tools
  claude
  claude-code
  codex
  cursor-cli
  orbstack
  postico
  figma

  # Productivity
  linear-linear
  bartender
  betterdisplay
  the-unarchiver

  # Communication
  whatsapp

  # Hardware & AV
  elgato-control-center
  elgato-stream-deck
  presonus-universal-control
  qmk-toolbox

  # Cloud
  cloudflare-warp
  gcloud-cli
  tailscale-app

  # Media
  vlc
  rotato

  # Fonts
  font-meslo-lg-nerd-font
)

for cask in "${CASKS[@]}"; do
  brew install --cask "$cask" 2>/dev/null || warn "Failed to install cask: $cask"
done
ok "Casks installed"

# ============================================================================
# Homebrew services
# ============================================================================
step "Registering Homebrew services (not starting)"
ok "Services available: tailscale (start manually as needed)"

# ============================================================================
# Node.js via nvm
# ============================================================================
step "Configuring Node.js via nvm"

export NVM_DIR="$HOME/.nvm"
mkdir -p "$NVM_DIR"
[ -s "$(brew --prefix)/opt/nvm/nvm.sh" ] && . "$(brew --prefix)/opt/nvm/nvm.sh"

nvm install 22
nvm alias default 22
ok "Node.js v22 set as default"

# ============================================================================
# Global pnpm packages
# ============================================================================
step "Installing global pnpm packages"

PNPM_GLOBALS=(
  clawdhub
  clawhub
  mcporter
  node-gyp
  openclaw
)

for pkg in "${PNPM_GLOBALS[@]}"; do
  pnpm add -g "$pkg" 2>/dev/null || warn "Failed to install pnpm global: $pkg"
done
ok "pnpm globals installed"

# ============================================================================
# Global npm packages
# ============================================================================
step "Installing global npm packages"

NPM_GLOBALS=(
  @figma/code-connect
  agent-browser
  clawdbot
)

for pkg in "${NPM_GLOBALS[@]}"; do
  npm install -g "$pkg" 2>/dev/null || warn "Failed to install npm global: $pkg"
done
ok "npm globals installed"

# ============================================================================
# Python tools (via uv)
# ============================================================================
step "Installing Python tools via uv"

uv tool install nano-pdf 2>/dev/null || warn "Failed to install nano-pdf"
ok "Python tools installed"

# ============================================================================
# Cursor / VS Code extensions
# ============================================================================
step "Installing Cursor extensions"

EXTENSIONS=(
  1password.op-vscode
  aaron-bond.better-comments
  alefragnani.bookmarks
  anthropic.claude-code
  anysphere.remote-containers
  anysphere.remote-ssh
  arcanis.vscode-zipfs
  bradlc.vscode-tailwindcss
  bungcip.better-toml
  christian-kohler.npm-intellisense
  christian-kohler.path-intellisense
  davidanson.vscode-markdownlint
  davidgomes.platformio-ide-cursor
  dbaeumer.vscode-eslint
  docker.docker
  donjayamanne.githistory
  editorconfig.editorconfig
  emmanuelbeziat.vscode-great-icons
  esbenp.prettier-vscode
  formulahendry.auto-close-tag
  formulahendry.auto-rename-tag
  github.vscode-github-actions
  github.vscode-pull-request-github
  gruntfuggly.todo-tree
  gydunhn.javascript-essentials
  gydunhn.typescript-essentials
  gydunhn.vsc-essentials-core
  hamza-aziane.obsidian-dark
  ibm.output-colorizer
  ionutvmi.path-autocomplete
  knisterpeter.vscode-github
  llvm-vs-code-extensions.vscode-clangd
  manuth.eslint-language-service
  mattpocock.ts-error-translator
  mechatroner.rainbow-csv
  mhutchie.git-graph
  mikestead.dotenv
  ms-azuretools.vscode-containers
  ms-azuretools.vscode-docker
  ms-playwright.playwright
  ms-vscode.hexeditor
  ms-vscode.vscode-typescript-next
  mtxr.sqltools
  mtxr.sqltools-driver-pg
  nrwl.angular-console
  oderwat.indent-rainbow
  redhat.vscode-yaml
  rvest.vs-code-prettier-eslint
  sanjulaganepola.github-local-actions
  steoates.autoimport
  tamasfe.even-better-toml
  typescriptteam.native-preview
  usernamehw.errorlens
  vincaslt.highlight-matching-tag
  xabikos.javascriptsnippets
  yoavbls.pretty-ts-errors
  yzhang.markdown-all-in-one
  zardoy.ts-essential-plugins
)

if command -v cursor &>/dev/null; then
  for ext in "${EXTENSIONS[@]}"; do
    cursor --install-extension "$ext" 2>/dev/null || warn "Failed: $ext"
  done
  ok "Cursor extensions installed"
else
  warn "Cursor CLI not found — extensions skipped"
fi

# ============================================================================
# Oh My Zsh + Zinit + Powerlevel10k
# ============================================================================
step "Setting up shell environment"

# Oh My Zsh
if [[ ! -d "$HOME/.oh-my-zsh" ]]; then
  sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
fi
ok "Oh My Zsh installed"

# Oh My Zsh plugins (not bundled by default)
ZSH_CUSTOM="${ZSH_CUSTOM:-$HOME/.oh-my-zsh/custom}"
[[ -d "$ZSH_CUSTOM/plugins/zsh-autosuggestions" ]] || \
  git clone https://github.com/zsh-users/zsh-autosuggestions "$ZSH_CUSTOM/plugins/zsh-autosuggestions"
[[ -d "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting" ]] || \
  git clone https://github.com/zsh-users/zsh-syntax-highlighting "$ZSH_CUSTOM/plugins/zsh-syntax-highlighting"
ok "Zsh plugins cloned"

# Zinit will self-install on first zshrc source — no manual step needed
ok "Zinit + Powerlevel10k will bootstrap on first shell launch"

# ============================================================================
# .zshrc
# ============================================================================
step "Installing .zshrc"

if [[ -f "$HOME/.zshrc" ]]; then
  cp "$HOME/.zshrc" "$HOME/.zshrc.backup-$(date +%Y%m%d-%H%M%S)"
  warn "Existing .zshrc backed up"
fi

cp "$SCRIPT_DIR/zshrc" "$HOME/.zshrc"
ok ".zshrc installed"

# ============================================================================
# macOS defaults
# ============================================================================
step "Applying macOS preferences"

# Dock
defaults write com.apple.dock autohide -bool true
defaults write com.apple.dock tilesize -int 37
# show-recents not set = macOS default (shown)

# Finder
defaults write com.apple.finder AppleShowAllExtensions -bool true

# Dark mode
defaults write NSGlobalDomain AppleInterfaceStyle -string "Dark"

# Restart dock to apply
killall Dock 2>/dev/null || true

ok "macOS preferences applied"

# ============================================================================
# Directories
# ============================================================================
step "Creating directory structure"

mkdir -p "$HOME/Developer"
ok "~/Developer ready"

# ============================================================================
# fzf keybindings
# ============================================================================
step "Installing fzf keybindings"
"$(brew --prefix)/opt/fzf/install" --key-bindings --completion --no-update-rc --no-bash --no-fish 2>/dev/null || true
ok "fzf configured"

# ============================================================================
# Done
# ============================================================================
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Machine restore complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Manual steps remaining:"
echo "  1. Sign into 1Password, Google, iCloud"
echo "  2. Sign into Slack, Linear, Figma"
echo "  3. Configure Tailscale: tailscale up"
echo "  4. Import GPG keys from backup"
echo "  5. Run 'p10k configure' to set up Powerlevel10k prompt"
echo "  6. Install apps not in Homebrew: Stunt Double,"
echo "     Ableton Live 12 Suite, Adobe Lightroom"
echo "  7. Restore Dock layout (see dock-apps.txt)"
echo "  8. Open a new terminal to load the shell config"
echo ""
echo "Log saved to: $LOG_FILE"
