# Skills Showcase Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a static Terminal/Hacker-themed skills showcase site (Vite + TailwindCSS) that renders skill markdown docs in a sidebar+content layout, hosted on GitHub Pages.

**Architecture:** Vite custom plugin reads `skills/*/SKILL.md` frontmatter + `README.md` at build time and bundles all data as a virtual ES module. Vanilla JS renders sidebar and markdown content client-side. Hash routing enables direct skill links.

**Tech Stack:** Vite 5, TailwindCSS 3, marked.js, highlight.js (Monokai), gray-matter (build-time), Vitest, GitHub Actions + GitHub Pages

## Global Constraints

- Node.js 20+
- No framework (vanilla JS only)
- Background: `#090909`, accent: `#00ff64`, fonts: JetBrains Mono + Inter
- All skill metadata lives in `SKILL.md` frontmatter; site displays `README.md`
- Hash routing only (`/#skill-name`) — no History API (GitHub Pages incompatible)
- Vite base must be set to `'/ai-skills/'` (repo name) for GitHub Pages asset paths

---

### Task 1: Project scaffold, dependencies, and config

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `.gitignore`
- Create: `index.html`

**Interfaces:**
- Produces: runnable `npm run dev`, `npm run build`, `npm test` scripts

- [ ] **Step 1: Scaffold Vite project**

```bash
cd /Users/metallurgical/projects/ai-skills
npm create vite@latest . -- --template vanilla
```

When prompted "Current directory is not empty. Remove existing files and continue?" — choose **Ignore files and continue**. When prompted for framework — choose **Vanilla**. When prompted for variant — choose **JavaScript**.

- [ ] **Step 2: Install dependencies**

```bash
npm install marked highlight.js
npm install -D tailwindcss@3 postcss autoprefixer gray-matter vitest
```

- [ ] **Step 3: Init Tailwind**

```bash
npx tailwindcss init -p
```

- [ ] **Step 4: Write `tailwind.config.js`**

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.js'],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

- [ ] **Step 5: Write `vite.config.js`**

```js
import { defineConfig } from 'vite'
import { skillsPlugin } from './vite-plugin-skills.js'

export default defineConfig({
  base: '/ai-skills/',
  plugins: [skillsPlugin('./skills')],
  test: {
    environment: 'node',
  },
})
```

- [ ] **Step 6: Write `.gitignore`**

```
node_modules/
dist/
.superpowers/
```

- [ ] **Step 7: Write `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AI Skills</title>
  <link rel="stylesheet" href="/src/style.css" />
</head>
<body class="bg-[#090909] text-white min-h-screen flex flex-col">

  <nav class="flex items-center justify-between px-6 py-4 border-b border-[rgba(0,255,100,0.08)] flex-shrink-0">
    <span class="font-mono font-bold text-[#00ff64] tracking-widest text-sm">▌ AI SKILLS</span>
    <span class="font-mono text-[rgba(0,255,100,0.3)] text-xs">claude-code · codex</span>
  </nav>

  <div class="flex flex-1 overflow-hidden">
    <aside
      id="sidebar"
      class="w-72 flex-shrink-0 border-r border-[rgba(0,255,100,0.08)] flex flex-col overflow-hidden bg-[rgba(0,255,100,0.02)]"
    ></aside>
    <main id="content" class="flex-1 overflow-y-auto"></main>
  </div>

  <script type="module" src="/src/main.js"></script>
</body>
</html>
```

- [ ] **Step 8: Delete Vite scaffold files we don't need**

```bash
rm -f src/counter.js src/javascript.svg public/vite.svg
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts at `http://localhost:5173/ai-skills/` with no errors (blank black page is fine at this stage).

- [ ] **Step 10: Commit**

```bash
git add package.json package-lock.json vite.config.js tailwind.config.js postcss.config.js .gitignore index.html src/
git commit -m "feat: scaffold Vite + Tailwind project"
```

---

