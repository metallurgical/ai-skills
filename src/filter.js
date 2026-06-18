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

export function filterByPlatform(skills, platforms) {
  if (!platforms.length) return skills
  return skills.filter((s) => platforms.every((p) => s.platforms.includes(p)))
}

export function applyFilters(skills, { query, tags, platforms = [] }) {
  return filterByPlatform(filterByTags(filterBySearch(skills, query), tags), platforms)
}
