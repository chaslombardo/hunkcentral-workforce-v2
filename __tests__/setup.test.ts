import { describe, it, expect, vi } from 'vitest'

describe('Test Setup', () => {
  it('should run tests successfully', () => {
    expect(true).toBe(true)
  })

  it('should have access to test utilities', () => {
    expect(vi).toBeDefined()
    expect(expect).toBeDefined()
  })
})