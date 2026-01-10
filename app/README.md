# Claude Surf Desktop App

A visual dashboard for managing Claude Surf worktrees, built with Electron, React, TypeScript, and shadcn/ui.

## Architecture Overview

This is a **local desktop application** built with Electron. Everything runs on your machine - no external servers, no cloud deployment needed.

### Electron Architecture

Electron apps have two main processes:

```
┌─────────────────────────────────────────────────────────────┐
│                     ELECTRON APP                            │
│                                                             │
│  ┌────────────────────────────────────────────────────┐   │
│  │  Renderer Process (React UI)                       │   │
│  │  - Runs in Chromium browser                        │   │
│  │  - React + TypeScript + Vite                       │   │
│  │  - Tailwind CSS + shadcn/ui components             │   │
│  │  - Displays UI, handles user interactions          │   │
│  │  - NO direct access to filesystem or Node.js APIs  │   │
│  └──────────────────┬─────────────────────────────────┘   │
│                     │                                       │
│                     │ IPC (Inter-Process Communication)    │
│                     │ (Secure message passing)             │
│                     │                                       │
│  ┌──────────────────▼─────────────────────────────────┐   │
│  │  Preload Script (Security Bridge)                  │   │
│  │  - Exposes safe IPC API via contextBridge          │   │
│  │  - Whitelists specific channels                    │   │
│  │  - Validates and sanitizes all requests            │   │
│  └──────────────────┬─────────────────────────────────┘   │
│                     │                                       │
│  ┌──────────────────▼─────────────────────────────────┐   │
│  │  Main Process (Node.js)                            │   │
│  │  - Full access to filesystem, Node.js APIs         │   │
│  │  - Runs git commands via child_process             │   │
│  │  - Scans ~/Projects for worktrees                  │   │
│  │  - Calls GitHub API via gh CLI                     │   │
│  │  - Manages app lifecycle and windows               │   │
│  └────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Your Local System    │
                │                       │
                │  ~/Projects/          │
                │  Git repositories     │
                │  gh CLI               │
                │  GitHub API           │
                └───────────────────────┘
```

## How It Works

### 1. Data Source: Your Local Filesystem

The app scans your local `~/Projects` directory for worktrees created by Claude Surf:

```bash
~/Projects/
  ├── myrepo-feature-auth/        # solo-surf worktree
  ├── myrepo-bugfix-login/        # robot-surf worktree
  └── myrepo-refactor-api/        # another worktree
```

### 2. Worktree Detection Process

**In Main Process (Node.js):**
```typescript
// 1. Scan ~/Projects directory
const projectsDir = path.join(os.homedir(), 'Projects');
const directories = await fs.readdir(projectsDir);

// 2. Find directories matching pattern: <repo>-<branch>
const worktrees = directories.filter(d => d.includes('-'));

// 3. For each worktree:
//    - Run `git status --porcelain` to check for changes
//    - Check for `.claude-surf-meta.json` to detect origin type
//    - Run `gh pr list` to find associated PRs
//    - Determine status: dirty, merged, pr-out, or clean
```

### 3. Data Flow

```
User clicks "Refresh" in UI
        ↓
Renderer sends IPC message: 'worktrees:list'
        ↓
Preload script validates and forwards request
        ↓
Main process git-service scans ~/Projects
        ↓
Main process executes git commands:
  - git status --porcelain (check dirty state)
  - git branch -r --merged (check if merged)
  - gh pr list --head <branch> (check for PRs)
        ↓
Main process sends IPC reply with worktree data
        ↓
Preload script forwards response
        ↓
Renderer updates UI via Zustand store
        ↓
React components re-render with new data
```

### 4. Security Model

**Why Two Processes?**
- **Renderer**: Sandboxed browser environment (like a webpage)
  - Cannot access filesystem directly
  - Cannot run shell commands
  - Safer from XSS and injection attacks

- **Main**: Full Node.js environment
  - Has filesystem access
  - Can run system commands
  - Trusted environment

**Preload Script:**
- Acts as a security boundary
- Only exposes specific, validated APIs
- Prevents arbitrary code execution from renderer

```typescript
// Preload exposes ONLY these safe functions:
window.electronAPI = {
  worktrees: {
    list: () => ipcRenderer.invoke('worktrees:list'),
    delete: (id) => ipcRenderer.invoke('worktrees:delete', id),
    refresh: () => ipcRenderer.invoke('worktrees:refresh'),
  }
};

// Renderer CANNOT do this:
// window.electronAPI.executeArbitraryCode('rm -rf /')  ❌
```

