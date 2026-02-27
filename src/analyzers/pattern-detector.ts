import fs from 'node:fs/promises'
import path from 'node:path'
import fg from 'fast-glob'

export interface CodePatterns {
  samples: { path: string; snippet: string }[]
  detectedPatterns: string[]
}

const IGNORE_DIRS = [
  'node_modules',
  'dist',
  'build',
  '.git',
  '.next',
  '__pycache__',
  '.venv',
  'target',
  'coverage',
  '.turbo',
  '.cache',
]

const SOURCE_EXTENSIONS = ['ts', 'tsx', 'js', 'jsx', 'py']
const MAX_SAMPLES = 10
const MAX_LINES = 50

/** Sample source files from the project */
async function sampleFiles(projectRoot: string): Promise<{ path: string; snippet: string }[]> {
  const patterns = SOURCE_EXTENSIONS.map((ext) => `src/**/*.${ext}`)
  const ignorePatterns = IGNORE_DIRS.map((d) => `**/${d}/**`)

  let files = await fg(patterns, {
    cwd: projectRoot,
    ignore: ignorePatterns,
    onlyFiles: true,
    absolute: false,
  })

  // If no files in src/, try root
  if (files.length === 0) {
    const rootPatterns = SOURCE_EXTENSIONS.map((ext) => `**/*.${ext}`)
    files = await fg(rootPatterns, {
      cwd: projectRoot,
      ignore: ignorePatterns,
      onlyFiles: true,
      absolute: false,
      deep: 3,
    })
  }

  // Take up to MAX_SAMPLES files
  const selected = files.slice(0, MAX_SAMPLES)
  const samples: { path: string; snippet: string }[] = []

  for (const file of selected) {
    try {
      const content = await fs.readFile(path.join(projectRoot, file), 'utf-8')
      const lines = content.split('\n').slice(0, MAX_LINES)
      samples.push({ path: file, snippet: lines.join('\n') })
    } catch {
      // skip unreadable files
    }
  }

  return samples
}

/** Detect patterns from code snippets */
function detectPatterns(samples: { path: string; snippet: string }[]): string[] {
  const patterns = new Set<string>()
  const allCode = samples.map((s) => s.snippet).join('\n')

  // Import style
  if (/^import .+ from ['"]/.test(allCode) || /\nimport .+ from ['"]/.test(allCode)) {
    patterns.add('es-modules')
  }
  if (/require\(/.test(allCode)) {
    patterns.add('commonjs')
  }
  if (/from ['"]@\//.test(allCode) || /from ['"]~\//.test(allCode)) {
    patterns.add('path-aliases')
  }

  // Component patterns
  if (/function\s+\w+\s*\([^)]*\)\s*{[\s\S]*?return\s*[\s(]</.test(allCode)) {
    patterns.add('functional-components')
  }
  if (/class\s+\w+\s+extends\s+(React\.)?Component/.test(allCode)) {
    patterns.add('class-components')
  }
  if (/use[A-Z]\w+\s*\(/.test(allCode)) {
    patterns.add('hooks')
  }

  // Error handling
  if (/try\s*{/.test(allCode)) {
    patterns.add('try-catch')
  }
  if (/\.catch\(/.test(allCode)) {
    patterns.add('promise-catch')
  }
  if (/Result</.test(allCode) || /Either</.test(allCode)) {
    patterns.add('result-type')
  }

  // Test patterns
  if (/describe\(/.test(allCode) && /it\(/.test(allCode)) {
    patterns.add('describe-it')
  }
  if (/test\(/.test(allCode)) {
    patterns.add('test-function')
  }
  if (/from ['"]vitest['"]/.test(allCode)) {
    patterns.add('vitest')
  }
  if (/from ['"]jest['"]/.test(allCode) || /jest\./.test(allCode)) {
    patterns.add('jest')
  }

  // Naming conventions
  const fileNames = samples.map((s) => path.basename(s.path, path.extname(s.path)))
  if (fileNames.some((n) => /^[a-z]+-[a-z]+/.test(n))) {
    patterns.add('kebab-case-files')
  }
  if (fileNames.some((n) => /^[A-Z][a-zA-Z]+/.test(n))) {
    patterns.add('pascal-case-files')
  }
  if (fileNames.some((n) => /^[a-z]+_[a-z]+/.test(n))) {
    patterns.add('snake-case-files')
  }

  // Async patterns
  if (/async\s+function/.test(allCode) || /=\s*async\s*\(/.test(allCode)) {
    patterns.add('async-await')
  }

  // TypeScript patterns
  if (/interface\s+\w+/.test(allCode)) {
    patterns.add('interfaces')
  }
  if (/type\s+\w+\s*=/.test(allCode)) {
    patterns.add('type-aliases')
  }
  if (/export\s+type\s/.test(allCode)) {
    patterns.add('exported-types')
  }

  return [...patterns]
}

/** Detect code patterns in a project */
export async function detectCodePatterns(projectRoot: string): Promise<CodePatterns> {
  const samples = await sampleFiles(projectRoot)
  const detectedPatterns = detectPatterns(samples)

  return { samples, detectedPatterns }
}
