import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { scanDeps } from '../../src/scanners/deps-scanner.js'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'deps-test-'))
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('scanDeps', () => {
  it('should read and categorize node dependencies', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'package.json'),
      JSON.stringify({
        dependencies: {
          react: '^18.0.0',
          zustand: '^4.0.0',
          axios: '^1.0.0',
        },
        devDependencies: {
          vitest: '^1.0.0',
          tsup: '^8.0.0',
        },
      }),
    )
    const result = await scanDeps(tmpDir)
    expect(result.raw).toHaveProperty('react')
    expect(result.raw).toHaveProperty('vitest')
    expect(result.categorized.ui).toContain('react')
    expect(result.categorized.state).toContain('zustand')
    expect(result.categorized.api).toContain('axios')
    expect(result.categorized.testing).toContain('vitest')
    expect(result.categorized.build).toContain('tsup')
  })

  it('should read Python requirements.txt', async () => {
    await fs.writeFile(path.join(tmpDir, 'requirements.txt'), 'flask==2.0\nrequests>=2.28\n')
    const result = await scanDeps(tmpDir)
    expect(result.raw).toHaveProperty('flask')
    expect(result.raw).toHaveProperty('requests')
  })

  it('should return empty for empty directory', async () => {
    const result = await scanDeps(tmpDir)
    expect(Object.keys(result.raw)).toHaveLength(0)
    expect(result.categorized.ui).toHaveLength(0)
  })
})
