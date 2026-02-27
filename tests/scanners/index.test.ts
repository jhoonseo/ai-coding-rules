import { describe, expect, it } from 'vitest'
import { scan } from '../../src/scanners/index.js'

describe('scan (integration)', () => {
  it('should scan the current project correctly', async () => {
    const result = await scan(process.cwd())
    expect(result.project.detectedLanguage).toBe('typescript')
    expect(result.project.detectedPackageManager).toBe('npm')
    expect(result.project.detectedTestFramework).toBe('vitest')
    expect(result.project.detectedLinter).toBe('biome')
    expect(result.structure.directories).toContain('src')
    expect(result.structure.directories).toContain('tests')
    expect(result.dependencies.categorized.build).toContain('tsup')
    expect(result.dependencies.categorized.testing).toContain('vitest')
  })
})
