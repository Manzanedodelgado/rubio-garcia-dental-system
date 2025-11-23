import { expect, afterEach, vi } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'
import { TextEncoder, TextDecoder } from 'util'

// Setup jest-dom matchers
expect.extend(matchers)

// Polyfills para testing environment
global.TextEncoder = TextEncoder
global.TextDecoder = TextDecoder

// Mock global objects
global.requestAnimationFrame = vi.fn((cb) => setTimeout(cb, 0))
global.cancelAnimationFrame = vi.fn()

// Cleanup after each test
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
  vi.restoreAllMocks()
})

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock console methods para tests silenciosos
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
}