## Project Structure

```
app/
├── src/
│   ├── main/                    # Node.js Main Process
│   │   ├── index.ts            # Electron entry point
│   │   ├── ipc-handlers.ts     # IPC event handlers
│   │   ├── git-service.ts      # Git operations
│   │   └── github-service.ts   # GitHub API calls
│   │
│   ├── preload/                 # Security Bridge
│   │   └── index.ts            # contextBridge API
│   │
│   ├── renderer/                # React UI
│   │   ├── components/         # React components
│   │   │   ├── ui/            # shadcn/ui primitives
│   │   │   ├── Layout.tsx     # Main layout
│   │   │   ├── Sidebar.tsx    # Left sidebar
│   │   │   ├── WorktreeCard.tsx
│   │   │   └── ...
│   │   ├── hooks/              # React hooks
│   │   │   └── useWorktrees.ts
│   │   ├── store/              # Zustand state
│   │   │   └── worktree-store.ts
│   │   ├── lib/                # Utilities
│   │   │   └── utils.ts
│   │   ├── styles/             # CSS
│   │   │   └── globals.css
│   │   ├── App.tsx             # Root component
│   │   └── index.tsx           # React entry
│   │
│   └── shared/                  # Shared Types
│       └── types.ts            # TypeScript interfaces
│
├── assets/                      # App icons
├── dist/                        # Build output (Vite)
├── index.html                   # HTML entry point
├── package.json
├── vite.config.ts              # Vite bundler config
├── tsconfig.json               # TypeScript config
└── tailwind.config.js          # Tailwind CSS config
```

## Technology Stack

### Frontend (Renderer Process)
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast build tool with HMR
- **Tailwind CSS** - Utility-first CSS
- **shadcn/ui** - Beautiful UI components
- **Zustand** - Lightweight state management
- **Framer Motion** - Animations
- **@dnd-kit** - Drag and drop

### Backend (Main Process)
- **Electron 28** - Desktop app framework
- **Node.js** - Runtime environment
- **child_process** - Execute git commands
- **fs/promises** - Filesystem operations

### Tools & APIs
- **git** - Version control (local CLI)
- **gh** - GitHub CLI (local, authenticated)
- **GitHub API** - PR status and CI checks (via gh CLI)

## Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Start development mode
npm run dev
```

This runs:
1. **Vite dev server** on http://localhost:5173 (hot reload)
2. **Electron app** that loads the Vite server

You can edit React components and see changes instantly!

### How Development Mode Works

```
Terminal 1: Vite Dev Server
  ↓
  Watches src/renderer/**/*
  ↓
  Hot Module Reload on changes
  ↓
  Serves at http://localhost:5173

Terminal 2: Electron Main Process
  ↓
  Loads http://localhost:5173 in BrowserWindow
  ↓
  Opens DevTools automatically
  ↓
  Reloads when you edit main process files
```

## Building for Production

### Local Build

```bash
# Build for your current OS
npm run build

# Build for specific OS
npm run build:mac      # macOS .dmg and .zip
npm run build:win      # Windows .exe and .zip
npm run build:linux    # Linux .AppImage and .deb
```

### What Happens During Build

```
1. TypeScript compilation
   ↓
2. Vite bundles React app → dist/
   ↓
3. electron-builder packages app
   ↓
4. Creates distributable:
   - macOS: .dmg (installer) + .zip
   - Windows: .exe (installer) + .zip
   - Linux: .AppImage + .deb
