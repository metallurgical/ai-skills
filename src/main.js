import './style.css'
import { skills } from 'virtual:skills-data'
import { renderSidebar } from './sidebar.js'
import { renderContent } from './content.js'

const sidebar = document.getElementById('sidebar')
const content = document.getElementById('content')

const state = {
  selectedSkill: null,
  activeTags: [],
  searchQuery: '',
}

function findSkill(name) {
  return skills.find((s) => s.name === name) ?? null
}

function update() {
  renderSidebar(sidebar, {
    skills,
    selectedName: state.selectedSkill?.name ?? null,
    activeTags: state.activeTags,
    searchQuery: state.searchQuery,
    onSelect(name) {
      state.selectedSkill = findSkill(name)
      window.location.hash = name
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
  })

  renderContent(content, state.selectedSkill)
}

// Hash routing — restore selection from URL on load
const hashSkill = findSkill(window.location.hash.slice(1))
if (hashSkill) {
  state.selectedSkill = hashSkill
} else if (skills.length > 0) {
  state.selectedSkill = skills[0]
  window.location.hash = skills[0].name
}

update()
