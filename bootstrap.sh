#!/bin/bash
set -euo pipefail

# ============================================================================
# Bootstrap — runs on a bare macOS install with NOTHING pre-installed.
# Installs just enough to hand off to the interactive TUI.
#
# Usage (from a fresh machine):
#   curl -fsSL https://raw.githubusercontent.com/<user>/<repo>/main/bootstrap.sh | bash
#   — or —
#   git clone https://github.com/<user>/<repo>.git ~/Developer/machine-restore
#   cd ~/Developer/machine-restore && ./bootstrap.sh
# ============================================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;34m'
NC='\033[0m'

step() { echo -e "\n${CYAN}▸ $1${NC}"; }
ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
fail() { echo -e "${RED}  ✗ $1${NC}"; exit 1; }

REPO_URL="${MACHINE_RESTORE_REPO:-}"
RESTORE_DIR="$HOME/Developer/machine-restore"

echo ""
echo -e "${CYAN}┌──────────────────────────────────────────┐${NC}"
echo -e "${CYAN}│       Machine Restore — Bootstrap        │${NC}"
echo -e "${CYAN}│  Installs foundations, then launches TUI  │${NC}"
echo -e "${CYAN}└──────────────────────────────────────────┘${NC}"
echo ""

# ── 1. macOS check ──────────────────────────────────────────────────────────
if [[ "$(uname -s)" != "Darwin" ]]; then
  fail "This script is for macOS only"
fi

ARCH="$(uname -m)"
ok "macOS detected ($ARCH)"

# ── 2. Xcode Command Line Tools ────────────────────────────────────────────
step "Xcode Command Line Tools"

if xcode-select -p &>/dev/null; then
  ok "Already installed"
else
  echo "  Installing Xcode CLI tools — a system dialog will appear."
  echo "  Press enter here once the install finishes..."
  xcode-select --install 2>/dev/null || true
  read -r
  if ! xcode-select -p &>/dev/null; then
    fail "Xcode CLI tools installation failed"
  fi
  ok "Installed"
fi

# ── 3. Rosetta 2 (Apple Silicon only) ──────────────────────────────────────
if [[ "$ARCH" == "arm64" ]]; then
  step "Rosetta 2"
  if /usr/bin/pgrep -q oahd 2>/dev/null; then
    ok "Already installed"
  else
    softwareupdate --install-rosetta --agree-to-license 2>/dev/null || true
    ok "Installed"
  fi
fi

# ── 4. Homebrew ─────────────────────────────────────────────────────────────
step "Homebrew"

if command -v brew &>/dev/null; then
  ok "Already installed"
else
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  if [[ "$ARCH" == "arm64" ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    # shellcheck disable=SC2016
    echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
  else
    eval "$(/usr/local/bin/brew shellenv)"
    # shellcheck disable=SC2016
    echo 'eval "$(/usr/local/bin/brew shellenv)"' >> "$HOME/.zprofile"
  fi
  ok "Installed"
fi

brew update

# ── 5. Git (may already exist via Xcode, but get the latest) ───────────────
step "Git"
brew install git 2>/dev/null || true
ok "$(git --version)"

# ── 6. Node.js via nvm + pnpm (required for TUI) ──────────────────────────
step "nvm + Node.js + pnpm"

brew install nvm 2>/dev/null || true

export NVM_DIR="$HOME/.nvm"
mkdir -p "$NVM_DIR"
# shellcheck source=/dev/null
[ -s "$(brew --prefix)/opt/nvm/nvm.sh" ] && . "$(brew --prefix)/opt/nvm/nvm.sh"

if ! command -v node &>/dev/null; then
  nvm install 22
  nvm alias default 22
fi
ok "node $(node --version) via nvm"

brew install pnpm 2>/dev/null || true
ok "pnpm $(pnpm --version)"

# ── 7. Clone / locate the restore repo ─────────────────────────────────────
step "Restore repo"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ -f "$SCRIPT_DIR/package.json" ]]; then
  # We're running from inside the repo already
  RESTORE_DIR="$SCRIPT_DIR"
  ok "Running from repo at $RESTORE_DIR"
elif [[ -d "$RESTORE_DIR/.git" ]]; then
  ok "Repo already cloned at $RESTORE_DIR"
  cd "$RESTORE_DIR" && git pull --ff-only 2>/dev/null || true
elif [[ -n "$REPO_URL" ]]; then
  mkdir -p "$HOME/Developer"
  git clone "$REPO_URL" "$RESTORE_DIR"
  ok "Cloned to $RESTORE_DIR"
else
  echo ""
  warn "No repo URL provided and not running from the repo."
  echo "  Set MACHINE_RESTORE_REPO to your repo URL, e.g.:"
  echo "    MACHINE_RESTORE_REPO=https://github.com/you/machine-restore.git ./bootstrap.sh"
  echo ""
  echo "  Or clone it manually:"
  echo "    git clone <repo-url> ~/Developer/machine-restore"
  echo "    cd ~/Developer/machine-restore && ./bootstrap.sh"
  exit 1
fi

# ── 8. Install TUI dependencies ────────────────────────────────────────────
step "Installing TUI dependencies"
cd "$RESTORE_DIR"
pnpm install --frozen-lockfile 2>/dev/null || pnpm install
ok "Dependencies ready"

# ── 9. Launch TUI ──────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Bootstrap complete — launching interactive restore...${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════════${NC}"
echo ""

exec pnpm start
