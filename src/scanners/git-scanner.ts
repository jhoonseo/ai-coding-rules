import { exec } from 'node:child_process'
import fs from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import type { ScannedGitInfo } from '../types/scanner.js'

const execAsync = promisify(exec)

const CONVENTIONAL_PATTERN =
  /^(feat|fix|chore|docs|style|refactor|perf|test|build|ci|revert)(\(.+\))?:/

/** Run a shell command safely, returning null on failure */
async function safeExec(cmd: string, cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execAsync(cmd, { cwd, timeout: 5000 })
    return stdout.trim()
  } catch {
    return null
  }
}

/** Scan git-related project info */
export async function scanGit(projectRoot: string): Promise<ScannedGitInfo> {
  const result: ScannedGitInfo = {
    isGitRepo: false,
    defaultBranch: null,
    hasGitignore: false,
    usesConventionalCommits: false,
    hasCI: false,
    ciPlatform: null,
  }

  // Check .git directory
  try {
    const stat = await fs.stat(path.join(projectRoot, '.git'))
    result.isGitRepo = stat.isDirectory()
  } catch {
    // not a git repo
  }

  // Check .gitignore
  try {
    await fs.access(path.join(projectRoot, '.gitignore'))
    result.hasGitignore = true
  } catch {
    // no .gitignore
  }

  // Detect default branch
  if (result.isGitRepo) {
    const branch = await safeExec('git rev-parse --abbrev-ref HEAD', projectRoot)
    if (branch) {
      result.defaultBranch = branch
    }
  }

  // Check conventional commits
  if (result.isGitRepo) {
    const log = await safeExec('git log --oneline -20', projectRoot)
    if (log) {
      const lines = log.split('\n').filter(Boolean)
      const conventionalCount = lines.filter((line) => {
        const msg = line.replace(/^[a-f0-9]+ /, '')
        return CONVENTIONAL_PATTERN.test(msg)
      }).length
      result.usesConventionalCommits = conventionalCount >= lines.length * 0.5 && lines.length > 0
    }
  }

  // Detect CI platform
  try {
    await fs.access(path.join(projectRoot, '.github', 'workflows'))
    result.hasCI = true
    result.ciPlatform = 'github-actions'
  } catch {
    // no GitHub Actions
  }

  if (!result.hasCI) {
    try {
      await fs.access(path.join(projectRoot, '.gitlab-ci.yml'))
      result.hasCI = true
      result.ciPlatform = 'gitlab-ci'
    } catch {
      // no GitLab CI
    }
  }

  if (!result.hasCI) {
    try {
      await fs.access(path.join(projectRoot, '.circleci'))
      result.hasCI = true
      result.ciPlatform = 'circleci'
    } catch {
      // no CircleCI
    }
  }

  return result
}
