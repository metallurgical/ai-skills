import { describe, it, expect } from 'vitest'
import { filterBySearch, filterByTags, applyFilters } from '../src/filter.js'

const skills = [
  { name: 'laravel-worktree', description: 'Manages git worktrees for Laravel', tags: ['laravel', 'git', 'php'] },
  { name: 'figma-generate', description: 'Generate Figma designs', tags: ['figma', 'design'] },
  { name: 'pest-tdd-expert', description: 'TDD with Pest for Laravel', tags: ['laravel', 'php', 'testing'] },
]

describe('filterBySearch', () => {
  it('returns all skills for empty query', () => {
    expect(filterBySearch(skills, '')).toHaveLength(3)
  })

  it('filters by name (case-insensitive)', () => {
    const result = filterBySearch(skills, 'FIGMA')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('figma-generate')
  })

  it('filters by description', () => {
    const result = filterBySearch(skills, 'worktrees')
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('laravel-worktree')
  })

  it('returns empty array when nothing matches', () => {
    expect(filterBySearch(skills, 'zzznomatch')).toHaveLength(0)
  })
})

describe('filterByTags', () => {
  it('returns all skills for empty tags array', () => {
    expect(filterByTags(skills, [])).toHaveLength(3)
  })

  it('filters skills that include a single tag', () => {
    const result = filterByTags(skills, ['laravel'])
    expect(result.map(s => s.name)).toEqual(['laravel-worktree', 'pest-tdd-expert'])
  })

  it('uses AND logic for multiple tags', () => {
    const result = filterByTags(skills, ['laravel', 'git'])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('laravel-worktree')
  })

  it('returns empty array when no skill matches all tags', () => {
    expect(filterByTags(skills, ['laravel', 'figma'])).toHaveLength(0)
  })
})

describe('applyFilters', () => {
  it('chains search and tag filters', () => {
    const result = applyFilters(skills, { query: 'laravel', tags: ['git'] })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('laravel-worktree')
  })

  it('returns all skills when query is empty and tags are empty', () => {
    expect(applyFilters(skills, { query: '', tags: [] })).toHaveLength(3)
  })
})
