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

  it('includes skill_md as SKILL.md body after frontmatter', () => {
    const skills = loadSkills(FIXTURES)
    expect(skills[0].skill_md).toBe('Skill body here.')
    expect(skills[0].skill_md).not.toContain('---')
  })

  it('includes agents_md when AGENTS.md exists, null when absent', () => {
    const skills = loadSkills(FIXTURES)
    expect(skills[0].agents_md).toContain('## Skill Alpha')
    expect(skills[1].agents_md).toBeNull()
  })

  it('skips skill directories that have no README.md', () => {
    const skills = loadSkills(FIXTURES)
    expect(skills.find((s) => s.name === 'no-readme')).toBeUndefined()
  })

  it('returns empty array when directory does not exist', () => {
    expect(loadSkills('/nonexistent/path/xyz')).toEqual([])
  })
})
