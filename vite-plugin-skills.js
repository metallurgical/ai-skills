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
