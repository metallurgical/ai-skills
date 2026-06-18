import { marked } from 'marked'
import DOMPurify from 'dompurify'
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
        ${DOMPurify.sanitize(marked.parse(skill.readme))}
      </div>
    </div>
  `
}
