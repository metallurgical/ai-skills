import './style.css'
import { skills } from 'virtual:skills-data'
import { renderSidebar } from './sidebar.js'
import { renderContent } from './content.js'

const sidebar = document.getElementById('sidebar')
const content = document.getElementById('content')
const overlay = document.getElementById('sidebar-overlay')
const menuToggle = document.getElementById('menu-toggle')

function openSidebar() {
  sidebar.classList.remove('-translate-x-full')
  overlay.classList.remove('hidden')
}

function closeSidebar() {
  sidebar.classList.add('-translate-x-full')
  overlay.classList.add('hidden')
}

menuToggle?.addEventListener('click', () => {
  sidebar.classList.contains('-translate-x-full') ? openSidebar() : closeSidebar()
})
overlay?.addEventListener('click', closeSidebar)
window.addEventListener('resize', () => {
  if (window.innerWidth >= 768) closeSidebar()
})

const state = {
  selectedSkill: null,
  activeTags: [],
  activePlatforms: [],
  searchQuery: '',
  activeTab: 'readme',
}

function findSkill(name) {
  return skills.find((s) => s.name === name) ?? null
}

function update() {
  renderSidebar(sidebar, {
    skills,
    selectedName: state.selectedSkill?.name ?? null,
    activeTags: state.activeTags,
    activePlatforms: state.activePlatforms,
    searchQuery: state.searchQuery,
    onSelect(name) {
      state.selectedSkill = findSkill(name)
      state.activeTab = 'readme'
      window.location.hash = name
      closeSidebar()
      update()
    },
    onSearch(query) {
      state.searchQuery = query
      update()
    },
    onTagToggle(tag) {
      state.activeTags = state.activeTags.includes(tag)
        ? state.activeTags.filter((t) => t !== tag)
        : [...state.activeTags, tag]
      update()
    },
    onPlatformToggle(platform) {
      state.activePlatforms = state.activePlatforms.includes(platform)
        ? state.activePlatforms.filter((p) => p !== platform)
        : [...state.activePlatforms, platform]
      update()
    },
  })

  renderContent(content, state.selectedSkill, state.activeTab, (tab) => {
    state.activeTab = tab
    update()
  })
}

// Hash routing — restore selection from URL on load
const hashSkill = findSkill(window.location.hash.slice(1))
if (hashSkill) {
  state.selectedSkill = hashSkill
} else if (skills.length > 0) {
  state.selectedSkill = skills[0]
}

update()

window.addEventListener('hashchange', () => {
  const skill = findSkill(window.location.hash.slice(1))
  if (skill && skill !== state.selectedSkill) {
    state.selectedSkill = skill
    state.activeTab = 'readme'
    update()
  }
})
