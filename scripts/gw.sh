#!/bin/bash

# Git Worktree Manager - Create new worktree with branch
# Usage: gw <branch-name>
# Works with any git repository - run from within the repo you want to create a worktree for

set -e

# =============================================================================
# CONFIGURATION - Customize these settings
# =============================================================================

# Main branch name (change to "main" if your repo uses that)
MAIN_BRANCH="master"

# Base directory where worktrees are created
WORKTREE_BASE_DIR="${HOME}/Projects"

# Terminal application: "Terminal", "iTerm", "Hyper", or "none"
TERMINAL_APP="Terminal"

# =============================================================================
# SCRIPT - No changes needed below
# =============================================================================

MAIN_REPO_DIR="$(git rev-parse --show-toplevel)"
REPO_NAME=$(basename "$MAIN_REPO_DIR")

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if branch name provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: Branch name required${NC}"
    echo "Usage: gw <branch-name>"
    exit 1
fi

BRANCH_NAME="$1"
WORKTREE_DIR="${WORKTREE_BASE_DIR}/${REPO_NAME}-${BRANCH_NAME}"

# Check if already in a worktree (not main repo)
if [ "$(pwd)" != "$MAIN_REPO_DIR" ]; then
    echo -e "${YELLOW}Warning: You're in a worktree. Switching to main repo...${NC}"
    cd "$MAIN_REPO_DIR"
fi

# Check if worktree already exists
if [ -d "$WORKTREE_DIR" ]; then
    echo -e "${YELLOW}Worktree already exists at: ${WORKTREE_DIR}${NC}"
    echo -e "${BLUE}Opening existing worktree...${NC}"
    code "$WORKTREE_DIR" 2>/dev/null || echo -e "${BLUE}Path: ${WORKTREE_DIR}${NC}"
    exit 0
fi

echo -e "${BLUE}Creating worktree for branch: ${BRANCH_NAME}${NC}"

# Fetch latest from remote
echo -e "${BLUE}Fetching latest from remote...${NC}"
git fetch origin

# Check if branch exists remotely
if git ls-remote --exit-code --heads origin "$BRANCH_NAME" >/dev/null 2>&1; then
    echo -e "${YELLOW}Branch exists remotely. Checking out existing branch...${NC}"
    git worktree add "$WORKTREE_DIR" "$BRANCH_NAME"
else
    # Create new branch from main branch
    echo -e "${BLUE}Creating new branch from ${MAIN_BRANCH}...${NC}"
    git worktree add -b "$BRANCH_NAME" "$WORKTREE_DIR" "$MAIN_BRANCH"
fi

echo -e "${GREEN}Worktree created at: ${WORKTREE_DIR}${NC}"

# Copy over gitignored files that are needed
echo -e "${BLUE}Copying gitignored config files...${NC}"

# Copy .envrc if it exists (direnv)
if [ -f "$MAIN_REPO_DIR/.envrc" ]; then
    cp "$MAIN_REPO_DIR/.envrc" "$WORKTREE_DIR/.envrc"
    echo -e "${GREEN}  Copied .envrc${NC}"
fi

# Copy .python-version if it exists (pyenv)
if [ -f "$MAIN_REPO_DIR/.python-version" ]; then
    cp "$MAIN_REPO_DIR/.python-version" "$WORKTREE_DIR/.python-version"
    echo -e "${GREEN}  Copied .python-version${NC}"
fi

# Copy .node-version if it exists (nodenv/nvm)
if [ -f "$MAIN_REPO_DIR/.node-version" ]; then
    cp "$MAIN_REPO_DIR/.node-version" "$WORKTREE_DIR/.node-version"
    echo -e "${GREEN}  Copied .node-version${NC}"
fi

# Copy .nvmrc if it exists (nvm)
if [ -f "$MAIN_REPO_DIR/.nvmrc" ]; then
    cp "$MAIN_REPO_DIR/.nvmrc" "$WORKTREE_DIR/.nvmrc"
    echo -e "${GREEN}  Copied .nvmrc${NC}"
fi

# Copy .env files if they exist
for env_file in "$MAIN_REPO_DIR"/.env*; do
    if [ -f "$env_file" ] && [ "$(basename "$env_file")" != ".envrc" ]; then
        cp "$env_file" "$WORKTREE_DIR/$(basename "$env_file")"
        echo -e "${GREEN}  Copied $(basename "$env_file")${NC}"
    fi
done

# Copy Claude Code config if it exists
if [ -d "$MAIN_REPO_DIR/.claude" ]; then
    mkdir -p "$WORKTREE_DIR/.claude"

    if [ -f "$MAIN_REPO_DIR/.claude/settings.json" ]; then
        cp "$MAIN_REPO_DIR/.claude/settings.json" "$WORKTREE_DIR/.claude/settings.json"
        echo -e "${GREEN}  Copied .claude/settings.json${NC}"
    fi

    if [ -f "$MAIN_REPO_DIR/.claude/settings.local.json" ]; then
        cp "$MAIN_REPO_DIR/.claude/settings.local.json" "$WORKTREE_DIR/.claude/settings.local.json"
        echo -e "${GREEN}  Copied .claude/settings.local.json${NC}"
    fi

    if [ -f "$MAIN_REPO_DIR/.mcp.json" ]; then
        cp "$MAIN_REPO_DIR/.mcp.json" "$WORKTREE_DIR/.mcp.json"
        echo -e "${GREEN}  Copied .mcp.json${NC}"
    fi
fi

echo -e "${GREEN}Setup complete!${NC}"

# Open terminal at worktree location
case "$TERMINAL_APP" in
    "iTerm")
        osascript <<EOF
tell application "iTerm"
    create window with default profile
    tell current session of current window
        write text "cd '$WORKTREE_DIR' && claude"
    end tell
end tell
EOF
        echo -e "${BLUE}Opened iTerm with Claude Code${NC}"
        ;;
    "Terminal")
        osascript <<EOF
tell application "Terminal"
    do script "cd '$WORKTREE_DIR' && claude"
    activate
end tell
EOF
        echo -e "${BLUE}Opened Terminal with Claude Code${NC}"
        ;;
    "Hyper")
        open -a Hyper "$WORKTREE_DIR"
        echo -e "${YELLOW}Opened Hyper. Run 'claude' manually.${NC}"
        ;;
    "none"|*)
        echo -e "${BLUE}Worktree ready at: ${WORKTREE_DIR}${NC}"
        echo -e "${YELLOW}Run: cd '$WORKTREE_DIR' && claude${NC}"
        ;;
esac

echo -e "${GREEN}Done! Happy coding.${NC}"
