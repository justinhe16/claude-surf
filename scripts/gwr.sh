#!/bin/bash

# Git Worktree Remover - Interactive cleanup for git worktrees
# Usage: gwr
# Works with any git repository - run from within the repo you want to manage worktrees for

set -e

# =============================================================================
# CONFIGURATION - Customize these settings
# =============================================================================

# Main branch name (change to "main" if your repo uses that)
MAIN_BRANCH="master"

# =============================================================================
# SCRIPT - No changes needed below
# =============================================================================

MAIN_REPO_DIR="$(git rev-parse --show-toplevel)"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== Git Worktree Manager ===${NC}\n"

# Get all worktrees except main
WORKTREES=$(git worktree list --porcelain | grep -E "^worktree|^branch" | paste -d " " - - | grep -v "refs/heads/${MAIN_BRANCH}$" | awk '{print $2,$4}' | sed 's|refs/heads/||')

if [ -z "$WORKTREES" ]; then
    echo -e "${YELLOW}No worktrees found (other than main branch).${NC}"
    exit 0
fi

# Check if gh CLI is available for PR status
HAS_GH_CLI=false
if command -v gh &> /dev/null; then
    HAS_GH_CLI=true
fi

echo -e "${CYAN}Current worktrees:${NC}\n"

# Array to store worktree info
declare -a WORKTREE_PATHS
declare -a WORKTREE_BRANCHES
declare -a WORKTREE_STATUSES

INDEX=1
while IFS= read -r line; do
    WORKTREE_PATH=$(echo "$line" | awk '{print $1}')
    BRANCH_NAME=$(echo "$line" | awk '{print $2}')

    WORKTREE_PATHS[$INDEX]="$WORKTREE_PATH"
    WORKTREE_BRANCHES[$INDEX]="$BRANCH_NAME"

    # Check if branch has uncommitted changes
    cd "$WORKTREE_PATH"
    if [ -n "$(git status --porcelain)" ]; then
        STATUS="${RED}[DIRTY]${NC}"
    else
        STATUS="${GREEN}[CLEAN]${NC}"
    fi

    # Check PR status if gh CLI available
    PR_STATUS=""
    if [ "$HAS_GH_CLI" = true ]; then
        PR_INFO=$(gh pr view "$BRANCH_NAME" --json state,merged 2>/dev/null || echo "")
        if [ -n "$PR_INFO" ]; then
            MERGED=$(echo "$PR_INFO" | grep -o '"merged":[^,}]*' | cut -d: -f2)
            STATE=$(echo "$PR_INFO" | grep -o '"state":"[^"]*"' | cut -d'"' -f4)

            if [ "$MERGED" = "true" ]; then
                PR_STATUS=" ${GREEN}[PR MERGED]${NC}"
            elif [ "$STATE" = "OPEN" ]; then
                PR_STATUS=" ${YELLOW}[PR OPEN]${NC}"
            elif [ "$STATE" = "CLOSED" ]; then
                PR_STATUS=" ${RED}[PR CLOSED]${NC}"
            fi
        fi
    fi

    echo -e "  ${BLUE}[$INDEX]${NC} ${BRANCH_NAME}"
    echo -e "      Path: ${WORKTREE_PATH}"
    echo -e "      Status: ${STATUS}${PR_STATUS}"
    echo ""

    WORKTREE_STATUSES[$INDEX]="$STATUS"
    INDEX=$((INDEX + 1))
done <<< "$WORKTREES"

cd "$MAIN_REPO_DIR"

TOTAL=$((INDEX - 1))

echo -e "${CYAN}Actions:${NC}"
echo -e "  ${BLUE}[number]${NC}  Remove specific worktree"
echo -e "  ${BLUE}[a]${NC}       Remove ALL worktrees"
echo -e "  ${BLUE}[m]${NC}       Remove only MERGED worktrees"
echo -e "  ${BLUE}[c]${NC}       Remove only CLEAN worktrees (no uncommitted changes)"
echo -e "  ${BLUE}[d]${NC}       Remove DIRTY worktrees (has uncommitted changes)"
echo -e "  ${BLUE}[q]${NC}       Quit"
echo ""

read -p "Enter your choice: " CHOICE

