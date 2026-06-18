import { marked } from 'marked'
import DOMPurify from 'dompurify'
import JSZip from 'jszip'
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

function renderMarkdown(md) {
  return DOMPurify.sanitize(marked.parse(md))
}

async function prepareDownloadLink(container, skill) {
  const zip = new JSZip()
  const folder = zip.folder(skill.name)
  folder.file('README.md', skill.readme)
  folder.file('SKILL.md', skill.skill_md_raw)
  if (skill.agents_md) folder.file('AGENTS.md', skill.agents_md)
  const base64 = await zip.generateAsync({ type: 'base64' })
  const btn = container.querySelector('#download-btn')
  if (!btn) return
  const a = document.createElement('a')
  a.id = 'download-btn'
  a.className = btn.className
  a.textContent = '↓ download'
  a.href = `data:application/zip;base64,${base64}`
  a.download = `${skill.name}.zip`
  btn.replaceWith(a)
}

const TABS = [
  { id: 'readme', label: 'README.md' },
  { id: 'skill', label: 'SKILL.md' },
  { id: 'agents', label: 'AGENTS.md' },
]

export function renderContent(container, skill, activeTab = 'readme', onTabChange) {
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

  const tabsHtml = TABS.filter((t) => t.id !== 'agents' || skill.agents_md)
    .map(
      (t) => `
      <button
        data-tab="${escapeAttr(t.id)}"
        class="tab-btn font-mono text-[11px] px-3 py-1.5 border-b-2 transition-colors ${
          t.id === activeTab
            ? 'border-[#00ff64] text-[#00ff64]'
            : 'border-transparent text-[rgba(0,255,100,0.35)] hover:text-[rgba(0,255,100,0.65)] hover:border-[rgba(0,255,100,0.3)]'
        }"
      >${escapeHtml(t.label)}</button>`
    )
    .join('')

  const bodyContent =
    activeTab === 'readme'
      ? renderMarkdown(skill.readme)
      : activeTab === 'skill'
        ? renderMarkdown(skill.skill_md)
        : renderMarkdown(skill.agents_md ?? '')

  container.innerHTML = `
    <div class="p-4 sm:p-8 max-w-3xl">
      <div class="mb-6">
        <h1 class="font-mono text-[#00ff64] text-2xl font-bold mb-3 tracking-tight">${escapeHtml(skill.name)}</h1>
        <div class="flex flex-wrap gap-2 mb-3">${platformBadges}</div>
        <div class="flex flex-wrap gap-1.5">${tagChips}</div>
        ${skill.description ? `<p class="font-sans text-[rgba(255,255,255,0.45)] text-sm mt-3 leading-relaxed">${escapeHtml(skill.description)}</p>` : ''}
      </div>

      <div class="flex items-center justify-between border-b border-[rgba(0,255,100,0.1)] mb-6">
        <div class="flex gap-1">${tabsHtml}</div>
        <button
          id="download-btn"
          class="font-mono text-[11px] px-3 py-1.5 mb-1 border border-[rgba(0,255,100,0.25)] text-[rgba(0,255,100,0.5)] rounded-sm hover:border-[rgba(0,255,100,0.5)] hover:text-[rgba(0,255,100,0.85)] transition-colors"
        >↓ download</button>
      </div>

      <div class="prose-skills">${bodyContent}</div>
    </div>
  `

  container.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => onTabChange?.(btn.dataset.tab))
  })

  prepareDownloadLink(container, skill)
}
