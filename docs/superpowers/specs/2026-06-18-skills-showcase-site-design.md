# Skills Showcase Site — Design Spec

**Date:** 2026-06-18  
**Status:** Approved

---

## Overview

A static skills showcase site that lists AI coding skills (for Claude Code, OpenAI Codex, and other runtimes) with a Terminal/Hacker glassmorphic dark aesthetic. Built with Vite + TailwindCSS, hosted on GitHub Pages.

---

## Visual Design

**Theme:** Terminal / Hacker  
**Background:** `#090909` (near-black)  
**Primary accent:** `#00ff64` (green)  
**Secondary text:** `rgba(0,255,100,0.6)`  
**Borders:** `rgba(0,255,100,0.12)` to `rgba(0,255,100,0.20)`  
**Glass panels:** `backdrop-filter: blur(12px)` + `rgba(0,255,100,0.04)` bg  
**Fonts:** JetBrains Mono (sidebar, code blocks, tags) + Inter (content body prose)  
**Code theme:** Monokai (via highlight.js)

Active skill in sidebar: left border `#00ff64` + faint green glow (`box-shadow: 0 0 12px rgba(0,255,100,0.15)`)

---

## Stack

| Layer | Choice |
|---|---|
| Build tool | Vite |
| CSS | TailwindCSS v3 |
| Markdown render | marked.js |
| Syntax highlight | highlight.js (Monokai) |
| Hosting | GitHub Pages (`gh-pages` branch) |
| Deploy | GitHub Actions (push to `main` → build → deploy) |
| JS | Vanilla (no framework) |

---

## Repository Structure

```
ai-skills/
├── skills/
│   └── laravel-worktree/
│       ├── SKILL.md      ← Claude Code (frontmatter metadata + skill body)
│       ├── README.md     ← Site display content (also Codex-readable)
│       └── AGENTS.md     ← OpenAI Codex format (imperative, system-prompt style)
├── src/
│   ├── main.js           ← App entry, skill loader, router
│   ├── sidebar.js        ← Sidebar component (list + tag filter + search)
│   ├── content.js        ← Markdown renderer
│   ├── style.css         ← Tailwind + custom glass/glow utilities
│   └── skills-data.js    ← Auto-generated at build time (Vite plugin)
├── index.html
├── vite.config.js        ← Includes custom plugin to read skills/*.*/SKILL.md
├── tailwind.config.js
├── .github/
│   └── workflows/
│       └── deploy.yml    ← Build + gh-pages deploy on push to main
└── docs/
    └── superpowers/specs/
        └── 2026-06-18-skills-showcase-site-design.md
```

---

## Skill File Structure

### `SKILL.md` (Claude Code — frontmatter is source of truth for metadata)

```yaml
---
name: laravel-worktree
description: Manages isolated Git worktree environments for Laravel feature development.
tags: [laravel, git, php, herd]
platforms: [claude-code, codex]
---

# Skill body here (Claude Code reads this)
```

### `README.md` (Site display — human-readable, Codex also reads this)

Standard markdown:
- `# Title`
- Description paragraph
- `## Overview`
- `## Installation`
- `## How to Use`
- `## Trigger Phrases` (how to invoke the skill)
- `## Steps` (numbered walkthrough)
- `## Troubleshooting`

### `AGENTS.md` (OpenAI Codex — imperative tone, system-prompt style)

Same information as README.md but written as direct instructions:
- No decorative headers beyond H2
- Imperative voice ("Run X", "Check Y", "If Z then W")
- Code blocks preserved exactly
- No conversational prose

---

## Data Flow (Build Time)

1. Vite custom plugin scans `skills/*/SKILL.md`
2. Extracts frontmatter: `name`, `description`, `tags`, `platforms`
3. Reads `skills/*/README.md` as raw markdown string
4. Bundles all skills as a single JSON array into `src/skills-data.js`
5. Client receives fully baked data — zero runtime fetching

```js
// skills-data.js (auto-generated, do not edit)
export const skills = [
  {
    name: "laravel-worktree",
    description: "Manages isolated Git worktree...",
    tags: ["laravel", "git", "php", "herd"],
    platforms: ["claude-code", "codex"],
    readme: "# Laravel Worktree Manager\n\n..."
  }
]
```

---

## Site Layout

```
┌─────────────────────────────────────────────────────┐
│  ▌ SKILLS.DEV                          [search bar] │
├──────────────────┬──────────────────────────────────┤
│  SKILLS          │  laravel-worktree          [tags] │
│                  │  ─────────────────────────────── │
│  ▶ laravel-      │  # Laravel Worktree Manager       │
│    worktree      │                                   │
│  · figma-gen     │  Manages isolated Git worktree...│
│  · pest-tdd      │                                   │
│                  │  ## Creating a Worktree           │
│  FILTER BY TAG   │  ```bash                          │
│  [laravel] [git] │  git worktree add ...             │
│  [php] [claude]  │  ```                              │
└──────────────────┴──────────────────────────────────┘
```

**Sidebar (left, ~280px fixed):**
- Search input (filters skill list in real-time, client-side)
- Skill list: each item shows name + tag chips
- Active item: `#00ff64` left border + green glow
- Tag filter section below list: click tag to filter (multi-select = AND logic)
- Glass panel: `backdrop-filter: blur(12px)`, green-tinted border

**Content (right, flex-1):**
- Skill name heading + platform badges + tag chips at top
- README.md body rendered as styled markdown
- Code blocks: Monokai highlight, monospace font, green-tinted bg
- Scrollable independently of sidebar

---

## Components

| Component | File | Responsibility |
|---|---|---|
| App shell | `main.js` | Init, skill selection state, URL hash routing |
| Sidebar | `sidebar.js` | List render, search filter, tag filter |
| Content | `content.js` | marked.js render, highlight.js init |
| TagBadge | inline | Pill chip — JetBrains Mono, green-tinted glass |
| SearchBar | inline in sidebar | Real-time filter input |

URL hash routing: `/#laravel-worktree` → selects that skill on load. Enables direct linking.

---

## Tagging System

- Tags defined in `SKILL.md` frontmatter as array
- All unique tags collected at build time → filter chips rendered in sidebar
- Click tag: filter sidebar to skills matching that tag
- Multi-tag: AND logic (skill must have ALL selected tags)
- Active tag chips visually highlighted (filled green bg)

---

## GitHub Pages Deploy

**GitHub Actions workflow** (`.github/workflows/deploy.yml`):
1. Trigger: push to `main`
2. `npm ci`
3. `npm run build` → `dist/`
4. Deploy `dist/` to `gh-pages` branch via `actions/deploy-pages`

**Vite base URL** set to `/<repo-name>/` in `vite.config.js` for correct asset paths on GitHub Pages.

---

## OpenAI Codex Compatibility

Each skill folder ships `AGENTS.md`:
- Written in imperative voice
- Mirrors README.md content, reformatted for Codex consumption
- No fluff — direct instructions only
- Codex reads `AGENTS.md` from the directory it operates in

Users who clone this repo and work in a skill folder get Codex-compatible instructions automatically.

---

## Out of Scope

- Backend / server-side rendering
- Authentication
- Skill editing from the UI
- Dark/light theme toggle (always dark)
- Comments or ratings
