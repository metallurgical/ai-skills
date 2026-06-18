import { applyFilters } from './filter.js'
import { escapeHtml, escapeAttr } from './utils.js'

export function renderSidebar(container, { skills, selectedName, activeTags, activePlatforms, searchQuery, onSelect, onSearch, onTagToggle, onPlatformToggle }) {
  const allTags = [...new Set(skills.flatMap((s) => s.tags))].sort()
  const allPlatforms = [...new Set(skills.flatMap((s) => s.platforms))].sort()
  const filtered = applyFilters(skills, { query: searchQuery, tags: activeTags, platforms: activePlatforms })

  const searchHadFocus = document.activeElement?.id === 'search-input'

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
      allPlatforms.length > 0
        ? `
    <div class="p-3 border-t border-[rgba(0,255,100,0.08)]">
      <div class="font-mono text-[9px] text-[rgba(0,255,100,0.35)] tracking-[2px] mb-2">FILTER BY PLATFORM</div>
      <div class="flex flex-wrap gap-1.5">
        ${allPlatforms
          .map(
            (p) =>
              `<button data-platform="${escapeAttr(p)}" class="tag-chip ${activePlatforms.includes(p) ? 'tag-chip-active' : ''}">${escapeHtml(p)}</button>`
          )
          .join('')}
      </div>
    </div>`
        : ''
    }

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

  const searchInput = container.querySelector('#search-input')
  searchInput?.addEventListener('input', (e) => onSearch(e.target.value))
  if (searchHadFocus) {
    searchInput?.focus()
    searchInput?.setSelectionRange(searchInput.value.length, searchInput.value.length)
  }

  container.querySelectorAll('.skill-item').forEach((btn) => {
    btn.addEventListener('click', () => onSelect(btn.dataset.skill))
  })

  container.querySelectorAll('[data-tag]').forEach((btn) => {
    btn.addEventListener('click', () => onTagToggle(btn.dataset.tag))
  })

  container.querySelectorAll('[data-platform]').forEach((btn) => {
    btn.addEventListener('click', () => onPlatformToggle(btn.dataset.platform))
  })
}
