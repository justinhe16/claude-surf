# claude-surf

Opinionated Claude Code agents for automated software development workflows, plus git worktree scripts for parallel development.

## What's Included

### Agents
- **orchestrator** — coordinates multi-step tasks across agents
- **software-engineer** — implements code, runs tests, creates PRs, handles CI
- **code-reviewer** — reviews PRs for quality, security, and best practices

### Scripts
- **gw** — create git worktrees with automatic config copying
- **gwr** — interactive worktree cleanup with PR status awareness

---

## Install

### Agents: Global (use in any project)

```bash
git clone git@github.com:justinhe16/claude-surf.git
cd claude-surf
claude
```

Then run:
```
/surf-global
```

Agents are now available globally in `~/.claude/agents/`.

### Agents: Project-level (one project only)

```bash
cp -r claude-surf/.claude/agents your-project/.claude/
```

### Scripts

```bash
# Copy to your bin directory
cp claude-surf/scripts/gw.sh ~/bin/gw.sh
cp claude-surf/scripts/gwr.sh ~/bin/gwr.sh
chmod +x ~/bin/gw.sh ~/bin/gwr.sh

# Add aliases to your shell config (~/.zshrc or ~/.bashrc)
echo 'alias gw="~/bin/gw.sh"' >> ~/.zshrc
echo 'alias gwr="~/bin/gwr.sh"' >> ~/.zshrc
source ~/.zshrc
```

---

## Agents

### Usage

**Direct invocation:**
```
Use the software-engineer agent to implement user authentication
```
```
Use the code-reviewer agent to review PR #42
```
```
Use the orchestrator to implement this feature and iterate with code review
```

**Natural language** — Claude auto-delegates based on agent descriptions:
```
Implement the login feature, make sure tests pass, and create a PR
```

### orchestrator

Coordinates complex tasks. Spawns other agents, passes context between them, manages iteration cycles.

**When to use**: Multi-step workflows, feature implementation with review, anything requiring multiple specialists.

**The loop**:
1. Spawns software-engineer to implement
2. Waits for PR + green CI
3. Spawns code-reviewer to review
4. If issues found, spawns software-engineer with feedback
5. Repeats until both agents agree (max 3 iterations)

### software-engineer

Implements code with a test-driven feedback loop.

**Process**:
1. Understand the codebase
2. Implement the change
3. Run tests until green
4. Create PR
5. Monitor CI, fix failures
6. Report PR URL when done

### code-reviewer

Reviews code for quality, security, and correctness.

**Checks for**:
- Logic errors and edge cases
- Security vulnerabilities (injection, auth issues, secrets)
- Code quality and readability
- Test coverage
- Performance issues

**Output**: Verdict (approve/request changes) with categorized feedback.

---

## Scripts

### gw — Git Worktree Create

Creates a new worktree for a branch and copies config files automatically.

```bash
cd ~/Projects/my-repo
gw feature/new-dashboard
```

**What it does**:
1. Creates worktree at `~/Projects/<repo>-<branch>`
2. Checks out existing remote branch, or creates new branch from main
3. Copies gitignored config files:
   - `.env*` files
   - `.envrc` (direnv)
   - `.python-version`, `.node-version`, `.nvmrc`
   - `.claude/settings.json`
   - `.mcp.json`
4. Opens terminal at worktree location

**Configuration** (edit `~/bin/gw.sh`):
```bash
MAIN_BRANCH="master"           # or "main"
WORKTREE_BASE_DIR="${HOME}/Projects"
TERMINAL_APP="Terminal"        # "Terminal", "iTerm", "Hyper", or "none"
```

### gwr — Git Worktree Remove

Interactive cleanup for worktrees with status awareness.

```bash
cd ~/Projects/my-repo
gwr
```

**Shows**:
- All worktrees (except main branch)
- Status: CLEAN or DIRTY (uncommitted changes)
- PR status: MERGED, OPEN, or CLOSED (requires `gh` CLI)

**Actions**:
| Key | Action |
|-----|--------|
| `[number]` | Remove specific worktree |
| `a` | Remove ALL worktrees |
| `m` | Remove only MERGED worktrees |
| `c` | Remove only CLEAN worktrees |
| `d` | Remove DIRTY worktrees (with confirmation) |
| `q` | Quit |

After removing, prompts to delete local and remote branches.

**Requirements**:
- `gh` CLI for PR status (optional): `brew install gh && gh auth login`

---

## Workflow Example

```bash
# Start feature in isolated worktree
cd ~/Projects/my-app
gw feature/user-auth

# Opens new terminal at ~/Projects/my-app-feature/user-auth
# Run claude and use the orchestrator:

> Use the orchestrator to implement JWT authentication based on this spec: [details]

# Orchestrator:
# 1. Spawns software-engineer → implements, tests, creates PR
# 2. Spawns code-reviewer → reviews, posts comments
# 3. Loops until approved
# 4. Reports: "PR #42 ready for human review"

# When done, clean up
gwr
# Select [m] to remove merged worktrees
```

---

## Customization

### Agents

Edit markdown files in `.claude/agents/` (project) or `~/.claude/agents/` (global):

```markdown
---
name: my-agent
description: When Claude should use this agent
tools: Read, Edit, Write, Bash
model: sonnet
---

Your system prompt here...
```

### Scripts

Edit configuration at the top of each script:
- `MAIN_BRANCH` — your default branch name
- `WORKTREE_BASE_DIR` — where worktrees are created
- `TERMINAL_APP` — which terminal to open

---

## Structure

```
claude-surf/
├── .claude/
│   ├── settings.json
│   ├── agents/
│   │   ├── orchestrator.md
│   │   ├── software-engineer.md
│   │   └── code-reviewer.md
│   └── skills/
│       └── surf-global/
│           └── SKILL.md
├── scripts/
│   ├── gw.sh
│   └── gwr.sh
└── README.md
```

## License

MIT
