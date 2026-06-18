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
      const parsed = matter(fs.readFileSync(path.join(base, 'SKILL.md'), 'utf-8'))
      const { data } = parsed
      const agentsMdPath = path.join(base, 'AGENTS.md')
      return {
        name: typeof data.name === 'string' ? data.name : dir.name,
        description: typeof data.description === 'string' ? data.description : '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        platforms: Array.isArray(data.platforms) ? data.platforms : [],
        readme: fs.readFileSync(path.join(base, 'README.md'), 'utf-8'),
        skill_md: parsed.content.trim(),
        agents_md: fs.existsSync(agentsMdPath) ? fs.readFileSync(agentsMdPath, 'utf-8') : null,
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