### Task 2: Filter logic with tests

**Files:**
- Create: `src/filter.js`
- Create: `tests/filter.test.js`

**Interfaces:**
- Produces: `filterBySearch(skills, query) → Skill[]`, `filterByTags(skills, tags) → Skill[]`, `applyFilters(skills, { query, tags }) → Skill[]`
- Skill shape: `{ name: string, description: string, tags: string[] }`

- [ ] **Step 1: Write failing tests**

```bash
mkdir -p tests
```

Create `tests/filter.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { filterBySearch, filterByTags, applyFilters } from '../src/filter.js'

const skills = [
  { name: 'laravel-worktree', description: 'Manages git worktrees for Laravel', tags: ['laravel', 'git', 'php'] },
  { name: 'figma-generate', description: 'Generate Figma designs', tags: ['figma', 'design'] },
  { name: 'pest-tdd-expert', description: 'TDD with Pest for Laravel', tags: ['laravel', 'php', 'testing'] },
]

describe('filterBySearch', () => {
  it('returns all skills for empty query', () => {
    expect(filterBySearch(skills, '')).toHaveLength(3)
  })

  it('filters by name (case-insensitive)', () => {
    const result = filterBySearch(skills, 'FIGMA')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('figma-generate')
  })

  it('filters by description', () => {
    const result = filterBySearch(skills, 'worktrees')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('laravel-worktree')
  })

  it('returns empty array when nothing matches', () => {
    expect(filterBySearch(skills, 'zzznomatch')).toHaveLength(0)
  })
})

describe('filterByTags', () => {
  it('returns all skills for empty tags array', () => {
    expect(filterByTags(skills, [])).toHaveLength(3)
  })

  it('filters skills that include a single tag', () => {
    const result = filterByTags(skills, ['laravel'])
    expect(result.map(s => s.name)).toEqual(['laravel-worktree', 'pest-tdd-expert'])
  })

  it('uses AND logic for multiple tags', () => {
    const result = filterByTags(skills, ['laravel', 'git'])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('laravel-worktree')
  })

  it('returns empty array when no skill matches all tags', () => {
    expect(filterByTags(skills, ['laravel', 'figma'])).toHaveLength(0)
  })
})

describe('applyFilters', () => {
  it('chains search and tag filters', () => {
    const result = applyFilters(skills, { query: 'laravel', tags: ['git'] })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('laravel-worktree')
  })

  it('returns all skills when query is empty and tags are empty', () => {
    expect(applyFilters(skills, { query: '', tags: [] })).toHaveLength(3)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — "Cannot find module '../src/filter.js'"

- [ ] **Step 3: Write `src/filter.js`**

```js
export function filterBySearch(skills, query) {
  if (!query.trim()) return skills
  const q = query.toLowerCase()
  return skills.filter(
    (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  )
}

export function filterByTags(skills, tags) {
  if (!tags.length) return skills
  return skills.filter((s) => tags.every((tag) => s.tags.includes(tag)))
}

export function applyFilters(skills, { query, tags }) {
  return filterByTags(filterBySearch(skills, query), tags)
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — 9 tests, 0 failed

- [ ] **Step 5: Commit**

```bash
git add src/filter.js tests/filter.test.js
git commit -m "feat: add filter logic with tests"
```

---

### Task 3: Vite skills plugin with tests

**Files:**
- Create: `src/skills-loader.js`
- Create: `vite-plugin-skills.js`
- Create: `tests/skills-loader.test.js`
- Create: `tests/fixtures/skills/skill-alpha/SKILL.md`
- Create: `tests/fixtures/skills/skill-alpha/README.md`
- Create: `tests/fixtures/skills/skill-beta/SKILL.md`
- Create: `tests/fixtures/skills/skill-beta/README.md`
- Create: `tests/fixtures/skills/no-readme/SKILL.md`

**Interfaces:**
- Produces: `loadSkills(skillsDir: string) → Skill[]`
- Produces: virtual module `virtual:skills-data` exporting `export const skills: Skill[]`
- Skill shape: `{ name, description, tags, platforms, readme }`

- [ ] **Step 1: Write fixture files**

`tests/fixtures/skills/skill-alpha/SKILL.md`:
```markdown
---
name: skill-alpha
description: Alpha skill description
tags: [laravel, php]
platforms: [claude-code]
---
Skill body here.
```

`tests/fixtures/skills/skill-alpha/README.md`:
```markdown
# Skill Alpha
Alpha skill documentation.
```

`tests/fixtures/skills/skill-beta/SKILL.md`:
```markdown
---
name: skill-beta
description: Beta skill description
tags: [figma, design]
platforms: [claude-code, codex]
---
Skill body here.
```

`tests/fixtures/skills/skill-beta/README.md`:
```markdown
# Skill Beta
Beta skill documentation.
```

`tests/fixtures/skills/no-readme/SKILL.md`:
```markdown
---
name: no-readme
description: No readme skill
tags: []
platforms: []
---
No readme.
```

- [ ] **Step 2: Write failing tests**

`tests/skills-loader.test.js`:

```js
import { describe, it, expect } from 'vitest'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSkills } from '../src/skills-loader.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FIXTURES = path.join(__dirname, 'fixtures/skills')

describe('loadSkills', () => {
  it('returns skills sorted alphabetically by name', () => {
    const skills = loadSkills(FIXTURES)
    expect(skills.map((s) => s.name)).toEqual(['skill-alpha', 'skill-beta'])
  })

  it('extracts frontmatter fields correctly', () => {
    const skills = loadSkills(FIXTURES)
    expect(skills[0]).toMatchObject({
      name: 'skill-alpha',
      description: 'Alpha skill description',
      tags: ['laravel', 'php'],
      platforms: ['claude-code'],
    })
  })

  it('includes README.md body as readme string', () => {
    const skills = loadSkills(FIXTURES)
    expect(skills[0].readme).toContain('# Skill Alpha')
  })

  it('skips skill directories that have no README.md', () => {
    const skills = loadSkills(FIXTURES)
    expect(skills.find((s) => s.name === 'no-readme')).toBeUndefined()
  })

  it('returns empty array when directory does not exist', () => {
    expect(loadSkills('/nonexistent/path/xyz')).toEqual([])
  })
})
```

- [ ] **Step 3: Run tests to verify they fail**

```bash
npm test
```

Expected: FAIL — "Cannot find module '../src/skills-loader.js'"

- [ ] **Step 4: Write `src/skills-loader.js`**

```js
import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'

export function loadSkills(skillsDir) {
  if (!fs.existsSync(skillsDir)) return []

  return fs
    .readdirSync(skillsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .filter((e) => {
      const base = path.join(skillsDir, e.name)
      return fs.existsSync(path.join(base, 'SKILL.md')) && fs.existsSync(path.join(base, 'README.md'))
    })
    .map((dir) => {
      const base = path.join(skillsDir, dir.name)
      const { data } = matter(fs.readFileSync(path.join(base, 'SKILL.md'), 'utf-8'))
      const readme = fs.readFileSync(path.join(base, 'README.md'), 'utf-8')
      return {
        name: typeof data.name === 'string' ? data.name : dir.name,
        description: typeof data.description === 'string' ? data.description : '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        platforms: Array.isArray(data.platforms) ? data.platforms : [],
        readme,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test
```

Expected: PASS — 14 tests, 0 failed

- [ ] **Step 6: Write `vite-plugin-skills.js`**

```js
import path from 'node:path'
import { loadSkills } from './src/skills-loader.js'

const VIRTUAL_ID = 'virtual:skills-data'
const RESOLVED_ID = '\0' + VIRTUAL_ID

export function skillsPlugin(skillsDir) {
  const absDir = path.resolve(skillsDir)

  return {
    name: 'vite-plugin-skills',

    resolveId(id) {
      if (id === VIRTUAL_ID) return RESOLVED_ID
    },

    load(id) {
      if (id !== RESOLVED_ID) return
      const skills = loadSkills(absDir)
      return `export const skills = ${JSON.stringify(skills, null, 2)}`
    },

    configureServer(server) {
      server.watcher.add(absDir)
      server.watcher.on('change', (file) => {
        if (!file.startsWith(absDir)) return
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID)
        if (mod) server.moduleGraph.invalidateModule(mod)
        server.hot.send({ type: 'full-reload' })
      })
    },
  }
}
```

- [ ] **Step 7: Commit**

```bash
git add src/skills-loader.js vite-plugin-skills.js tests/skills-loader.test.js tests/fixtures/
git commit -m "feat: add Vite skills plugin with tests"
```

---

### Task 4: laravel-worktree skill files (README.md + AGENTS.md)

**Files:**
- Create: `skills/laravel-worktree/SKILL.md` (update existing — add `tags` and `platforms` frontmatter)
- Create: `skills/laravel-worktree/README.md`
- Create: `skills/laravel-worktree/AGENTS.md`

**Interfaces:**
- Produces: skill folder readable by `loadSkills()` and displayable on site

- [ ] **Step 1: Create skills directory and copy existing SKILL.md**

```bash
mkdir -p skills/laravel-worktree
cp /Users/metallurgical/.claude/skills/laravel-worktree/SKILL.md skills/laravel-worktree/SKILL.md
```

- [ ] **Step 2: Update `skills/laravel-worktree/SKILL.md` frontmatter**

Open `skills/laravel-worktree/SKILL.md` and replace its frontmatter block (the `---` section at the top) with:

```yaml
---
name: laravel-worktree
description: Manages isolated Git worktree environments for Laravel feature development with Herd .test domains.
tags: [laravel, git, php, herd, worktree]
platforms: [claude-code, codex]
---
```

Keep the entire body of the file unchanged after the closing `---`.

- [ ] **Step 3: Write `skills/laravel-worktree/README.md`**

```markdown
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
```

- [ ] **Step 4: Write `skills/laravel-worktree/AGENTS.md`**

```markdown
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
```

- [ ] **Step 5: Verify plugin picks up the skill**

```bash
npm run dev
```

Open `http://localhost:5173/ai-skills/` — no error in terminal. (Page still blank — sidebar/content not built yet.)

- [ ] **Step 6: Commit**

```bash
git add skills/
git commit -m "feat: add laravel-worktree skill (SKILL.md, README.md, AGENTS.md)"
```

---

### Task 5: CSS foundation

**Files:**
- Create: `src/style.css`

**Interfaces:**
- Produces: `.glass-panel`, `.skill-active`, `.tag-chip`, `.tag-chip-active`, `.prose-skills`, `.hljs-pre` CSS classes

- [ ] **Step 1: Write `src/style.css`**

```css
@import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Inter:wght@300;400;500;600&display=swap');
@import 'highlight.js/styles/monokai.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer components {
  .glass-panel {
    background: rgba(0, 255, 100, 0.02);
    border: 1px solid rgba(0, 255, 100, 0.10);
    backdrop-filter: blur(12px);
  }

  .skill-active {
    background: rgba(0, 255, 100, 0.07) !important;
    border-left: 2px solid #00ff64 !important;
    box-shadow: inset 0 0 20px rgba(0, 255, 100, 0.05), 0 0 8px rgba(0, 255, 100, 0.08);
    color: #00ff64 !important;
  }

  .tag-chip {
    @apply font-mono text-[10px] px-2 py-0.5 rounded-sm cursor-pointer transition-colors;
    border: 1px solid rgba(0, 255, 100, 0.25);
    color: rgba(0, 255, 100, 0.6);
    background: rgba(0, 255, 100, 0.04);
  }

  .tag-chip:hover {
    border-color: rgba(0, 255, 100, 0.5);
    color: rgba(0, 255, 100, 0.9);
  }

  .tag-chip-active {
    border-color: rgba(0, 255, 100, 0.7) !important;
    color: #00ff64 !important;
    background: rgba(0, 255, 100, 0.15) !important;
  }
}

/* Markdown prose */
.prose-skills h1 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.25rem;
  font-weight: 700;
  color: #00ff64;
  margin-top: 2rem;
  margin-bottom: 1rem;
}
.prose-skills h2 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.9rem;
  font-weight: 600;
  color: rgba(0, 255, 100, 0.8);
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.4rem;
  border-bottom: 1px solid rgba(0, 255, 100, 0.1);
  letter-spacing: 0.05em;
}
.prose-skills h3 {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.8rem;
  font-weight: 500;
  color: rgba(0, 255, 100, 0.65);
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
}
.prose-skills p {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.75;
  margin-bottom: 1rem;
}
.prose-skills ul,
.prose-skills ol {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}
.prose-skills ul { list-style-type: disc; }
.prose-skills ol { list-style-type: decimal; }
.prose-skills li {
  font-family: 'Inter', sans-serif;
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  margin-bottom: 0.25rem;
}
.prose-skills a {
  color: #00ff64;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.prose-skills strong {
  color: rgba(255, 255, 255, 0.9);
  font-weight: 600;
}
.prose-skills code {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  color: #00ff64;
  background: rgba(0, 255, 100, 0.08);
  padding: 0.15rem 0.4rem;
  border-radius: 2px;
  border: 1px solid rgba(0, 255, 100, 0.15);
}
.prose-skills pre code {
  background: none;
  border: none;
  padding: 0;
  color: inherit;
}
.prose-skills blockquote {
  border-left: 2px solid rgba(0, 255, 100, 0.3);
  padding-left: 1rem;
  color: rgba(255, 255, 255, 0.45);
  font-style: italic;
  margin: 1rem 0;
}
.prose-skills hr {
  border: none;
  border-top: 1px solid rgba(0, 255, 100, 0.1);
  margin: 2rem 0;
}
.prose-skills table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.5rem;
  font-size: 0.8rem;
}
.prose-skills th {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.7rem;
  color: rgba(0, 255, 100, 0.7);
  text-align: left;
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(0, 255, 100, 0.12);
  letter-spacing: 0.05em;
}
.prose-skills td {
  font-family: 'Inter', sans-serif;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.55);
  padding: 0.5rem 0.75rem;
  border: 1px solid rgba(0, 255, 100, 0.07);
}
.prose-skills tr:hover td {
  background: rgba(0, 255, 100, 0.03);
}

/* Code blocks */
.hljs-pre {
  background: #1a1a1a !important;
  border: 1px solid rgba(0, 255, 100, 0.1);
  border-radius: 3px;
  padding: 1rem;
  margin-bottom: 1rem;
  overflow-x: auto;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.75rem;
  line-height: 1.65;
}
.hljs-pre .hljs {
  background: none;
  padding: 0;
}

/* Scrollbar */
::-webkit-scrollbar { width: 4px; height: 4px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(0, 255, 100, 0.2); border-radius: 2px; }
::-webkit-scrollbar-thumb:hover { background: rgba(0, 255, 100, 0.4); }
```

- [ ] **Step 2: Verify styles load in dev server**

```bash
npm run dev
```

Open browser, inspect `<body>` — should have dark background (`#090909`). No console errors.

- [ ] **Step 3: Commit**

```bash
git add src/style.css
git commit -m "feat: add CSS foundation (Tailwind + glass + prose styles)"
```

---

### Task 6: Shared utilities

**Files:**
- Create: `src/utils.js`

**Interfaces:**
- Produces: `escapeHtml(str: string) → string`, `escapeAttr(str: string) → string`

- [ ] **Step 1: Write `src/utils.js`**

```js
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function escapeAttr(str) {
  return String(str).replace(/"/g, '&quot;')
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils.js
git commit -m "feat: add HTML escape utilities"
```

---

### Task 7: Sidebar component

**Files:**
- Create: `src/sidebar.js`

**Interfaces:**
- Consumes: `applyFilters` from `./filter.js`, `escapeHtml`/`escapeAttr` from `./utils.js`
- Consumes: `skills: Skill[]`, `selectedName: string|null`, `activeTags: string[]`, `searchQuery: string`
- Consumes callbacks: `onSelect(name: string)`, `onSearch(query: string)`, `onTagToggle(tag: string)`
- Produces: DOM rendered into `container` element, events wired up

- [ ] **Step 1: Write `src/sidebar.js`**

```js
import { applyFilters } from './filter.js'
import { escapeHtml, escapeAttr } from './utils.js'

export function renderSidebar(container, { skills, selectedName, activeTags, searchQuery, onSelect, onSearch, onTagToggle }) {
  const allTags = [...new Set(skills.flatMap((s) => s.tags))].sort()
  const filtered = applyFilters(skills, { query: searchQuery, tags: activeTags })

  container.innerHTML = `
    <div class="p-4 border-b border-[rgba(0,255,100,0.08)]">
      <div class="font-mono text-[10px] text-[rgba(0,255,100,0.5)] tracking-[3px] mb-3">SKILLS</div>
      <input
        id="search-input"
        type="text"
        placeholder="search..."
        value="${escapeAttr(searchQuery)}"
        class="w-full bg-[rgba(0,255,100,0.03)] border border-[rgba(0,255,100,0.15)] text-[rgba(0,255,100,0.8)] placeholder-[rgba(0,255,100,0.25)] font-mono text-xs px-3 py-2 rounded-sm focus:outline-none focus:border-[rgba(0,255,100,0.35)] transition-colors"
      />
    </div>

    <div id="skill-list" class="flex-1 overflow-y-auto p-2">
      ${
        filtered.length === 0
          ? `<p class="font-mono text-[10px] text-[rgba(0,255,100,0.2)] p-3 text-center">no skills match</p>`
          : filtered
              .map(
                (skill) => `
        <button
          data-skill="${escapeAttr(skill.name)}"
          class="skill-item w-full text-left px-3 py-2.5 mb-0.5 rounded-sm font-mono transition-all border-l-2 border-transparent ${
            skill.name === selectedName
              ? 'skill-active'
              : 'text-[rgba(0,255,100,0.45)] hover:text-[rgba(0,255,100,0.75)] hover:bg-[rgba(0,255,100,0.03)]'
          }"
        >
          <div class="text-xs font-medium mb-1.5 truncate">${escapeHtml(skill.name)}</div>
          <div class="flex flex-wrap gap-1">
            ${skill.tags
              .slice(0, 3)
              .map((t) => `<span class="tag-chip pointer-events-none">${escapeHtml(t)}</span>`)
              .join('')}
          </div>
        </button>
      `
              )
              .join('')
      }
    </div>

    ${
      allTags.length > 0
        ? `
    <div class="p-3 border-t border-[rgba(0,255,100,0.08)]">
      <div class="font-mono text-[9px] text-[rgba(0,255,100,0.35)] tracking-[2px] mb-2">FILTER BY TAG</div>
      <div class="flex flex-wrap gap-1.5">
        ${allTags
          .map(
            (tag) =>
              `<button data-tag="${escapeAttr(tag)}" class="tag-chip ${activeTags.includes(tag) ? 'tag-chip-active' : ''}">${escapeHtml(tag)}</button>`
          )
          .join('')}
      </div>
    </div>`
        : ''
    }
  `

  container.querySelector('#search-input')?.addEventListener('input', (e) => onSearch(e.target.value))

  container.querySelectorAll('.skill-item').forEach((btn) => {
    btn.addEventListener('click', () => onSelect(btn.dataset.skill))
  })

  container.querySelectorAll('[data-tag]').forEach((btn) => {
    btn.addEventListener('click', () => onTagToggle(btn.dataset.tag))
  })
}
```

- [ ] **Step 2: Commit**

```bash
git add src/sidebar.js
git commit -m "feat: add sidebar component"
```

---

### Task 8: Content renderer

**Files:**
- Create: `src/content.js`

**Interfaces:**
- Consumes: `marked` from `marked`, `hljs` from `highlight.js/lib/core` + language packs
- Consumes: `skill: Skill | null` — renders README.md or empty state
- Consumes: `escapeHtml`/`escapeAttr` from `./utils.js`
- Produces: DOM rendered into `container` element

- [ ] **Step 1: Write `src/content.js`**

```js
import { marked } from 'marked'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import javascript from 'highlight.js/lib/languages/javascript'
import php from 'highlight.js/lib/languages/php'
import yaml from 'highlight.js/lib/languages/yaml'
import markdown from 'highlight.js/lib/languages/markdown'
import { escapeHtml, escapeAttr } from './utils.js'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('shell', bash)
hljs.registerLanguage('sh', bash)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('js', javascript)
hljs.registerLanguage('php', php)
hljs.registerLanguage('yaml', yaml)
hljs.registerLanguage('yml', yaml)
hljs.registerLanguage('markdown', markdown)
hljs.registerLanguage('md', markdown)

const renderer = new marked.Renderer()
renderer.code = ({ text, lang }) => {
  const language = lang && hljs.getLanguage(lang) ? lang : null
  const highlighted = language
    ? hljs.highlight(text, { language }).value
    : hljs.highlightAuto(text).value
  const langAttr = language ? escapeAttr(language) : 'plaintext'
  return `<pre class="hljs-pre"><code class="hljs language-${langAttr}">${highlighted}</code></pre>`
}

marked.use({ renderer, gfm: true })

export function renderContent(container, skill) {
  if (!skill) {
    container.innerHTML = `
      <div class="flex items-center justify-center h-full">
        <span class="font-mono text-[rgba(0,255,100,0.15)] text-sm tracking-widest">select a skill</span>
      </div>
    `
    return
  }

  const platformBadges = skill.platforms
    .map(
      (p) =>
        `<span class="font-mono text-[10px] px-2 py-0.5 border border-[rgba(0,255,100,0.2)] text-[rgba(0,255,100,0.45)] rounded-sm">${escapeHtml(p)}</span>`
    )
    .join('')

  const tagChips = skill.tags
    .map((t) => `<span class="tag-chip pointer-events-none">${escapeHtml(t)}</span>`)
    .join('')

  container.innerHTML = `
    <div class="p-8 max-w-3xl">
      <div class="mb-8">
        <h1 class="font-mono text-[#00ff64] text-2xl font-bold mb-3 tracking-tight">${escapeHtml(skill.name)}</h1>
        <div class="flex flex-wrap gap-2 mb-3">${platformBadges}</div>
        <div class="flex flex-wrap gap-1.5">${tagChips}</div>
        ${skill.description ? `<p class="font-sans text-[rgba(255,255,255,0.45)] text-sm mt-3 leading-relaxed">${escapeHtml(skill.description)}</p>` : ''}
      </div>
      <div class="prose-skills">
        ${marked.parse(skill.readme)}
      </div>
    </div>
  `
}
```

- [ ] **Step 2: Commit**

```bash
git add src/content.js
git commit -m "feat: add content renderer (marked + highlight.js)"
```

---

### Task 9: App shell with hash routing

**Files:**
- Create: `src/main.js`

**Interfaces:**
- Consumes: `skills` from `virtual:skills-data`
- Consumes: `renderSidebar` from `./sidebar.js`
- Consumes: `renderContent` from `./content.js`
- Produces: working app — sidebar renders skill list, clicking a skill renders its README, URL hash updates

- [ ] **Step 1: Write `src/main.js`**

```js
import { skills } from 'virtual:skills-data'
import { renderSidebar } from './sidebar.js'
import { renderContent } from './content.js'

const sidebar = document.getElementById('sidebar')
const content = document.getElementById('content')

const state = {
  selectedSkill: null,
  activeTags: [],
  searchQuery: '',
}

function findSkill(name) {
  return skills.find((s) => s.name === name) ?? null
}

function update() {
  renderSidebar(sidebar, {
    skills,
    selectedName: state.selectedSkill?.name ?? null,
    activeTags: state.activeTags,
    searchQuery: state.searchQuery,
    onSelect(name) {
      state.selectedSkill = findSkill(name)
      window.location.hash = name
      update()
    },
    onSearch(query) {
      state.searchQuery = query
      update()
    },
    onTagToggle(tag) {
      state.activeTags = state.activeTags.includes(tag)
        ? state.activeTags.filter((t) => t !== tag)
        : [...state.activeTags, tag]
      update()
    },
  })

  renderContent(content, state.selectedSkill)
}

// Hash routing — restore selection from URL on load
const hashSkill = findSkill(window.location.hash.slice(1))
if (hashSkill) {
  state.selectedSkill = hashSkill
} else if (skills.length > 0) {
  state.selectedSkill = skills[0]
  window.location.hash = skills[0].name
}

update()
```

- [ ] **Step 2: Verify full app works in dev**

```bash
npm run dev
```

Open `http://localhost:5173/ai-skills/`. Expected:
- Left sidebar shows "laravel-worktree" with tags
- Right panel shows the README content with syntax-highlighted code blocks
- Clicking tag filters sidebar
- Search input narrows skill list
- URL updates to `/#laravel-worktree`
- Refreshing the page restores the same selected skill

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: PASS — all 14 tests

- [ ] **Step 4: Commit**

```bash
git add src/main.js
git commit -m "feat: add app shell with hash routing"
```

---

### Task 10: Build verification and GitHub Actions deploy

**Files:**
- Create: `.github/workflows/deploy.yml`

**Interfaces:**
- Produces: `dist/` served correctly on GitHub Pages at `https://<user>.github.io/ai-skills/`

- [ ] **Step 1: Verify production build**

```bash
npm run build
```

Expected: `dist/` directory created, no errors. Check that `dist/index.html` references `/ai-skills/assets/...` paths.

- [ ] **Step 2: Preview the production build**

```bash
npm run preview
```

Open `http://localhost:4173/ai-skills/`. Verify the same behavior as dev: skill list, markdown rendering, tag filter, search, hash routing.

- [ ] **Step 3: Write `.github/workflows/deploy.yml`**

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: pages
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: npm

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build

      - name: Upload pages artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

- [ ] **Step 4: Enable GitHub Pages in repo settings**

In your GitHub repo:
1. Go to **Settings → Pages**
2. Set **Source** to **GitHub Actions**
3. Save

- [ ] **Step 5: Add `.superpowers/` to `.gitignore` (if not already)**

Open `.gitignore` and confirm `.superpowers/` is present. If not, add it.

- [ ] **Step 6: Final commit**

```bash
git add .github/ .gitignore
git commit -m "feat: add GitHub Actions deploy workflow"
```

- [ ] **Step 7: Push to GitHub**

```bash
git remote add origin https://github.com/<your-username>/ai-skills.git
git push -u origin main
```

Expected: GitHub Actions runs, builds, and deploys. Site live at `https://<your-username>.github.io/ai-skills/`.

---

## Adding More Skills Later

To add a new skill:
1. Create `skills/<skill-name>/` directory
2. Add `SKILL.md` with frontmatter (`name`, `description`, `tags`, `platforms`) and skill body
3. Add `README.md` with human-readable documentation
4. Add `AGENTS.md` with Codex-formatted instructions
5. Commit and push — GitHub Actions rebuilds and redeploys automatically
