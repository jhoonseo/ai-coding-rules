import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { parseConfigFiles } from '../../src/analyzers/config-parser.js'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'config-parser-test-'))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('parseConfigFiles', () => {
  it('should parse TSConfig', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { strict: true, target: 'ES2022', paths: { '@/*': ['./src/*'] } },
      }),
    )

    const result = await parseConfigFiles(tmpDir)
    expect(result.tsconfig).toBeDefined()
    expect(result.tsconfig?.strict).toBe(true)
    expect(result.tsconfig?.target).toBe('ES2022')
    expect(result.tsconfig?.paths).toBe(true)
  })

  it('should parse Prettier config', async () => {
    await fs.writeFile(
      path.join(tmpDir, '.prettierrc'),
      JSON.stringify({ singleQuote: true, semi: false }),
    )

    const result = await parseConfigFiles(tmpDir)
    expect(result.prettier).toBeDefined()
    expect(result.prettier?.singleQuote).toBe(true)
    expect(result.prettier?.semi).toBe(false)
  })

  it('should parse ESLint config', async () => {
    await fs.writeFile(
      path.join(tmpDir, '.eslintrc.json'),
      JSON.stringify({
        extends: ['eslint:recommended'],
        rules: { 'no-console': 'warn', 'no-unused-vars': 'error' },
      }),
    )

    const result = await parseConfigFiles(tmpDir)
    expect(result.eslint).toBeDefined()
    expect(result.eslint?.extends).toContain('eslint:recommended')
    expect(result.eslint?.rules).toContain('no-console')
    expect(result.eslint?.rules).toContain('no-unused-vars')
  })

  it('should parse Biome config', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'biome.json'),
      JSON.stringify({ formatter: { indentStyle: 'space' } }),
    )

    const result = await parseConfigFiles(tmpDir)
    expect(result.biome).toBeDefined()
    expect((result.biome as Record<string, unknown>).formatter).toBeDefined()
  })

  it('should parse EditorConfig', async () => {
    await fs.writeFile(
      path.join(tmpDir, '.editorconfig'),
      'root = true\n\n[*]\nindent_style = space\nindent_size = 2\ncharset = utf-8\n',
    )

    const result = await parseConfigFiles(tmpDir)
    expect(result.editorconfig).toBeDefined()
    expect(result.editorconfig?.indent_style).toBe('space')
    expect(result.editorconfig?.indent_size).toBe('2')
  })

  it('should return empty for missing configs', async () => {
    const result = await parseConfigFiles(tmpDir)
    expect(result.eslint).toBeUndefined()
    expect(result.prettier).toBeUndefined()
    expect(result.tsconfig).toBeUndefined()
    expect(result.biome).toBeUndefined()
    expect(result.editorconfig).toBeUndefined()
  })

  it('should handle invalid JSON gracefully', async () => {
    await fs.writeFile(path.join(tmpDir, 'tsconfig.json'), '{ invalid json }')
    const result = await parseConfigFiles(tmpDir)
    expect(result.tsconfig).toBeUndefined()
  })
})