remove_worktree() {
    local WORKTREE_PATH=$1
    local BRANCH=$2

    echo -e "${YELLOW}Removing worktree: ${BRANCH}${NC}"

    # Remove the worktree
    git worktree remove "$WORKTREE_PATH" --force

    echo -e "${GREEN}Removed worktree at ${WORKTREE_PATH}${NC}"

    # Ask if user wants to delete the branch
    read -p "Delete branch '$BRANCH'? (y/N): " DELETE_BRANCH
    if [[ "$DELETE_BRANCH" =~ ^[Yy]$ ]]; then
        git branch -D "$BRANCH" 2>/dev/null || true
        echo -e "${GREEN}Deleted branch ${BRANCH}${NC}"

        # Ask if user wants to delete remote branch
        if git ls-remote --exit-code --heads origin "$BRANCH" >/dev/null 2>&1; then
            read -p "Delete remote branch 'origin/$BRANCH'? (y/N): " DELETE_REMOTE
            if [[ "$DELETE_REMOTE" =~ ^[Yy]$ ]]; then
                git push origin --delete "$BRANCH" 2>/dev/null || true
                echo -e "${GREEN}Deleted remote branch origin/${BRANCH}${NC}"
            fi
        fi
    fi
}

case "$CHOICE" in
    [0-9]*)
        if [ "$CHOICE" -ge 1 ] && [ "$CHOICE" -le "$TOTAL" ]; then
            remove_worktree "${WORKTREE_PATHS[$CHOICE]}" "${WORKTREE_BRANCHES[$CHOICE]}"
        else
            echo -e "${RED}Invalid number${NC}"
        fi
        ;;
    a|A)
        echo -e "${YELLOW}Removing ALL worktrees...${NC}"
        for i in $(seq 1 $TOTAL); do
            remove_worktree "${WORKTREE_PATHS[$i]}" "${WORKTREE_BRANCHES[$i]}"
        done
        ;;
    m|M)
        echo -e "${YELLOW}Removing MERGED worktrees...${NC}"
        if [ "$HAS_GH_CLI" = false ]; then
            echo -e "${RED}Error: gh CLI not available. Install it to use this feature.${NC}"
            exit 1
        fi
        FOUND_MERGED=false
        for i in $(seq 1 $TOTAL); do
            BRANCH="${WORKTREE_BRANCHES[$i]}"
            PR_INFO=$(gh pr view "$BRANCH" --json merged 2>/dev/null || echo "")
            if [ -n "$PR_INFO" ]; then
                MERGED=$(echo "$PR_INFO" | grep -o '"merged":[^,}]*' | cut -d: -f2)
                if [ "$MERGED" = "true" ]; then
                    remove_worktree "${WORKTREE_PATHS[$i]}" "$BRANCH"
                    FOUND_MERGED=true
                fi
            fi
        done
        if [ "$FOUND_MERGED" = false ]; then
            echo -e "${YELLOW}No merged worktrees found.${NC}"
        fi
        ;;
    c|C)
        echo -e "${YELLOW}Removing CLEAN worktrees...${NC}"
        FOUND_CLEAN=false
        for i in $(seq 1 $TOTAL); do
            WORKTREE_PATH="${WORKTREE_PATHS[$i]}"
            BRANCH="${WORKTREE_BRANCHES[$i]}"
            cd "$WORKTREE_PATH"
            if [ -z "$(git status --porcelain)" ]; then
                remove_worktree "$WORKTREE_PATH" "$BRANCH"
                FOUND_CLEAN=true
            fi
            cd "$MAIN_REPO_DIR"
        done
        if [ "$FOUND_CLEAN" = false ]; then
            echo -e "${YELLOW}No clean worktrees found.${NC}"
        fi
        ;;
    d|D)
        echo -e "${YELLOW}Removing DIRTY worktrees...${NC}"
        FOUND_DIRTY=false
        for i in $(seq 1 $TOTAL); do
            WORKTREE_PATH="${WORKTREE_PATHS[$i]}"
            BRANCH="${WORKTREE_BRANCHES[$i]}"
            cd "$WORKTREE_PATH"
            if [ -n "$(git status --porcelain)" ]; then
                echo -e "${RED}Warning: This worktree has uncommitted changes!${NC}"
                read -p "Are you sure you want to remove it? (y/N): " CONFIRM
                if [[ "$CONFIRM" =~ ^[Yy]$ ]]; then
                    remove_worktree "$WORKTREE_PATH" "$BRANCH"
                    FOUND_DIRTY=true
                fi
            fi
            cd "$MAIN_REPO_DIR"
        done
        if [ "$FOUND_DIRTY" = false ]; then
            echo -e "${YELLOW}No dirty worktrees found.${NC}"
        fi
        ;;
    q|Q)
        echo -e "${BLUE}Exiting...${NC}"
        exit 0
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}Done!${NC}"
