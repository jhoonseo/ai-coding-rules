import { exec } from 'node:child_process'
import path from 'node:path'
import { promisify } from 'node:util'
import fg from 'fast-glob'
import type { ParsedConfigs } from './config-parser.js'
import { parseConfigFiles } from './config-parser.js'
import type { CodePatterns } from './pattern-detector.js'
import { detectCodePatterns } from './pattern-detector.js'

const execAsync = promisify(exec)

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
]

export interface CodeAnalysis {
  configFiles: ParsedConfigs
  codePatterns: CodePatterns
  gitInfo: {
    recentCommits: string[]
    isConventionalCommits: boolean
  }
  projectStructure: {
    tree: string
    directories: Record<string, string>
  }
}

const CONVENTIONAL_PATTERN =
  /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)(\(.+\))?:/

/** Run a shell command safely */
async function safeExec(cmd: string, cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(cmd, { cwd, timeout: 5000 })
    return stdout.trim()
  } catch {
    return null
  }
}

/** Analyze git history */
async function analyzeGit(projectRoot: string): Promise<CodeAnalysis['gitInfo']> {
  const log = await safeExec('git log --oneline -20 --format=%s', projectRoot)
  const recentCommits = log ? log.split('\n').filter(Boolean) : []

  const conventionalCount = recentCommits.filter((msg) => CONVENTIONAL_PATTERN.test(msg)).length
  const isConventionalCommits =
    recentCommits.length > 0 && conventionalCount >= recentCommits.length * 0.5

  return { recentCommits, isConventionalCommits }
}

/** Build a directory tree string (2 levels deep) */
async function buildDirectoryTree(projectRoot: string): Promise<string> {
  const ignorePatterns = IGNORE_DIRS.map((d) => `**/${d}/**`)

  const dirs = await fg(['*', '*/*'], {
    cwd: projectRoot,
    onlyDirectories: true,
    deep: 2,
    ignore: [...IGNORE_DIRS, ...ignorePatterns],
  })

  const files = await fg(['*'], {
    cwd: projectRoot,
    onlyFiles: true,
    deep: 1,
    dot: true,
    ignore: ignorePatterns,
  })

  const lines: string[] = []
  for (const f of files.sort().slice(0, 10)) {
    lines.push(f)
  }
  for (const d of dirs.sort()) {
    lines.push(`${d}/`)
  }

  return lines.join('\n')
}

/** Infer directory roles */
function inferDirectoryRoles(dirs: string[]): Record<string, string> {
  const roles: Record<string, string> = {}
  const roleMap: Record<string, string> = {
    src: 'Source code',
    lib: 'Library code',
    components: 'UI components',
    pages: 'Page routes',
    app: 'Application entry / routes',
    api: 'API endpoints',
    utils: 'Utility functions',
    hooks: 'Custom hooks',
    types: 'Type definitions',
    tests: 'Test files',
    test: 'Test files',
    __tests__: 'Test files',
    public: 'Static assets',
    assets: 'Asset files',
    styles: 'Stylesheets',
    config: 'Configuration files',
    scripts: 'Build/utility scripts',
    packages: 'Monorepo packages',
    apps: 'Monorepo applications',
    docs: 'Documentation',
  }

  for (const dir of dirs) {
    const baseName = path.basename(dir)
    const role = roleMap[baseName]
    if (role) {
      roles[dir] = role
    }
  }

  return roles
}

/** Analyze project structure */
async function analyzeStructure(projectRoot: string): Promise<CodeAnalysis['projectStructure']> {
  const tree = await buildDirectoryTree(projectRoot)

  const dirs = await fg(['*', '*/*'], {
    cwd: projectRoot,
    onlyDirectories: true,
    deep: 2,
    ignore: IGNORE_DIRS,
  })

  const directories = inferDirectoryRoles(dirs)

  return { tree, directories }
}

/** Perform a deep analysis of the codebase */
export async function analyzeCode(projectRoot: string): Promise<CodeAnalysis> {
  const [configFiles, codePatterns, gitInfo, projectStructure] = await Promise.all([
    parseConfigFiles(projectRoot),
    detectCodePatterns(projectRoot),
    analyzeGit(projectRoot),
    analyzeStructure(projectRoot),
  ])

  return { configFiles, codePatterns, gitInfo, projectStructure }
}
