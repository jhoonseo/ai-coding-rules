import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { scanProject } from '../../src/scanners/project-scanner.js'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scan-test-'))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('scanProject', () => {
  it('should detect TypeScript project', async () => {
    await fs.writeFile(path.join(tmpDir, 'tsconfig.json'), '{}')
    await fs.writeFile(path.join(tmpDir, 'package.json'), '{}')
    const result = await scanProject(tmpDir)
    expect(result.detectedLanguage).toBe('typescript')
  })

  it('should detect JavaScript project', async () => {
    await fs.writeFile(path.join(tmpDir, 'package.json'), '{}')
    const result = await scanProject(tmpDir)
    expect(result.detectedLanguage).toBe('javascript')
  })

  it('should detect Python project', async () => {
    await fs.writeFile(path.join(tmpDir, 'requirements.txt'), 'flask==2.0\n')
    const result = await scanProject(tmpDir)
    expect(result.detectedLanguage).toBe('python')
    expect(result.detectedRuntime).toBe('python')
  })

  it('should detect Go project', async () => {
    await fs.writeFile(path.join(tmpDir, 'go.mod'), 'module example.com/test\n')
    const result = await scanProject(tmpDir)
    expect(result.detectedLanguage).toBe('go')
    expect(result.detectedRuntime).toBe('go')
  })

  it('should detect Rust project', async () => {
    await fs.writeFile(path.join(tmpDir, 'Cargo.toml'), '[package]\nname = "test"\n')
    const result = await scanProject(tmpDir)
    expect(result.detectedLanguage).toBe('rust')
    expect(result.detectedRuntime).toBe('rust')
  })

  it('should detect npm as package manager', async () => {
    await fs.writeFile(path.join(tmpDir, 'package-lock.json'), '{}')
    await fs.writeFile(path.join(tmpDir, 'package.json'), '{}')
    const result = await scanProject(tmpDir)
    expect(result.detectedPackageManager).toBe('npm')
  })

  it('should detect pnpm as package manager', async () => {
    await fs.writeFile(path.join(tmpDir, 'pnpm-lock.yaml'), '')
    await fs.writeFile(path.join(tmpDir, 'package.json'), '{}')
    const result = await scanProject(tmpDir)
    expect(result.detectedPackageManager).toBe('pnpm')
  })

  it('should detect Next.js framework', async () => {
    await fs.writeFile(path.join(tmpDir, 'next.config.js'), '')
    await fs.writeFile(path.join(tmpDir, 'package.json'), '{"dependencies":{"next":"14"}}')
    const result = await scanProject(tmpDir)
    expect(result.detectedFramework).toBe('next.js')
  })

  it('should detect vitest test framework', async () => {
    await fs.writeFile(path.join(tmpDir, 'vitest.config.ts'), '')
    await fs.writeFile(path.join(tmpDir, 'package.json'), '{}')
    const result = await scanProject(tmpDir)
    expect(result.detectedTestFramework).toBe('vitest')
  })

  it('should detect biome linter', async () => {
    await fs.writeFile(path.join(tmpDir, 'biome.json'), '{}')
    const result = await scanProject(tmpDir)
    expect(result.detectedLinter).toBe('biome')
    expect(result.detectedFormatter).toBe('biome')
  })

  it('should detect tailwind styling', async () => {
    await fs.writeFile(path.join(tmpDir, 'tailwind.config.js'), '')
    await fs.writeFile(path.join(tmpDir, 'package.json'), '{}')
    const result = await scanProject(tmpDir)
    expect(result.detectedStyleFramework).toBe('tailwind')
  })

  it('should return nulls for empty directory', async () => {
    const result = await scanProject(tmpDir)
    expect(result.detectedLanguage).toBeNull()
    expect(result.detectedFramework).toBeNull()
    expect(result.detectedRuntime).toBeNull()
    expect(result.detectedPackageManager).toBeNull()
    expect(result.detectedTestFramework).toBeNull()
    expect(result.detectedLinter).toBeNull()
    expect(result.detectedFormatter).toBeNull()
    expect(result.detectedStyleFramework).toBeNull()
  })
})
