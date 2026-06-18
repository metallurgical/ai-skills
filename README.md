# AI Skills

A static showcase site for AI coding skills — compatible with Claude Code and OpenAI Codex.

**Live:** https://metallurgical.github.io/ai-skills/

---

## What It Is

Each skill is a folder under `skills/` containing three files:

| File | Purpose |
|------|---------|
| `SKILL.md` | Claude Code — frontmatter metadata + skill body |
| `README.md` | Human-readable docs displayed on the site |
| `AGENTS.md` | OpenAI Codex — imperative instructions |

The site renders `README.md` in a terminal-dark UI with search, tag filtering, and platform filtering. Users can switch between the simplified README, full SKILL.md, and AGENTS.md via tabs, and download the skill folder as a `.zip`.

---

## Adding a Skill

```bash
mkdir skills/my-skill
```

Create `skills/my-skill/SKILL.md`:

```yaml
---
name: my-skill
description: Short description of what this skill does.
tags: [laravel, php, git]
platforms: [claude-code, codex]
---

# Skill body here (Claude Code reads this)
```

Create `skills/my-skill/README.md` with sections:
- Intro
- Install
- Trigger
- How to Use

Create `skills/my-skill/AGENTS.md` with imperative Codex instructions.

Push to `main` — GitHub Actions builds and deploys automatically.

---

## Tech Stack

- **Vite** — build tool + custom virtual module plugin for skill data
- **TailwindCSS v3** — styling
- **marked.js** — markdown rendering
- **highlight.js** — syntax highlighting (Monokai)
- **DOMPurify** — XSS sanitization
- **JSZip** — client-side zip download
- **Vitest** — unit tests
- **GitHub Actions** — CI/CD → GitHub Pages

---

## Local Development

```bash
npm install
npm run dev
```

Site runs at `http://localhost:5173/ai-skills/`.

```bash
npm test          # run tests
npm run build     # production build → dist/
npm run preview   # preview production build
```

---

## Deploy

Automatic on push to `main` via `.github/workflows/deploy.yml`.

Manual: Settings → Pages → Source: **GitHub Actions**.

---

## Skills

| Skill | Description | Platforms |
|-------|-------------|-----------|
| [laravel-worktree](skills/laravel-worktree/README.md) | Isolated Git worktree environments for Laravel feature branches | claude-code, codex |

---

Built by [Norlihazmey](https://github.com/metallurgical)
