import { execSync, spawn } from "node:child_process";

export type StepStatus = "pending" | "running" | "done" | "failed" | "skipped";

export interface Step {
  id: string;
  label: string;
  description: string;
  run: () => Promise<void>;
}

function sh(cmd: string): string {
  return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

function shSafe(cmd: string): boolean {
  try {
    execSync(cmd, { stdio: ["pipe", "pipe", "pipe"] });
    return true;
  } catch {
    return false;
  }
}

async function shAsync(cmd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn("bash", ["-c", cmd], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
    child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
    child.on("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(`Exit ${code}: ${stderr || stdout}`));
    });
  });
}

async function shAsyncSafe(cmd: string): Promise<boolean> {
  try {
    await shAsync(cmd);
    return true;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Taps
// ---------------------------------------------------------------------------
const TAPS = [
  "antoniorodr/memo",
  "arthur-ficial/tap",
  "michidk/tools",
  "openhue/cli",
  "steipete/tap",
  "stripe/stripe-cli",
  "supabase/tap",
];

// ---------------------------------------------------------------------------
// Formulae
// ---------------------------------------------------------------------------
const FORMULAE = [
  "git", "gh", "curl", "wget", "ripgrep", "fzf", "z", "autojump",
  "node", "nvm", "go", "python@3.13", "python@3.14", "uv",
  "pnpm", "nx", "typescript", "typescript-language-server", "swc",
  "cloudflare-wrangler", "supabase", "stripe", "vercel-cli", "tailscale", "caddy", "gnupg",
  "act", "devcontainer", "docker-completion", "dockerfile-language-server",
  "vscode-langservers-extracted", "yamllint", "platformio",
  "ffmpeg", "imagemagick", "sox", "whisper-cpp", "openai-whisper",
  "mlx", "pytorch", "numpy",
  "memo", "gogcli", "goplaces", "himalaya", "imessage-exporter", "imsg",
  "mcp-publisher", "openhue-cli", "peekaboo", "remindctl", "rmrfrs", "sag",
  "songsee", "summarize", "svg2png", "vscli", "wacli", "autocode", "gemini-cli",
];

// ---------------------------------------------------------------------------
// Casks
// ---------------------------------------------------------------------------
const CASKS = [
  "1password", "1password-cli",
  "arc", "busycal", "slack",
  "arduino-ide@nightly", "bartender", "betterdisplay",
  "claude", "claude-code", "codex",
  "cloudflare-warp", "conductor", "container", "cursor-cli",
  "elgato-control-center", "elgato-stream-deck",
  "figma", "gcloud-cli", "google-chrome", "google-drive",
  "iterm2", "linear-linear", "orbstack", "postico",
  "presonus-universal-control", "qmk-toolbox",
  "raycast", "realvnc-connect", "rotato",
  "screens-connect", "sonos", "tailscale-app",
  "the-unarchiver", "vlc", "whatsapp", "windows-app",
];

// ---------------------------------------------------------------------------
// Cursor extensions
// ---------------------------------------------------------------------------
const EXTENSIONS = [
  "1password.op-vscode", "aaron-bond.better-comments", "alefragnani.bookmarks",
  "anthropic.claude-code", "anysphere.remote-containers", "anysphere.remote-ssh",
  "arcanis.vscode-zipfs", "bradlc.vscode-tailwindcss", "bungcip.better-toml",
  "christian-kohler.npm-intellisense", "christian-kohler.path-intellisense",
  "davidanson.vscode-markdownlint", "davidgomes.platformio-ide-cursor",
  "dbaeumer.vscode-eslint", "docker.docker", "donjayamanne.githistory",
  "editorconfig.editorconfig", "emmanuelbeziat.vscode-great-icons",
  "esbenp.prettier-vscode", "formulahendry.auto-close-tag",
  "formulahendry.auto-rename-tag", "github.vscode-github-actions",
  "github.vscode-pull-request-github", "gruntfuggly.todo-tree",
  "gydunhn.javascript-essentials", "gydunhn.typescript-essentials",
  "gydunhn.vsc-essentials-core", "hamza-aziane.obsidian-dark",
  "ibm.output-colorizer", "ionutvmi.path-autocomplete",
  "knisterpeter.vscode-github", "llvm-vs-code-extensions.vscode-clangd",
  "manuth.eslint-language-service", "mattpocock.ts-error-translator",
  "mechatroner.rainbow-csv", "mhutchie.git-graph", "mikestead.dotenv",
  "ms-azuretools.vscode-containers", "ms-azuretools.vscode-docker",
  "ms-playwright.playwright", "ms-vscode.hexeditor",
  "ms-vscode.vscode-typescript-next", "mtxr.sqltools", "mtxr.sqltools-driver-pg",
  "nrwl.angular-console", "oderwat.indent-rainbow", "redhat.vscode-yaml",
  "rvest.vs-code-prettier-eslint", "sanjulaganepola.github-local-actions",
  "steoates.autoimport", "tamasfe.even-better-toml",
  "typescriptteam.native-preview", "usernamehw.errorlens",
  "vincaslt.highlight-matching-tag", "xabikos.javascriptsnippets",
  "yoavbls.pretty-ts-errors", "yzhang.markdown-all-in-one",
  "zardoy.ts-essential-plugins",
];

// ---------------------------------------------------------------------------
// Global packages
// ---------------------------------------------------------------------------
const PNPM_GLOBALS = ["clawdhub", "clawhub", "mcporter", "node-gyp", "openclaw"];
const NPM_GLOBALS = ["@figma/code-connect", "agent-browser", "clawdbot"];
const UV_TOOLS = ["nano-pdf"];

// ---------------------------------------------------------------------------
// Step definitions
// ---------------------------------------------------------------------------
export const steps: Step[] = [
  {
    id: "xcode",
    label: "Xcode CLI Tools",
    description: "Install Xcode Command Line Tools",
    run: async () => {
      if (shSafe("xcode-select -p")) return;
      await shAsync("xcode-select --install");
    },
  },
  {
    id: "homebrew",
    label: "Homebrew",
    description: "Install or update Homebrew",
    run: async () => {
      if (!shSafe("command -v brew")) {
        await shAsync(
          '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"',
        );
      }
      await shAsync("brew update");
    },
  },
  {
    id: "taps",
    label: "Homebrew Taps",
    description: `Add ${TAPS.length} third-party taps`,
    run: async () => {
      for (const tap of TAPS) {
        await shAsyncSafe(`brew tap ${tap}`);
      }
    },
  },
  {
    id: "formulae",
    label: "Homebrew Formulae",
    description: `Install ${FORMULAE.length} CLI tools & libraries`,
    run: async () => {
      // Install in batches for speed
      const batch = FORMULAE.join(" ");
      await shAsyncSafe(`brew install ${batch}`);
    },
  },
  {
    id: "casks",
    label: "Homebrew Casks",
    description: `Install ${CASKS.length} GUI applications`,
    run: async () => {
      for (const cask of CASKS) {
        await shAsyncSafe(`brew install --cask ${cask}`);
      }
    },
  },
  {
    id: "node",
    label: "Node.js (nvm)",
    description: "Install Node.js 22 via nvm and set as default",
    run: async () => {
      const nvmDir = process.env.HOME + "/.nvm";
      const nvmSh = sh("brew --prefix") + "/opt/nvm/nvm.sh";
      await shAsync(`
        export NVM_DIR="${nvmDir}"
        mkdir -p "$NVM_DIR"
        . "${nvmSh}"
        nvm install 22
        nvm alias default 22
      `);
    },
  },
  {
    id: "pnpm-globals",
    label: "Global pnpm Packages",
    description: `Install ${PNPM_GLOBALS.length} global pnpm packages`,
    run: async () => {
      for (const pkg of PNPM_GLOBALS) {
        await shAsyncSafe(`pnpm add -g ${pkg}`);
      }
    },
  },
  {
    id: "npm-globals",
    label: "Global npm Packages",
    description: `Install ${NPM_GLOBALS.length} global npm packages`,
    run: async () => {
      for (const pkg of NPM_GLOBALS) {
        await shAsyncSafe(`npm install -g ${pkg}`);
      }
    },
  },
  {
    id: "uv-tools",
    label: "Python Tools (uv)",
    description: `Install ${UV_TOOLS.length} Python tools via uv`,
    run: async () => {
      for (const tool of UV_TOOLS) {
        await shAsyncSafe(`uv tool install ${tool}`);
      }
    },
  },
  {
    id: "cursor-extensions",
    label: "Cursor Extensions",
    description: `Install ${EXTENSIONS.length} editor extensions`,
    run: async () => {
      if (!shSafe("command -v cursor")) {
        throw new Error("Cursor CLI not found — skipping extensions");
      }
      for (const ext of EXTENSIONS) {
        await shAsyncSafe(`cursor --install-extension ${ext}`);
      }
    },
  },
  {
    id: "shell",
    label: "Shell Environment",
    description: "Install Oh My Zsh, Zinit, Powerlevel10k, and plugins",
    run: async () => {
      const home = process.env.HOME!;
      // Oh My Zsh
      if (!shSafe(`test -d ${home}/.oh-my-zsh`)) {
        await shAsync(
          `sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended`,
        );
      }
      // Custom plugins
      const custom = process.env.ZSH_CUSTOM || `${home}/.oh-my-zsh/custom`;
      if (!shSafe(`test -d ${custom}/plugins/zsh-autosuggestions`)) {
        await shAsync(
          `git clone https://github.com/zsh-users/zsh-autosuggestions ${custom}/plugins/zsh-autosuggestions`,
        );
      }
      if (!shSafe(`test -d ${custom}/plugins/zsh-syntax-highlighting`)) {
        await shAsync(
          `git clone https://github.com/zsh-users/zsh-syntax-highlighting ${custom}/plugins/zsh-syntax-highlighting`,
        );
      }
    },
  },
  {
    id: "zshrc",
    label: "Shell Config (.zshrc)",
    description: "Install .zshrc with aliases, plugins, and nvm auto-switch",
    run: async () => {
      const home = process.env.HOME!;
      const scriptDir = new URL(".", import.meta.url).pathname.replace(/\/src\/$/, "");
      if (shSafe(`test -f ${home}/.zshrc`)) {
        const ts = new Date().toISOString().replace(/[:.]/g, "-");
        await shAsync(`cp ${home}/.zshrc ${home}/.zshrc.backup-${ts}`);
      }
      await shAsync(`cp ${scriptDir}/zshrc ${home}/.zshrc`);
    },
  },
  {
    id: "macos",
    label: "macOS Preferences",
    description: "Dark mode, dock autohide, dock size, Finder extensions",
    run: async () => {
      await shAsync('defaults write com.apple.dock autohide -bool true');
      await shAsync('defaults write com.apple.dock tilesize -int 37');
      await shAsync('defaults write com.apple.finder AppleShowAllExtensions -bool true');
      await shAsync('defaults write NSGlobalDomain AppleInterfaceStyle -string "Dark"');
      await shAsyncSafe("killall Dock");
    },
  },
  {
    id: "fzf",
    label: "fzf Keybindings",
    description: "Install fzf shell integration",
    run: async () => {
      const prefix = sh("brew --prefix");
      await shAsyncSafe(
        `${prefix}/opt/fzf/install --key-bindings --completion --no-update-rc --no-bash --no-fish`,
      );
    },
  },
  {
    id: "directories",
    label: "Directory Structure",
    description: "Create ~/Developer",
    run: async () => {
      await shAsync(`mkdir -p ${process.env.HOME}/Developer`);
    },
  },
];
