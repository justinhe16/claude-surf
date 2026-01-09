# claude-surf

Opinionated Claude Code agents and skills for automated software development workflows.

## What's Included

### Agents
- **orchestrator** — coordinates multi-step tasks across agents
- **software-engineer** — implements code, runs tests, creates PRs, handles CI
- **code-reviewer** — reviews PRs for quality, security, and best practices

### Skills
- **/global-surf** — install agents and skills globally for use in any project
- **/solo-surf** — spawn a git worktree with Claude in a new terminal

---

## Install

```bash
git clone git@github.com:justinhe16/claude-surf.git
cd claude-surf
claude
```

Then run:
```
/global-surf
```

Agents and skills are now available globally in `~/.claude/`.

---

## Skills

### /global-surf

Installs all claude-surf agents and skills to your global config.

```
/global-surf
```

**What gets installed:**

| Type | Location | Items |
|------|----------|-------|
| Agents | `~/.claude/agents/` | orchestrator, software-engineer, code-reviewer |
| Skills | `~/.claude/skills/` | solo-surf |

Run once after cloning. Everything will be available in all your projects.

To update, pull latest changes and re-run `/global-surf`.

### /solo-surf

Creates a git worktree for a feature branch and opens a new terminal with Claude ready.

```
/solo-surf <branch-name> [terminal]
```

**Arguments:**
- `branch-name` (required): The feature branch name
- `terminal` (optional): `Hyper`, `iTerm`, or `Terminal`. Default: `Hyper`

**Examples:**
```
/solo-surf feature/user-auth
/solo-surf bugfix/payment iTerm
/solo-surf feature/dashboard Terminal
```

**What it does:**
1. Creates worktree at `~/Projects/<repo>-<branch>`
2. Checks out existing remote branch, or creates new branch from master
3. Copies config files: `.env*`, `.envrc`, `.python-version`, `.node-version`, `.claude/settings.json`, `.mcp.json`
4. Opens your preferred terminal at the worktree
5. Starts Claude (for iTerm/Terminal) or prompts you to run `claude` (Hyper)

**Note:** The new Claude session is independent—no shared context with your current session.

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

**When to use**: Multi-step workflows, feature implementation with review.

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
- Security vulnerabilities
- Code quality and readability
- Test coverage
- Performance issues

**Output**: Verdict (approve/request changes) with categorized feedback.

---

## Workflow Example

```bash
# In your main repo, spawn a feature branch
> /solo-surf feature/user-auth

# Claude creates worktree, opens new Hyper window
# In the new terminal, Claude is ready

# Use the orchestrator for end-to-end implementation:
> Use the orchestrator to implement JWT authentication based on this spec...

# Orchestrator:
# 1. Spawns software-engineer → implements, tests, creates PR
# 2. Spawns code-reviewer → reviews, posts comments
# 3. Loops until approved
# 4. Reports: "PR #42 ready for human review"
```

---

## Customization

### Agents

Edit files in `.claude/agents/` (project) or `~/.claude/agents/` (global):

```markdown
---
name: my-agent
description: When Claude should use this agent
tools: Read, Edit, Write, Bash
model: sonnet
---

Your system prompt here...
```

### Main Branch

If your repo uses `main` instead of `master`, update the `MAIN_BRANCH` variable in the `/solo-surf` skill instructions.

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
│       ├── global-surf/
│       │   └── SKILL.md
│       └── solo-surf/
│           └── SKILL.md
└── README.md
```

## License

MIT
