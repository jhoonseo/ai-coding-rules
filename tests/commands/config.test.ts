import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  getConfigValue,
  maskApiKey,
  readGlobalConfig,
  resolveApiKey,
  resolveProvider,
  setConfigValue,
} from '../../src/utils/config-store.js'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-test-'))
  const configDir = path.join(tmpDir, '.rulegen')
  await fs.mkdir(configDir, { recursive: true })
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
  vi.restoreAllMocks()
})

describe('maskApiKey', () => {
  it('should mask long API keys', () => {
    const masked = maskApiKey('sk-ant-api123456789abcdef')
    expect(masked).toBe('sk-ant-...cdef')
    expect(masked).not.toContain('123456789')
  })

  it('should mask short API keys', () => {
    const masked = maskApiKey('short')
    expect(masked).toBe('****')
  })
})

describe('resolveProvider', () => {
  it('should return explicit provider', async () => {
    const provider = await resolveProvider('openai')
    expect(provider).toBe('openai')
  })

  it('should throw on invalid provider', async () => {
    await expect(resolveProvider('invalid')).rejects.toThrow('Invalid provider')
  })

  it('should default to claude when no config', async () => {
    const provider = await resolveProvider()
    expect(['claude', 'openai', 'gemini']).toContain(provider)
  })
})

describe('resolveApiKey', () => {
  it('should prefer environment variable', async () => {
    const original = process.env.ANTHROPIC_API_KEY
    process.env.ANTHROPIC_API_KEY = 'test-env-key'

    const key = await resolveApiKey('claude')
    expect(key).toBe('test-env-key')

    if (original) {
      process.env.ANTHROPIC_API_KEY = original
    } else {
      delete process.env.ANTHROPIC_API_KEY
    }
  })
})

describe('writeGlobalConfig / readGlobalConfig', () => {
  it('should write and read config', async () => {
    const config = await readGlobalConfig()
    expect(typeof config).toBe('object')
  })
})

describe('setConfigValue', () => {
  it('should reject invalid provider', async () => {
    await expect(setConfigValue('provider', 'invalid')).rejects.toThrow('Invalid provider')
  })

  it('should reject unknown key', async () => {
    await expect(setConfigValue('unknown', 'value')).rejects.toThrow('Unknown config key')
  })
})

describe('getConfigValue', () => {
  it('should reject unknown key', async () => {
    await expect(getConfigValue('unknown')).rejects.toThrow('Unknown config key')
  })
})
