# Laravel Worktree Manager

Manages isolated Git worktree environments for Laravel feature development. Each worktree is a full independent checkout with its own dependencies and Herd `.test` domain, sharing the main database.

## Overview

Use this skill when:
- Creating a feature branch that needs its own dev environment
- Working on multiple Laravel features in parallel without context-switching
- Spinning up or tearing down isolated `.test` sites

**Key decisions:**
- **Dependencies:** Fresh install per worktree — fully isolated.
- **Database:** Shared with main project — one DB, all worktrees. Run migrations only if your branch adds them.
- **Herd domains:** Each worktree gets its own `.test` URL via `herd link`.

## Installation

### Claude Code

```bash
cp -r skills/laravel-worktree ~/.claude/skills/
```

Restart Claude Code. The skill auto-activates on trigger phrases.

### OpenAI Codex

Copy `AGENTS.md` from this folder into your Laravel project root, or place it in the `.codex/` directory. Codex reads it automatically when you run prompts from that directory.

## Trigger Phrases

The skill activates when you use any of these phrases:

- `"new worktree"`
- `"feature environment"`
- `"worktree setup"`
- `"isolated branch"`
- `"parallel feature"`
- `"spin up feature"`
- `"create worktree"`
- Any request to develop multiple features simultaneously

## How to Use

Tell your AI assistant: **"Create a new worktree for feature/my-feature"**

The assistant will:
1. List available branches and ask which to base the feature on
2. Derive the worktree path (`../project-my-feature/`)
3. Copy and patch `.env`, generate a fresh app key
4. Run `composer install` + frontend package install + `npm run build`
5. Run `php artisan storage:link`, `config:clear`, `cache:clear`
6. Register the site with Herd (`herd link` + `herd secure`)
7. Show you the final URL

## Steps

### Creating a Worktree

**Step 0 — Choose base branch**

```bash
git branch        # list local branches
git branch -r     # list remote branches
```

Pick which branch the new feature branch starts from. Default: `main`.

**Step 1 — Derive paths**

```bash
MAIN_PATH=$(pwd)
PROJECT_NAME=$(basename "$MAIN_PATH")
PARENT_DIR=$(dirname "$MAIN_PATH")
BRANCH="feature/your-feature-name"
SUFFIX=$(echo "$BRANCH" | sed 's|.*/||' | sed 's|[^a-zA-Z0-9]|-|g' | tr '[:upper:]' '[:lower:]')
WORKTREE_PATH="$PARENT_DIR/${PROJECT_NAME}-${SUFFIX}"
```

**Step 2 — Create the worktree + branch**

```bash
git worktree add -b "$BRANCH" "$WORKTREE_PATH" "$BASE_BRANCH"
```

**Step 3 — Detect package manager**

```bash
if [ -f bun.lockb ];        then PKG="bun install"
elif [ -f pnpm-lock.yaml ]; then PKG="pnpm install"
elif [ -f yarn.lock ];      then PKG="yarn install"
else                             PKG="npm install"
fi
```

**Step 4 — Set up the environment**

```bash
cd "$WORKTREE_PATH"
cp "$MAIN_PATH/.env" .env
sed -i '' "s|^APP_URL=.*|APP_URL=https://${PROJECT_NAME}-${SUFFIX}.test|" .env
php artisan key:generate --force
composer install --no-interaction --prefer-dist
$PKG
# build with same package manager:
# bun run build / pnpm run build / yarn build / npm run build
php artisan storage:link
php artisan config:clear
php artisan cache:clear
```

**Step 5 — Migrations (conditional)**

Only if this branch adds new migrations:

```bash
git diff "$BASE_BRANCH" --name-only | grep database/migrations
php artisan migrate
```

**Step 6 — Register with Herd**

```bash
cd "$WORKTREE_PATH"
herd link
herd secure "${PROJECT_NAME}-${SUFFIX}"
herd secured | grep "${PROJECT_NAME}-${SUFFIX}"
```

### Completion Summary

```
Worktree ready:

  Branch : feature/your-feature-name
  Path   : /path/to/project-your-feature-name
  URL    : https://project-your-feature-name.test

herd secure was run. Before visiting the site:
  1. Fully quit your browser (Cmd+Q)
  2. Reopen browser
  3. Visit https://project-your-feature-name.test
```

### Listing Worktrees

```bash
git worktree list
```

### Switching Between Worktrees

```bash
cd "$WORKTREE_PATH"   # switch to feature worktree
cd "$MAIN_PATH"       # switch back to main
```

### Cleaning Up

Run from the **main project root**:

```bash
# 1. List removable worktrees (skip the first — that's main)
git worktree list | tail -n +2

# 2. Confirm which to remove, then:
SITE_NAME=$(basename "$TARGET_PATH")
herd unsecure "$SITE_NAME"
(cd "$TARGET_PATH" && herd unlink)
rm -rf "$TARGET_PATH"
git worktree prune
git branch -d "$TARGET_BRANCH"   # or -D if not merged
```

## Troubleshooting

**Browser shows "Your connection is not private"**

Run from project root:
```bash
herd secure "${PROJECT_NAME}-${SUFFIX}"
```
Then fully quit and reopen your browser (Cmd+Q — closing tabs is not enough).

**Vite manifest not found**
```bash
cd "$WORKTREE_PATH" && npm run build
```

**Herd domain not resolving**
```bash
herd restart
cd "$WORKTREE_PATH" && herd link
```

**Worktree remove fails**
```bash
git worktree remove --force "$WORKTREE_PATH"
```

## Quick Reference

| Task | Command |
|------|---------|
| List worktrees | `git worktree list` |
| Add worktree | `git worktree add -b <branch> <path> <base>` |
| Remove worktree | `git worktree remove <path>` |
| Register Herd site | `cd <path> && herd link` |
| Secure Herd site | `herd secure <site-name>` |
| Check Herd sites | `herd sites` |
