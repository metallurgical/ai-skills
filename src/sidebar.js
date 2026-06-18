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

    <div class="p-3 border-t border-[rgba(0,255,100,0.08)]">
      <div class="font-mono text-[10px] text-[rgba(0,255,100,0.5)] font-medium mb-0.5">Norlihazmey</div>
      <div class="font-mono text-[9px] text-[rgba(0,255,100,0.25)] mb-1.5">norlihazmey.ghazali@gmail.com</div>
      <a
        href="https://github.com/metallurgical"
        target="_blank"
        rel="noopener noreferrer"
        class="inline-flex items-center gap-1.5 font-mono text-[9px] text-[rgba(0,255,100,0.35)] hover:text-[rgba(0,255,100,0.7)] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="11" height="11" fill="currentColor">
          <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
        </svg>
        github.com/metallurgical
      </a>
    </div>
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
