# Claude Surf App

Visual dashboard for managing Claude Surf git worktrees.

## Features (Planned)

- 📊 **Dashboard view** - See all worktrees at a glance
- 🏷️ **Worktree status** - Track solo-surf vs robot-surf sessions
- 🔄 **PR tracking** - View PR status, CI results, and approvals
- 🗑️ **Quick actions** - Delete worktrees, open in terminal, view PRs
- ⚡ **Live updates** - Real-time status from git, GitHub, and Linear

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for your platform
npm run build

# Build for specific platforms
npm run build:mac
npm run build:win
npm run build:linux
```

## Structure

```
app/
├── src/
│   ├── main/       # Electron main process
│   ├── renderer/   # UI layer (React/Vue/vanilla)
│   └── shared/     # Shared types and utilities
├── assets/         # Icons and static assets
└── package.json    # Dependencies and build config
```

## Building for Release

Releases are built automatically via GitHub Actions when you push a tag:

```bash
git tag v1.0.0
git push origin v1.0.0
```

This triggers a workflow that builds for macOS, Windows, and Linux, then uploads the binaries to GitHub Releases.
