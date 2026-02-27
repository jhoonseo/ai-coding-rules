import { describe, expect, it } from 'vitest'
import { buildExplainPrompt, buildPrompt } from '../../src/ai/prompt-builder.js'
import type { CodeAnalysis } from '../../src/analyzers/code-analyzer.js'
import type { ScanResult } from '../../src/types/scanner.js'

const mockScan: ScanResult = {
  project: {
    detectedLanguage: 'typescript',
    detectedFramework: 'next.js',
    detectedRuntime: 'node',
    detectedPackageManager: 'npm',
    detectedTestFramework: 'vitest',
    detectedLinter: 'biome',
    detectedFormatter: 'biome',
    detectedStyleFramework: 'tailwind',
  },
  structure: {
    rootFiles: ['package.json', 'tsconfig.json'],
    directories: ['src', 'tests'],
    entryPoints: ['src/index.ts'],
    configFiles: ['package.json', 'tsconfig.json'],
    totalFileCount: 50,
  },
  git: {
    isGitRepo: true,
    defaultBranch: 'main',
    hasGitignore: true,
    usesConventionalCommits: true,
    hasCI: true,
    ciPlatform: 'github-actions',
  },
  dependencies: {
    raw: {},
    categorized: {
      ui: [],
      state: [],
      styling: [],
      api: [],
      database: [],
      testing: ['vitest'],
      build: ['tsup'],
      other: [],
    },
  },
}

const mockAnalysis: CodeAnalysis = {
  configFiles: {
    tsconfig: { strict: true, target: 'ES2022', paths: true },
    biome: { formatter: { indentStyle: 'space' } },
  },
  codePatterns: {
    samples: [{ path: 'src/index.ts', snippet: "console.log('hello')" }],
    detectedPatterns: ['es-modules', 'async-await', 'interfaces'],
  },
  gitInfo: {
    recentCommits: ['feat: add feature', 'fix: bug fix'],
    isConventionalCommits: true,
  },
  projectStructure: {
    tree: 'src/\ntests/',
    directories: { src: 'Source code', tests: 'Test files' },
  },
}

describe('buildPrompt', () => {
  it('should include project info', () => {
    const prompt = buildPrompt(mockScan, mockAnalysis)
    expect(prompt).toContain('typescript')
    expect(prompt).toContain('next.js')
    expect(prompt).toContain('node')
    expect(prompt).toContain('npm')
  })

  it('should include config file details', () => {
    const prompt = buildPrompt(mockScan, mockAnalysis)
    expect(prompt).toContain('TSConfig')
    expect(prompt).toContain('Strict: true')
    expect(prompt).toContain('Biome')
  })

  it('should include code patterns', () => {
    const prompt = buildPrompt(mockScan, mockAnalysis)
    expect(prompt).toContain('es-modules')
    expect(prompt).toContain('async-await')
  })

  it('should include git info', () => {
    const prompt = buildPrompt(mockScan, mockAnalysis)
    expect(prompt).toContain('Conventional commits: yes')
    expect(prompt).toContain('feat: add feature')
  })

  it('should include project structure', () => {
    const prompt = buildPrompt(mockScan, mockAnalysis)
    expect(prompt).toContain('src/')
    expect(prompt).toContain('Source code')
  })

  it('should include JSON schema instructions', () => {
    const prompt = buildPrompt(mockScan, mockAnalysis)
    expect(prompt).toContain('Respond ONLY with valid JSON')
    expect(prompt).toContain('rulegen.config.json')
  })
})

describe('buildExplainPrompt', () => {
  it('should include the config JSON', () => {
    const config = JSON.stringify({ version: '1', project: { name: 'test' } })
    const prompt = buildExplainPrompt(config)
    expect(prompt).toContain('test')
    expect(prompt).toContain('Explain WHY')
  })
})
