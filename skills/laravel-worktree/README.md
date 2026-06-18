# Laravel Worktree Manager

Spins up an isolated Git worktree for a Laravel feature branch — fresh dependencies, own Herd `.test` domain, shared database.

## Install

**Claude Code** — user scope (available in all projects):

```bash
mkdir -p ~/.claude/skills/laravel-worktree
cp SKILL.md ~/.claude/skills/laravel-worktree/SKILL.md
```

Or project scope (this project only):

```bash
mkdir -p .claude/skills/laravel-worktree
cp SKILL.md .claude/skills/laravel-worktree/SKILL.md
```

**Codex** — place `AGENTS.md` in your project root or any parent directory:

```bash
cp AGENTS.md /path/to/your/project/AGENTS.md
```

Codex picks it up automatically from the directory it operates in.

## Trigger

Say any of these to Claude Code / Codex:

- `create worktree for feature/my-branch`
- `new worktree my-feature`
- `set up isolated environment for branch X`
- `clean up worktree my-feature`

## How to Use

1. Tell Claude Code the branch name you want to work on.
2. The skill creates the worktree, installs dependencies, links a Herd `.test` domain, and copies your `.env`.
3. Work in the new directory — it's a full independent checkout.
4. When done, ask Claude Code to **clean up** the worktree to remove the directory and Herd link.

> Database is **shared** with the main project. Run migrations only if your branch adds them — they affect all worktrees.

## Steps Overview

| Step | What happens |
|------|-------------|
| 0 | Confirm branch name and base |
| 1 | `git worktree add` |
| 2 | Copy `.env`, install deps |
| 3 | `herd link` for `.test` domain |
| 4 | Run migrations if needed |
| 5 | Open in editor (optional) |
| 6 | Cleanup: remove worktree + unlink Herd |
