import { execSync, spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export type StepStatus = 'pending' | 'running' | 'done' | 'failed' | 'skipped'

export interface Step {
  id: string
  phase: Phase
  label: string
  description: string
  run: () => Promise<void>
}

export type Phase = 'foundation' | 'accounts' | 'environment' | 'applications' | 'preferences'

export const PHASE_META: Record<Phase, { label: string; description: string }> = {
  foundation: {
    label: 'Foundation',
    description: 'Core tools that everything else depends on',
  },
  accounts: {
    label: 'Accounts & Auth',
    description: '1Password, sign-ins, and credentials',
  },
  environment: {
    label: 'Dev Environment',
    description: 'Languages, runtimes, shell, and editor',
  },
  applications: {
    label: 'Applications',
    description: 'GUI apps, casks, and services',
  },
  preferences: {
    label: 'Preferences',
    description: 'macOS settings, dock, Finder, and keybindings',
  },
}

export const PHASE_ORDER: Phase[] = [
  'foundation',
  'accounts',
  'environment',
  'applications',
  'preferences',
]

// ---------------------------------------------------------------------------
// Shell helpers
// ---------------------------------------------------------------------------
function sh(cmd: string): string {
  return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim()
}

function shSafe(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: ['pipe', 'pipe', 'pipe'] })
    return true
  } catch {
    return false
  }
}

async function shAsync(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('bash', ['-c', cmd], { stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d: Buffer) => (stdout += d.toString()))
    child.stderr.on('data', (d: Buffer) => (stderr += d.toString()))
    child.on('close', (code) => {
      if (code === 0) resolve(stdout.trim())
      else reject(new Error(`Exit ${code}: ${stderr || stdout}`))
    })
  })
}

async function shAsyncSafe(cmd: string): Promise<boolean> {
  try {
    await shAsync(cmd)
    return true
  } catch {
    return false
  }
}

// ---------------------------------------------------------------------------
// Load manifests from config files (keeps lists out of code, easy to update)
// ---------------------------------------------------------------------------
function resolveRoot(): string {
  return new URL('.', import.meta.url).pathname.replace(/\/src\/$/, '')
}

