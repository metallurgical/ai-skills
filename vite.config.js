import { defineConfig } from 'vite'
import { skillsPlugin } from './vite-plugin-skills.js'

export default defineConfig({
  base: '/ai-skills/',
  plugins: [skillsPlugin('./skills')],
  test: {
    environment: 'node',
  },
})