```

### Distribution

**Option 1: Manual Distribution**
- Send the built .dmg/.exe/.AppImage to users
- Users double-click to install
- App runs completely offline (no internet required)

**Option 2: GitHub Releases (Automated)**
- Push a git tag: `git tag v1.0.0 && git push --tags`
- GitHub Actions builds for all platforms
- Uploads installers to GitHub Releases
- Users download from Releases page

**No Server Required!**
- No deployment to AWS/Vercel/Netlify
- No backend server to maintain
- No database to host
- Just build → distribute → users run locally

## Data Persistence

### Where Data Lives

**Worktree Data:**
- Stored in your filesystem: `~/Projects/*`
- The app just **reads** this data, doesn't store it separately

**App Preferences (Future):**
- Stored in OS-specific locations:
  - macOS: `~/Library/Application Support/Claude Surf/`
  - Windows: `%APPDATA%/Claude Surf/`
  - Linux: `~/.config/Claude Surf/`

**No Database:**
- Git repositories are the source of truth
- App scans directories on each refresh
- No SQLite, no PostgreSQL, no cloud storage

## External Dependencies

### Required on User's Machine

1. **Git** - For git commands
   ```bash
   git --version  # Must be installed
   ```

2. **gh CLI** (optional but recommended) - For PR status
   ```bash
   gh --version  # Optional: enables PR features
   gh auth login  # Must be authenticated
   ```

### API Usage

**GitHub API:**
- Called via `gh CLI` (no direct HTTP requests)
- Uses user's GitHub token (from `gh auth login`)
- Rate limits: GitHub's standard limits apply
- No separate API key needed

**Linear API (for robot-surf):**
- Only used by CLI skills, not the Electron app
- Configured via MCP server

## Deployment Strategy

### For End Users

**There is NO deployment!**

Users simply:
1. Download the installer (.dmg / .exe / .AppImage)
2. Install the app (drag to Applications / run installer)
3. Open the app
4. The app scans their local `~/Projects` directory

### For Developers (You)

**To release a new version:**

```bash
# 1. Update version in package.json
npm version 1.0.0

# 2. Commit and tag
git commit -am "Release v1.0.0"
git tag v1.0.0

# 3. Push with tags
git push origin justin/electron-base --tags

# 4. GitHub Actions automatically:
#    - Builds for macOS, Windows, Linux
#    - Creates GitHub Release
#    - Uploads installers
```

**Users update by:**
- Downloading the new version from GitHub Releases
- Installing over the old version

**(Future) Auto-update:**
- electron-updater can check GitHub Releases
- Downloads and installs updates automatically
- Requires code signing certificates

## Privacy & Security

### What the App Accesses

**Local Filesystem:**
- ✅ Reads `~/Projects/*` to scan worktrees
- ✅ Reads git repository data
- ✅ Executes git commands in worktree directories
- ❌ Does NOT access other directories
- ❌ Does NOT send data to external servers

**Network:**
- ✅ Calls GitHub API via `gh CLI` (if installed)
- ✅ Uses your existing GitHub authentication
- ❌ Does NOT send data to Anthropic, Claude, or any other service
- ❌ Does NOT track analytics

**Permissions:**
- macOS: May request Accessibility permissions (for global shortcuts)
- Windows: No special permissions required
- Linux: No special permissions required

### Data Security

**Your Code:**
- Never leaves your machine
- Only displayed in the app UI
- Not uploaded anywhere

**GitHub Token:**
- Managed by `gh CLI`
- Stored in OS keychain (secure)
- App uses it indirectly via `gh` commands

**Git History:**
- Read-only access
- App shows status but doesn't modify history

## Troubleshooting

### App Won't Start

```bash
# Check Electron version
npm list electron

# Rebuild native modules
npm rebuild

# Clear Electron cache
rm -rf ~/Library/Application\ Support/Claude\ Surf
```

### Worktrees Not Showing

```bash
# Check if ~/Projects exists
ls -la ~/Projects

# Check if worktrees match pattern
ls -la ~/Projects/*-*

# Check if git is installed
git --version
```

### PR Status Not Showing

```bash
# Check if gh CLI is installed
gh --version

# Check authentication
gh auth status

# Re-authenticate if needed
gh auth login
```

## Development Roadmap

### Phase 1: ✅ React + TypeScript + Vite
- Vite dev server with hot reload
- TypeScript for type safety

### Phase 2: ✅ Tailwind CSS + shadcn/ui
- Tailwind utilities
- shadcn/ui components

### Phase 3: Secure IPC Architecture
- contextBridge API
- git-service for worktree scanning
- Type-safe IPC communication

### Phase 4: Sidebar Layout
- Logo display
- Project filter
- Color legend

### Phase 5: Worktree Cards
- Card grid layout
- Status badges
- Delete buttons

### Phase 6: State Management
- Zustand store
- Auto-refresh
- Filter logic

### Phase 7: Delete Modal
- Confirmation dialog
- Worktree deletion

### Phase 8: Animations
- Card exit animations
- Drag-and-drop reordering

### Phase 9: GitHub Integration
- PR status badges
- CI check indicators

### Phase 10: Production Polish
- Error boundaries
- Production build optimization
- App icons for all platforms

## Contributing

This is a local development tool. To contribute:

1. Clone the repository
2. `cd app && npm install`
3. `npm run dev`
4. Make changes
5. Test thoroughly
6. Commit with descriptive messages

## License

MIT

---

**Questions?**

- Architecture unclear? Check the diagrams above
- Deployment confused? Remember: it's a desktop app, no server needed
- Security concerns? Review the IPC architecture section
- Development issues? See Troubleshooting section