function loadList(filename: string): string[] {
  const filepath = join(resolveRoot(), 'config', filename)
  return readFileSync(filepath, 'utf-8')
    .split('\n')
    .map((l) => l.replace(/#.*$/, '').trim())
    .filter(Boolean)
}

// ---------------------------------------------------------------------------
// Step definitions — ordered by dependency, grouped by phase
// ---------------------------------------------------------------------------
export const steps: Step[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: Foundation
  // Bootstrap already handled xcode/brew/node/pnpm, but these are included
  // so the TUI can be re-run standalone and still work.
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'rosetta',
    phase: 'foundation',
    label: 'Rosetta 2',
    description: 'Install Rosetta 2 for x86 compatibility (Apple Silicon)',
    run: async () => {
      if (process.arch !== 'arm64') return
      if (shSafe('/usr/bin/pgrep -q oahd')) return
      await shAsync('softwareupdate --install-rosetta --agree-to-license')
    },
  },
  {
    id: 'taps',
    phase: 'foundation',
    label: 'Homebrew Taps',
    description: 'Add third-party tap repositories',
    run: async () => {
      const taps = loadList('taps.txt')
      for (const tap of taps) {
        await shAsyncSafe(`brew tap ${tap}`)
      }
    },
  },
  {
    id: 'directories',
    phase: 'foundation',
    label: 'Directory Structure',
    description: 'Create ~/Developer and workspace directories',
    run: async () => {
      await shAsync(`mkdir -p ${process.env.HOME}/Developer`)
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: Accounts & Auth
  // 1Password first, then services that need credentials
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: '1password',
    phase: 'accounts',
    label: '1Password',
    description: 'Install 1Password app and CLI',
    run: async () => {
      await shAsyncSafe('brew install --cask 1password')
      await shAsyncSafe('brew install --cask 1password-cli')
    },
  },
  {
    id: '1password-signin',
    phase: 'accounts',
    label: '1Password Sign-in',
    description: 'Pause for 1Password sign-in (unlocks credentials for later steps)',
    run: async () => {
      // Check if already signed in
      if (shSafe("op account list 2>/dev/null | grep -q '.'")) return
      // Can't automate — throw to surface as a manual action
      throw new Error(
        'Open 1Password, sign in, and enable CLI integration in Settings → Developer. Then re-run.',
      )
    },
  },
  {
    id: 'git-config',
    phase: 'accounts',
    label: 'Git Identity',
    description: 'Configure git user name and email',
    run: async () => {
      // Skip if already configured
      if (shSafe('git config --global user.name') && shSafe('git config --global user.email'))
        return
      throw new Error(
        "Run: git config --global user.name 'Your Name' && git config --global user.email 'you@example.com'",
      )
    },
  },
  {
    id: 'gh-auth',
    phase: 'accounts',
    label: 'GitHub CLI Auth',
    description: 'Authenticate GitHub CLI',
    run: async () => {
      if (shSafe('gh auth status')) return
      throw new Error('Run: gh auth login')
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: Dev Environment
  // Languages, runtimes, shell, editor — depends on foundation
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'formulae',
    phase: 'environment',
    label: 'Homebrew Formulae',
    description: 'Install CLI tools and libraries',
    run: async () => {
      const formulae = loadList('formulae.txt')
      const batch = formulae.join(' ')
      await shAsyncSafe(`brew install ${batch}`)
    },
  },
  {
    id: 'nvm-node',
    phase: 'environment',
    label: 'Node.js (nvm)',
    description: 'Install nvm, Node.js 22, and set as default',
    run: async () => {
      await shAsyncSafe('brew install nvm')
      const home = process.env.HOME!
      const prefix = sh('brew --prefix')
      await shAsync(`
        export NVM_DIR="${home}/.nvm"
        mkdir -p "$NVM_DIR"
        . "${prefix}/opt/nvm/nvm.sh"
        nvm install 22
        nvm alias default 22
      `)
    },
  },
  {
    id: 'pnpm-globals',
    phase: 'environment',
    label: 'Global pnpm Packages',
    description: 'Install global pnpm packages',
    run: async () => {
      const pkgs = loadList('pnpm-globals.txt')
      for (const pkg of pkgs) {
        await shAsyncSafe(`pnpm add -g ${pkg}`)
      }
    },
  },
  {
    id: 'uv-tools',
    phase: 'environment',
    label: 'Python Tools (uv)',
    description: 'Install Python CLI tools via uv',
    run: async () => {
      const tools = loadList('uv-tools.txt')
      for (const tool of tools) {
        await shAsyncSafe(`uv tool install ${tool}`)
      }
    },
  },
  {
    id: 'shell',
    phase: 'environment',
    label: 'Shell Config',
    description: 'Install .zshrc, p10k config, and Zinit (plugins auto-install on first launch)',
    run: async () => {
      const home = process.env.HOME!
      const root = resolveRoot()
      // Backup existing zshrc
      if (shSafe(`test -f ${home}/.zshrc`)) {
        const ts = new Date().toISOString().replace(/[:.]/g, '-')
        await shAsync(`cp "${home}/.zshrc" "${home}/.zshrc.backup-${ts}"`)
      }
      // Install .zshrc (Zinit self-installs on first source)
      await shAsync(`cp "${root}/zshrc" "${home}/.zshrc"`)
      // Install p10k config
      await shAsync(`cp "${root}/config/p10k.zsh" "${home}/.p10k.zsh"`)
    },
  },
  {
    id: 'fzf',
    phase: 'environment',
    label: 'fzf Keybindings',
    description: 'Install fzf shell integration and keybindings',
    run: async () => {
      const prefix = sh('brew --prefix')
      await shAsyncSafe(
        `"${prefix}/opt/fzf/install" --key-bindings --completion --no-update-rc --no-bash --no-fish`,
      )
    },
  },
  {
    id: 'cursor-extensions',
    phase: 'environment',
    label: 'Cursor Extensions',
    description: 'Install editor extensions',
    run: async () => {
      if (!shSafe('command -v cursor')) {
        throw new Error('Cursor CLI not found — install Cursor first, then re-run this step')
      }
      const exts = loadList('cursor-extensions.txt')
      for (const ext of exts) {
        await shAsyncSafe(`cursor --install-extension ${ext}`)
      }
    },
  },
  {
    id: 'claude-code',
    phase: 'environment',
    label: 'Claude Code Config',
    description: 'Restore settings, plugins, and CLAUDE.md',
    run: async () => {
      const home = process.env.HOME!
      const root = resolveRoot()
      const claudeDir = `${home}/.claude`
      await shAsync(`mkdir -p "${claudeDir}"`)
      await shAsync(`cp "${root}/config/claude-code-settings.json" "${claudeDir}/settings.json"`)
      await shAsync(`cp "${root}/config/claude-code-claude-md.md" "${claudeDir}/CLAUDE.md"`)
    },
  },
  {
    id: 'iterm2-profile',
    phase: 'environment',
    label: 'iTerm2 Profile',
    description: 'Install iTerm2 color scheme, font, and terminal settings',
    run: async () => {
      const home = process.env.HOME!
      const root = resolveRoot()
      const dynDir = `${home}/Library/Application Support/iTerm2/DynamicProfiles`
      await shAsync(`mkdir -p "${dynDir}"`)
      await shAsync(`cp "${root}/config/iterm2-profile.json" "${dynDir}/machine-restore.json"`)
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: Applications
  // GUI apps via Homebrew casks — depends on brew + accounts for sign-ins
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'casks',
    phase: 'applications',
    label: 'Homebrew Casks',
    description: 'Install GUI applications',
    run: async () => {
      const casks = loadList('casks.txt')
      for (const cask of casks) {
        await shAsyncSafe(`brew install --cask ${cask}`)
      }
    },
  },
  {
    id: 'containers',
    phase: 'applications',
    label: 'Container Runtime',
    description: 'Verify OrbStack is available for Docker',
    run: async () => {
      if (shSafe('command -v docker')) {
        return
      }
      await shAsyncSafe('brew install --cask orbstack')
      throw new Error('OrbStack installed — open it once to complete Docker setup')
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE: Preferences
  // macOS defaults and UI tweaks — safe to run last
  // ═══════════════════════════════════════════════════════════════════════════
  {
    id: 'macos-dock',
    phase: 'preferences',
    label: 'Dock Settings',
    description: 'Autohide, icon size, remove recents',
    run: async () => {
      await shAsync('defaults write com.apple.dock autohide -bool true')
      await shAsync('defaults write com.apple.dock tilesize -int 37')
      await shAsync('defaults write com.apple.dock show-recents -bool false')
      await shAsyncSafe('killall Dock')
    },
  },
  {
    id: 'macos-finder',
    phase: 'preferences',
    label: 'Finder Settings',
    description: 'Show file extensions, show path bar',
    run: async () => {
      await shAsync('defaults write com.apple.finder AppleShowAllExtensions -bool true')
      await shAsync('defaults write com.apple.finder ShowPathbar -bool true')
      await shAsyncSafe('killall Finder')
    },
  },
  {
    id: 'macos-appearance',
    phase: 'preferences',
    label: 'Appearance',
    description: 'Dark mode system-wide',
    run: async () => {
      await shAsync('defaults write NSGlobalDomain AppleInterfaceStyle -string "Dark"')
    },
  },
  {
    id: 'macos-input',
    phase: 'preferences',
    label: 'Keyboard & Trackpad',
    description: 'Fast key repeat, tap to click',
    run: async () => {
      await shAsync('defaults write NSGlobalDomain KeyRepeat -int 2')
      await shAsync('defaults write NSGlobalDomain InitialKeyRepeat -int 15')
      await shAsync('defaults write com.apple.AppleMultitouchTrackpad Clicking -bool true')
    },
  },
]
