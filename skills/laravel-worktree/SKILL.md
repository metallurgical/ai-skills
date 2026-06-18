---
name: laravel-worktree
description: Manages isolated Git worktree environments for Laravel feature development with Herd .test domains.
tags: [laravel, git, php, herd, worktree]
platforms: [claude-code, codex]
---

# Laravel Worktree Manager

Manages isolated Git worktree environments for Laravel feature development. Each worktree is a full independent checkout with its own dependencies and Herd `.test` domain, sharing the main database.

## Key Decisions

- **Dependencies**: Fresh install per worktree — fully isolated. Package manager auto-detected from lock files; ask user if ambiguous.
- **Database**: Shared with main project — one DB, all worktrees. Only run migrations if your branch adds them; they affect all worktrees.
- **Herd domains**: Each worktree gets its own `.test` URL via `herd link`.

---

## Creating a Worktree

### Step 0 — Choose base branch

List all local and remote branches, then ask the user which one to base the new feature branch from.

```bash
# List local branches
git branch

# List remote branches (for reference)
git branch -r
```

Present a numbered list combining local branches (clearly marked). Example output:

```
Available branches:
  1. main
  2. develop
  3. feature/existing-feature
  4. remotes/origin/staging

Which branch should feature/your-feature-name be based on?
```

Wait for the user to pick. Store the choice as `BASE_BRANCH`. Default suggestion is `main` if the user is unsure.

### Step 1 — Derive paths

Run from the main project root:

```bash
MAIN_PATH=$(pwd)
PROJECT_NAME=$(basename "$MAIN_PATH")
PARENT_DIR=$(dirname "$MAIN_PATH")

# Convert branch name to a safe directory suffix
# e.g. feature/user-auth → user-auth
BRANCH="feature/your-feature-name"
SUFFIX=$(echo "$BRANCH" | sed 's|.*/||' | sed 's|[^a-zA-Z0-9]|-|g' | tr '[:upper:]' '[:lower:]')

WORKTREE_PATH="$PARENT_DIR/${PROJECT_NAME}-${SUFFIX}"
```

### Step 2 — Create the worktree + branch

Use `BASE_BRANCH` from Step 0 as the starting point for the new branch.

```bash
# New branch from chosen base (most common)
git worktree add -b "$BRANCH" "$WORKTREE_PATH" "$BASE_BRANCH"

# Or checkout an existing branch (no base needed)
git worktree add "$WORKTREE_PATH" "$BRANCH"
```

### Step 3 — Detect package manager

Check the main project root for lock files (in priority order):

```bash
# Detect which package manager this project uses
if [ -f "$MAIN_PATH/bun.lockb" ];        then PKG="bun install"
elif [ -f "$MAIN_PATH/pnpm-lock.yaml" ]; then PKG="pnpm install"
elif [ -f "$MAIN_PATH/yarn.lock" ];      then PKG="yarn install"
else                                          PKG="npm install"
fi
```

If multiple lock files exist (indicating a mismatch), ask the user which to use before proceeding.

### Step 4 — Set up the environment

```bash
cd "$WORKTREE_PATH"

# Copy .env from main (do NOT symlink — each worktree needs its own)
cp "$MAIN_PATH/.env" .env

# Patch APP_URL and APP_KEY in the copied .env
WORKTREE_DOMAIN="${PROJECT_NAME}-${SUFFIX}.test"
sed -i '' "s|^APP_URL=.*|APP_URL=https://${WORKTREE_DOMAIN}|" .env

# Generate a fresh app key (different from main — avoids session/cookie collisions)
php artisan key:generate --force

# Install dependencies fresh
composer install --no-interaction --prefer-dist
$PKG

# Build frontend assets (required — worktree has no public/build/ yet)
# Use same package manager as install
if   [ "$PKG" = "bun install" ];  then bun run build
elif [ "$PKG" = "pnpm install" ]; then pnpm run build
elif [ "$PKG" = "yarn install" ]; then yarn build
else                                   npm run build
fi

# Laravel bootstrap
php artisan storage:link
php artisan config:clear
php artisan cache:clear
```

### Step 5 — Migrations (conditional)

Only run if this branch introduces new migrations. Migrations run against the shared DB and affect all worktrees.

```bash
# Check first — diff against BASE_BRANCH chosen in Step 0
git diff "$BASE_BRANCH" --name-only | grep database/migrations

# Run only if needed
php artisan migrate
```

If the feature has **destructive or breaking schema changes**, create an isolated DB instead — see the Advanced section below.

### Step 6 — Register with Herd

**Both commands are mandatory — run them yourself, do not ask the user to run them.**

```bash
cd "$WORKTREE_PATH"
herd link
herd secure "${PROJECT_NAME}-${SUFFIX}"

# Confirm HTTPS is active before proceeding
herd secured | grep "${PROJECT_NAME}-${SUFFIX}"
```

Herd's CA root is pre-installed by Herd at install time — no extra trust step needed.

---

## Completion Summary

After all steps finish, output this summary to the user — **every time, no exceptions**:

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

## Listing Worktrees

```bash
git worktree list
```

Each entry shows: path, HEAD commit hash, and branch name.

---

## Switching Between Worktrees

Worktrees are independent directories — just `cd` to the one you want. No stashing, no branch switching.

```bash
cd "$WORKTREE_PATH"          # switch to feature worktree
cd "$MAIN_PATH"              # switch back to main
```

---

## Cleaning Up

