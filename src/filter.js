export function filterBySearch(skills, query) {
  if (!query.trim()) return skills
  const q = query.toLowerCase()
  return skills.filter(
    (s) => s.name.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
  )
}

export function filterByTags(skills, tags) {
  if (!tags.length) return skills
  return skills.filter((s) => tags.every((tag) => s.tags.includes(tag)))
}

export function applyFilters(skills, { query, tags }) {
  return filterByTags(filterBySearch(skills, query), tags)
}
