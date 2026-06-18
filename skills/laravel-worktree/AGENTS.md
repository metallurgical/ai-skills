# Laravel Worktree Manager

You manage isolated Git worktree environments for Laravel feature development.

## Your Responsibilities

When the user asks to create a worktree, set up a feature environment, spin up an isolated branch, or develop multiple features in parallel — follow the steps below exactly and in order.

When the user asks to clean up or remove a worktree — follow the Cleanup steps below.

Always output the Completion Summary at the end of a create operation.

---

## Creating a Worktree

### Step 0: List branches and ask the user to pick a base

Run:
```bash
git branch
git branch -r
```

Present a numbered list combining local branches (mark them clearly). Ask: "Which branch should `<new-branch>` be based on?" Wait for the user's response. Store the answer as BASE_BRANCH. Default suggestion: `main`.

### Step 1: Derive paths

Run from the main project root:
```bash
MAIN_PATH=$(pwd)
PROJECT_NAME=$(basename "$MAIN_PATH")
PARENT_DIR=$(dirname "$MAIN_PATH")
BRANCH="feature/your-feature-name"
SUFFIX=$(echo "$BRANCH" | sed 's|.*/||' | sed 's|[^a-zA-Z0-9]|-|g' | tr '[:upper:]' '[:lower:]')
WORKTREE_PATH="$PARENT_DIR/${PROJECT_NAME}-${SUFFIX}"
```

### Step 2: Create the worktree and branch

```bash
git worktree add -b "$BRANCH" "$WORKTREE_PATH" "$BASE_BRANCH"
```

### Step 3: Detect package manager

Check the main project root for lock files in this priority order:
```bash
if [ -f "$MAIN_PATH/bun.lockb" ];        then PKG="bun install"
elif [ -f "$MAIN_PATH/pnpm-lock.yaml" ]; then PKG="pnpm install"
elif [ -f "$MAIN_PATH/yarn.lock" ];      then PKG="yarn install"
else                                          PKG="npm install"
fi
```

If multiple lock files exist, ask the user which package manager to use before continuing.

### Step 4: Set up the environment

```bash
cd "$WORKTREE_PATH"
cp "$MAIN_PATH/.env" .env
WORKTREE_DOMAIN="${PROJECT_NAME}-${SUFFIX}.test"
sed -i '' "s|^APP_URL=.*|APP_URL=https://${WORKTREE_DOMAIN}|" .env
php artisan key:generate --force
composer install --no-interaction --prefer-dist
$PKG
# Run the build with the same package manager:
# bun run build | pnpm run build | yarn build | npm run build
php artisan storage:link
php artisan config:clear
php artisan cache:clear
```

### Step 5: Migrations (run only if this branch adds migrations)

Check first:
```bash
git diff "$BASE_BRANCH" --name-only | grep database/migrations
```

Run migrations only if new migration files appear in the diff. Migrations run against the shared database and affect all worktrees.

### Step 6: Register with Herd

Run both commands. Do not ask the user to run them.

```bash
cd "$WORKTREE_PATH"
herd link
herd secure "${PROJECT_NAME}-${SUFFIX}"
herd secured | grep "${PROJECT_NAME}-${SUFFIX}"
```

### Completion Summary

Always output this after Step 6:

```
Worktree ready:

  Branch : <BRANCH>
  Path   : <WORKTREE_PATH>
  URL    : https://<PROJECT_NAME>-<SUFFIX>.test

herd secure was run. Before visiting the site:
  1. Fully quit your browser (Cmd+Q) — closing a tab is not enough
  2. Reopen browser
  3. Visit https://<PROJECT_NAME>-<SUFFIX>.test
```

---

## Cleaning Up a Worktree

Run all cleanup from the **main project root**.

### Step 1: List removable worktrees

```bash
git worktree list | tail -n +2
```

Present a numbered list (path + branch). Ask: "Which worktree do you want to remove?"

### Step 2: Confirm and collect info

Confirm TARGET_PATH and TARGET_BRANCH. Always ask: "Delete the `$TARGET_BRANCH` branch as well?"

### Step 3: Execute cleanup

```bash
SITE_NAME=$(basename "$TARGET_PATH")
herd unsecure "$SITE_NAME"
(cd "$TARGET_PATH" && herd unlink)
rm -rf "$TARGET_PATH"
git worktree prune
# Branch deletion only if user confirmed yes:
git branch -d "$TARGET_BRANCH"   # safe if merged
# git branch -D "$TARGET_BRANCH" # force if not merged (warn user first)
```

---

## Troubleshooting

**TLS warning in browser:** Run `herd secure "${PROJECT_NAME}-${SUFFIX}"` then quit and reopen the browser (Cmd+Q).

**Vite manifest not found:** Run `npm run build` (or bun/pnpm/yarn) from inside the worktree.

**Herd domain not resolving:** Run `herd restart`, then `cd "$WORKTREE_PATH" && herd link`.

**Worktree remove fails:** Run `git worktree remove --force "$WORKTREE_PATH"`.