Always run cleanup from the **main project root**. Present the user with a numbered list of removable worktrees, let them pick, then execute all steps in sequence.

### Step 1 — List removable worktrees

```bash
# Show all worktrees except main (first entry is always main)
git worktree list | tail -n +2
```

Present a numbered list to the user — path + branch name. Ask: "Which worktree do you want to remove?"

### Step 2 — Confirm and collect info

Before removing, confirm:
- The target worktree path (`TARGET_PATH`)
- The branch name (`TARGET_BRANCH`)
- **Always ask**: "Delete the `$TARGET_BRANCH` branch as well?" — never assume, always ask even if the branch looks merged

### Step 3 — Execute cleanup

```bash
SITE_NAME=$(basename "$TARGET_PATH")

# 1. Remove TLS certificate and nginx config
herd unsecure "$SITE_NAME"

# 2. Remove Herd site symlink
(cd "$TARGET_PATH" && herd unlink)

# 3. Wipe the worktree directory entirely
#    vendor/, node_modules/, public/build/, .env are all untracked — git worktree
#    remove refuses to delete dirs with untracked files, so rm -rf first
rm -rf "$TARGET_PATH"

# 4. Prune the now-missing worktree from git's internal state
git worktree prune

# 5. Branch deletion — only if user confirmed "yes" in Step 2
if git branch --merged main | grep -q "^  $TARGET_BRANCH$\|^\* $TARGET_BRANCH$"; then
  git branch -d "$TARGET_BRANCH"    # safe: already merged
else
  # Warn: branch not merged into main — confirm before force-deleting
  git branch -D "$TARGET_BRANCH"
fi
```

**What gets removed:**

| Artifact | Removed by |
|---|---|
| Worktree directory + all files (vendor/, node_modules/, .env, public/build/) | `rm -rf` |
| Git worktree registration | `git worktree prune` |
| Herd TLS cert (`.crt`, `.csr`, `.key`, `.conf`) | `herd unsecure` |
| Herd nginx config | `herd unsecure` |
| Herd Sites symlink | `herd unlink` |
| Feature branch | `git branch -d/-D` (if user confirmed) |
| Isolated DB | `mysql DROP` (if applicable — see Advanced section) |

Nothing is left behind.

### Cleanup with isolated DB

If the worktree used an isolated database (APP_URL in its .env points to a feature-specific DB), also drop it:

```bash
# Read DB name from the worktree's .env before removing
DB_NAME=$(grep "^DB_DATABASE=" "$TARGET_PATH/.env" | cut -d= -f2)
mysql -u root -e "DROP DATABASE \`$DB_NAME\`"
```

Only drop if `$DB_NAME` differs from the main project's DB — never drop the shared DB.

---

## Advanced: Isolated Database

Use when the feature has schema changes that would break other worktrees (column renames, drops, breaking migrations).

```bash
# 1. Edit .env in the worktree
#    Change DB_DATABASE to something feature-specific:
#    DB_DATABASE=myproject_feature_name

# 2. Create the database
mysql -u root -e "CREATE DATABASE myproject_feature_name CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# 3. Seed from main (optional — clone the schema)
php artisan migrate --seed
# OR import from main:
# mysqldump myproject | mysql myproject_feature_name

# Cleanup: drop DB when removing the worktree
mysql -u root -e "DROP DATABASE myproject_feature_name"
```

---

## Troubleshooting

**Browser shows "Your connection is not private" / TLS warning**

Two possible causes:

1. **Site not secured yet** — run from main:
```bash
herd secure "${PROJECT_NAME}-${SUFFIX}"
```

2. **Herd CA not trusted by OS** — check with:
```bash
security dump-trust-settings -d | grep -A5 "Laravel"
# "Number of trust settings : 0" means NOT trusted
```
Fix (one-time per machine, requires sudo):
```bash
sudo security add-trusted-cert -d -r trustRoot \
  -k /Library/Keychains/System.keychain \
  ~/Library/Application\ Support/Herd/config/valet/CA/LaravelValetCASelfSigned.pem
```
After running: **fully quit the browser (Cmd+Q) and reopen** — closing tabs is not enough.

**Vite manifest not found (`public/build/manifest.json`)**
```bash
cd "$WORKTREE_PATH" && npm run build   # or bun/pnpm/yarn — use project's package manager
```
Each worktree needs its own build. The build step is part of setup but can be re-run any time.

**Herd domain not resolving**
```bash
herd restart
# then re-run: herd link (from inside the worktree)
```

**Worktree remove fails**
```bash
# Force remove (loses uncommitted changes)
git worktree remove --force "$WORKTREE_PATH"
```

**Composer/package manager errors in worktree**
- Each worktree has its own vendor/ and node_modules/ — this is intentional.
- Check PHP version: `herd php:list` — ensure worktree uses same PHP as main.
- Key is auto-generated fresh per worktree — no manual `key:generate` needed.

**Migration conflicts between worktrees**
- Never run the same migration file from two worktrees against the shared DB — it will fail on the second run.
- Use isolated DB (see Advanced section) for migrations that mutate existing columns.

---

## Quick Reference

| Task | Command |
|------|---------|
| List worktrees | `git worktree list` |
| Add worktree | `git worktree add -b <branch> <path>` |
| Remove worktree | `git worktree remove <path>` |
| Register Herd site | `cd <path> && herd link` |
| Unregister Herd site | `cd <path> && herd unlink` |
| Check Herd sites | `herd sites` |
