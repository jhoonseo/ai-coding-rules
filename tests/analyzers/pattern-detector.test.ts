import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { detectCodePatterns } from '../../src/analyzers/pattern-detector.js'

let tmpDir: string

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'pattern-test-'))
  await fs.mkdir(path.join(tmpDir, 'src'), { recursive: true })
})

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true })
})

describe('detectCodePatterns', () => {
  it('should detect ES module imports', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'src', 'index.ts'),
      "import { foo } from './bar.js'\nconsole.log(foo)\n",
    )

    const result = await detectCodePatterns(tmpDir)
    expect(result.detectedPatterns).toContain('es-modules')
  })

  it('should detect functional components and hooks', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'src', 'app.tsx'),
      `import React from 'react'
function App() {
  const [count, setCount] = useState(0)
  return (<div>{count}</div>)
}
`,
    )

    const result = await detectCodePatterns(tmpDir)
    expect(result.detectedPatterns).toContain('hooks')
  })

  it('should detect async-await pattern', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'src', 'api.ts'),
      `export async function fetchData() {
  const res = await fetch('/api')
  return res.json()
}
`,
    )

    const result = await detectCodePatterns(tmpDir)
    expect(result.detectedPatterns).toContain('async-await')
  })

  it('should detect TypeScript patterns', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'src', 'types.ts'),
      `export interface User {
  name: string
}
export type Status = 'active' | 'inactive'
`,
    )

    const result = await detectCodePatterns(tmpDir)
    expect(result.detectedPatterns).toContain('interfaces')
    expect(result.detectedPatterns).toContain('type-aliases')
    expect(result.detectedPatterns).toContain('exported-types')
  })

  it('should detect try-catch pattern', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'src', 'utils.ts'),
      `export function parse(input: string) {
  try {
    return JSON.parse(input)
  } catch {
    return null
  }
}
`,
    )

    const result = await detectCodePatterns(tmpDir)
    expect(result.detectedPatterns).toContain('try-catch')
  })

  it('should detect test patterns', async () => {
    await fs.writeFile(
      path.join(tmpDir, 'src', 'app.test.ts'),
      `import { describe, it, expect } from 'vitest'
describe('App', () => {
  it('should work', () => {
    expect(true).toBe(true)
  })
})
`,
    )

    const result = await detectCodePatterns(tmpDir)
    expect(result.detectedPatterns).toContain('describe-it')
    expect(result.detectedPatterns).toContain('vitest')
  })

  it('should limit samples to MAX_SAMPLES', async () => {
    for (let i = 0; i < 15; i++) {
      await fs.writeFile(path.join(tmpDir, 'src', `file${i}.ts`), `const x${i} = ${i}\n`)
    }

    const result = await detectCodePatterns(tmpDir)
    expect(result.samples.length).toBeLessThanOrEqual(10)
  })

  it('should handle empty project', async () => {
    const result = await detectCodePatterns(tmpDir)
    expect(result.samples).toHaveLength(0)
    expect(result.detectedPatterns).toHaveLength(0)
  })

  it('should detect kebab-case file names', async () => {
    await fs.writeFile(path.join(tmpDir, 'src', 'my-component.ts'), 'export const x = 1\n')

    const result = await detectCodePatterns(tmpDir)
    expect(result.detectedPatterns).toContain('kebab-case-files')
  })
})
