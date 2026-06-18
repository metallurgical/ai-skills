import { describe, it, expect } from 'vitest'
import { filterBySearch, filterByTags, filterByPlatform, applyFilters } from '../src/filter.js'

const skills = [
  { name: 'laravel-worktree', description: 'Manages git worktrees for Laravel', tags: ['laravel', 'git', 'php'], platforms: ['claude-code', 'codex'] },
  { name: 'figma-generate', description: 'Generate Figma designs', tags: ['figma', 'design'], platforms: ['claude-code'] },
  { name: 'pest-tdd-expert', description: 'TDD with Pest for Laravel', tags: ['laravel', 'php', 'testing'], platforms: ['codex'] },
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

describe('filterByPlatform', () => {
  it('returns all skills for empty platforms array', () => {
    expect(filterByPlatform(skills, [])).toHaveLength(3)
  })

  it('filters skills by single platform', () => {
    const result = filterByPlatform(skills, ['codex'])
    expect(result.map(s => s.name)).toEqual(['laravel-worktree', 'pest-tdd-expert'])
  })

  it('uses AND logic for multiple platforms', () => {
    const result = filterByPlatform(skills, ['claude-code', 'codex'])
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('laravel-worktree')
  })

  it('returns empty array when no skill matches all platforms', () => {
    expect(filterByPlatform(skills, ['claude-code', 'nonexistent'])).toHaveLength(0)
  })
})

describe('applyFilters', () => {
  it('chains search and tag filters', () => {
    const result = applyFilters(skills, { query: 'laravel', tags: ['git'], platforms: [] })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('laravel-worktree')
  })

  it('chains search, tag, and platform filters', () => {
    const result = applyFilters(skills, { query: '', tags: ['testing'], platforms: ['codex'] })
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('pest-tdd-expert')
  })

  it('returns all skills when query is empty and tags and platforms are empty', () => {
    expect(applyFilters(skills, { query: '', tags: [], platforms: [] })).toHaveLength(3)
  })

  it('defaults platforms to empty when omitted', () => {
    expect(applyFilters(skills, { query: '', tags: [] })).toHaveLength(3)
  })
})
