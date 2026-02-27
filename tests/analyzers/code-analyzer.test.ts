import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { analyzeCode } from '../../src/analyzers/code-analyzer.js'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'analyzer-test-'))
  await fs.mkdir(path.join(tmpDir, 'src'), { recursive: true })
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('analyzeCode', () => {
  it('should return all analysis sections', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'tsconfig.json'),
      JSON.stringify({ compilerOptions: { strict: true, target: 'ES2022' } }),
    )
    await fs.writeFile(path.join(tmpDir, 'src', 'index.ts'), "console.log('hello')\n")

    const result = await analyzeCode(tmpDir)

    expect(result.configFiles).toBeDefined()
    expect(result.codePatterns).toBeDefined()
    expect(result.gitInfo).toBeDefined()
    expect(result.projectStructure).toBeDefined()
  })

  it('should detect project structure', async () => {
    await fs.mkdir(path.join(tmpDir, 'src', 'utils'), { recursive: true })
    await fs.mkdir(path.join(tmpDir, 'tests'), { recursive: true })
    await fs.writeFile(path.join(tmpDir, 'src', 'index.ts'), '')

    const result = await analyzeCode(tmpDir)
    expect(result.projectStructure.tree).toBeDefined()
    expect(result.projectStructure.tree.length).toBeGreaterThan(0)
  })

  it('should infer directory roles', async () => {
    await fs.mkdir(path.join(tmpDir, 'src'), { recursive: true })
    await fs.mkdir(path.join(tmpDir, 'tests'), { recursive: true })
    await fs.mkdir(path.join(tmpDir, 'docs'), { recursive: true })

    const result = await analyzeCode(tmpDir)
    expect(result.projectStructure.directories.src).toBe('Source code')
    expect(result.projectStructure.directories.tests).toBe('Test files')
    expect(result.projectStructure.directories.docs).toBe('Documentation')
  })

  it('should handle git info for non-git project', async () => {
    const result = await analyzeCode(tmpDir)
    expect(result.gitInfo.recentCommits).toHaveLength(0)
    expect(result.gitInfo.isConventionalCommits).toBe(false)
  })
})
