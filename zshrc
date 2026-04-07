# Enable Powerlevel10k instant prompt (must stay at top)
if [[ -r "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh" ]]; then
  source "${XDG_CACHE_HOME:-$HOME/.cache}/p10k-instant-prompt-${(%):-%n}.zsh"
fi

# ── Zinit ─────────────────────────────────────────────────────────────────────
# Single plugin manager — no oh-my-zsh overhead
ZINIT_HOME="${XDG_DATA_HOME:-${HOME}/.local/share}/zinit/zinit.git"
[ ! -d "$ZINIT_HOME" ] && mkdir -p "$(dirname $ZINIT_HOME)"
[ ! -d "$ZINIT_HOME/.git" ] && git clone https://github.com/zdharma-continuum/zinit.git "$ZINIT_HOME"
source "${ZINIT_HOME}/zinit.zsh"

# ── Theme ─────────────────────────────────────────────────────────────────────
zinit ice depth=1
zinit light romkatv/powerlevel10k

# ── Plugins (turbo-loaded for fast startup) ───────────────────────────────────
zinit wait lucid for \
  atinit"zicompinit; zicdreplay" \
    zdharma-continuum/fast-syntax-highlighting \
  atload"_zsh_autosuggest_start" \
    zsh-users/zsh-autosuggestions \
  blockf atpull"zinit creinstall -q ." \
    zsh-users/zsh-completions \
    zsh-users/zsh-history-substring-search \
    Aloxaf/fzf-tab \
    wfxr/forgit

# ── Completions ───────────────────────────────────────────────────────────────
zstyle ':completion:*' matcher-list 'm:{a-z}={A-Za-z}'
zstyle ':completion:*' list-colors "${(s.:.)LS_COLORS}"
zstyle ':fzf-tab:complete:cd:*' fzf-preview 'ls --color=always $realpath'

# ── History ───────────────────────────────────────────────────────────────────
HISTSIZE=50000
SAVEHIST=50000
HISTFILE=~/.zsh_history
setopt HIST_VERIFY SHARE_HISTORY APPEND_HISTORY INC_APPEND_HISTORY
setopt HIST_IGNORE_DUPS HIST_IGNORE_ALL_DUPS HIST_REDUCE_BLANKS HIST_IGNORE_SPACE
setopt HIST_FIND_NO_DUPS HIST_SAVE_NO_DUPS

# ── Key bindings ──────────────────────────────────────────────────────────────
bindkey '^[[A' history-substring-search-up
bindkey '^[[B' history-substring-search-down
bindkey '^P'   history-substring-search-up
bindkey '^N'   history-substring-search-down

# ── Directory jumping (z) ────────────────────────────────────────────────────
[[ -f /opt/homebrew/etc/profile.d/z.sh ]] && . /opt/homebrew/etc/profile.d/z.sh

# ── Environment ───────────────────────────────────────────────────────────────
export EDITOR='cursor'
export VISUAL='cursor'
export NODE_OPTIONS="--max-old-space-size=8192"
export FZF_DEFAULT_OPTS='--height 40% --layout=reverse --border'

# ── PATH ──────────────────────────────────────────────────────────────────────
export PATH="$HOME/.local/bin:$PATH"
export PATH="/opt/homebrew/opt/pcsc-lite/bin:$PATH"

# pnpm
export PNPM_HOME="$HOME/Library/pnpm"
case ":$PATH:" in
  *":$PNPM_HOME:"*) ;;
  *) export PATH="$PNPM_HOME:$PATH" ;;
esac

# ── nvm (lazy-loaded to avoid 200ms+ startup penalty) ────────────────────────
export NVM_DIR="$HOME/.nvm"
nvm() {
  unset -f nvm node npm npx pnpm
  [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
  nvm "$@"
}
node()  { unset -f nvm node npm npx pnpm; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; node "$@"; }
npm()   { unset -f nvm node npm npx pnpm; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npm "$@"; }
npx()   { unset -f nvm node npm npx pnpm; [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"; npx "$@"; }

# Auto-switch node version on directory change
autoload -U add-zsh-hook
load-nvmrc() {
  [ -s "$NVM_DIR/nvm.sh" ] || return
  unset -f nvm node npm npx 2>/dev/null
  . "$NVM_DIR/nvm.sh"
  local nvmrc_path="$(nvm_find_nvmrc)"
  if [ -n "$nvmrc_path" ]; then
    local nvmrc_node_version=$(nvm version "$(cat "$nvmrc_path")")
    if [ "$nvmrc_node_version" = "N/A" ]; then
      nvm install > /dev/null 2>&1
    elif [ "$nvmrc_node_version" != "$(nvm version)" ]; then
      nvm use > /dev/null 2>&1
    fi
  elif [ -n "$(PWD=$OLDPWD nvm_find_nvmrc)" ] && [ "$(nvm version)" != "$(nvm version default)" ]; then
    nvm use default > /dev/null 2>&1
  fi
}
add-zsh-hook chpwd load-nvmrc

# ── Aliases ───────────────────────────────────────────────────────────────────
# Navigation
alias ..='cd ..'
alias ...='cd ../..'
alias ....='cd ../../..'
alias ll='ls -alF'
alias la='ls -A'

# Git
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git pull'
alias gd='git diff'
alias gb='git branch'
alias gco='git checkout'
alias gcb='git checkout -b'
alias glog='git log --oneline --graph --decorate -20'

# pnpm (primary package manager)
alias pi='pnpm install'
alias pa='pnpm add'
alias pad='pnpm add -D'
alias pr='pnpm run'
alias pd='pnpm dev'
alias pb='pnpm build'
alias pt='pnpm test'
alias px='pnpm dlx'

# npm (fallback)
alias ni='npm install'
alias nr='npm run'
alias nb='npm run build'
alias nt='npm test'

# Docker (via OrbStack)
alias dc='docker compose'
alias dcu='docker compose up'
alias dcd='docker compose down'
alias dcl='docker compose logs'

# Supabase
alias sb='supabase'
alias sbr='supabase db reset'
alias sbss='supabase stop && supabase start'

# Editor
alias c='cursor'
alias c.='cursor .'

# ── Local overrides ──────────────────────────────────────────────────────────
[[ -f ~/.zshrc.local ]] && source ~/.zshrc.local

# ── Powerlevel10k config ─────────────────────────────────────────────────────
[[ -f ~/.p10k.zsh ]] && source ~/.p10k.zsh

# ── Tool completions (conditional) ───────────────────────────────────────────
[[ -f "$HOME/.openclaw/completions/openclaw.zsh" ]] && source "$HOME/.openclaw/completions/openclaw.zsh"
