import fs from 'node:fs/promises'
import path from 'node:path'
import type { ScannedProjectInfo } from '../types/scanner.js'

/** Check if a file exists in the given directory */
async function exists(dir: string, filename: string): Promise<boolean> {
  try {
    await fs.access(path.join(dir, filename))
    return true
  } catch {
    return false
  }
}

/** Check if any file matching a glob-like prefix exists */
async function existsWithPrefix(dir: string, prefix: string): Promise<boolean> {
  try {
    const entries = await fs.readdir(dir)
    return entries.some((e) => e.startsWith(prefix))
  } catch {
    return false
  }
}

/** Read package.json dependencies */
async function readPkgDeps(dir: string): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(path.join(dir, 'package.json'), 'utf-8')
    const pkg = JSON.parse(raw) as Record<string, unknown>
    const deps = (pkg.dependencies ?? {}) as Record<string, string>
    const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>
    return { ...deps, ...devDeps }
  } catch {
    return {}
  }
}

/** Detect the primary language */
async function detectLanguage(dir: string): Promise<string | null> {
  if (await exists(dir, 'tsconfig.json')) return 'typescript'
  if (await exists(dir, 'package.json')) return 'javascript'
  if (
    (await exists(dir, 'requirements.txt')) ||
    (await exists(dir, 'pyproject.toml')) ||
    (await exists(dir, 'setup.py'))
  )
    return 'python'
  if (await exists(dir, 'go.mod')) return 'go'
  if (await exists(dir, 'Cargo.toml')) return 'rust'
  if ((await exists(dir, 'pom.xml')) || (await exists(dir, 'build.gradle'))) return 'java'
  if (await existsWithPrefix(dir, '.csproj')) return 'csharp'
  if (await exists(dir, 'Gemfile')) return 'ruby'
  if (await exists(dir, 'pubspec.yaml')) return 'dart'
  if (await exists(dir, 'Package.swift')) return 'swift'
  return null
}

/** Detect framework from config files and dependencies */
async function detectFramework(dir: string, deps: Record<string, string>): Promise<string | null> {
  if (await existsWithPrefix(dir, 'next.config')) return 'next.js'
  if (await existsWithPrefix(dir, 'nuxt.config')) return 'nuxt'
  if (await exists(dir, 'angular.json')) return 'angular'
  if (await existsWithPrefix(dir, 'svelte.config')) return 'sveltekit'
  if ((await existsWithPrefix(dir, 'vite.config')) && 'vue' in deps) return 'vue'
  if (await existsWithPrefix(dir, 'remix.config')) return 'remix'
  if (await existsWithPrefix(dir, 'astro.config')) return 'astro'
  if ('express' in deps) return 'express'
  if ('fastify' in deps) return 'fastify'
  if ('django' in deps) return 'django'
  if ('flask' in deps) return 'flask'
  if ('fastapi' in deps) return 'fastapi'
  if ('gin-gonic' in deps) return 'gin'
  if (Object.keys(deps).some((d) => d.includes('spring'))) return 'spring'
  return null
}

/** Detect runtime */
async function detectRuntime(dir: string): Promise<string | null> {
  if ((await exists(dir, 'bunfig.toml')) || (await exists(dir, 'bun.lockb'))) return 'bun'
  if ((await exists(dir, 'deno.json')) || (await exists(dir, 'deno.lock'))) return 'deno'
  if (await exists(dir, 'package.json')) return 'node'
  if (
    (await exists(dir, 'requirements.txt')) ||
    (await exists(dir, 'pyproject.toml')) ||
    (await exists(dir, 'setup.py'))
  )
    return 'python'
  if (await exists(dir, 'go.mod')) return 'go'
  if (await exists(dir, 'Cargo.toml')) return 'rust'
  return null
}

/** Detect package manager */
async function detectPackageManager(dir: string): Promise<string | null> {
  if (await exists(dir, 'pnpm-lock.yaml')) return 'pnpm'
  if (await exists(dir, 'yarn.lock')) return 'yarn'
  if (await exists(dir, 'bun.lockb')) return 'bun'
  if (await exists(dir, 'package-lock.json')) return 'npm'
  if ((await exists(dir, 'requirements.txt')) || (await exists(dir, 'Pipfile'))) return 'pip'
  if (await exists(dir, 'poetry.lock')) return 'poetry'
  if (await exists(dir, 'Cargo.lock')) return 'cargo'
  if (await exists(dir, 'package.json')) return 'npm'
  return null
}

/** Detect test framework */
async function detectTestFramework(
  dir: string,
  deps: Record<string, string>,
): Promise<string | null> {
  if ((await existsWithPrefix(dir, 'vitest.config')) || 'vitest' in deps) return 'vitest'
  if ((await existsWithPrefix(dir, 'jest.config')) || 'jest' in deps) return 'jest'
  if ((await exists(dir, 'pytest.ini')) || (await exists(dir, 'conftest.py')) || 'pytest' in deps)
    return 'pytest'
  if ('@testing-library/react' in deps) return 'testing-library'
  return null
}

/** Detect linter */
async function detectLinter(dir: string): Promise<string | null> {
  if ((await exists(dir, 'biome.json')) || (await exists(dir, 'biome.jsonc'))) return 'biome'
  if ((await existsWithPrefix(dir, '.eslintrc')) || (await existsWithPrefix(dir, 'eslint.config')))
    return 'eslint'
  if (await exists(dir, 'ruff.toml')) return 'ruff'
  return null
}

/** Detect formatter */
async function detectFormatter(dir: string): Promise<string | null> {
  if ((await exists(dir, 'biome.json')) || (await exists(dir, 'biome.jsonc'))) return 'biome'
  if (await existsWithPrefix(dir, '.prettierrc')) return 'prettier'
  if (await exists(dir, 'ruff.toml')) return 'ruff'
  return null
}

/** Detect styling framework */
async function detectStyleFramework(
  dir: string,
  deps: Record<string, string>,
): Promise<string | null> {
  if (await existsWithPrefix(dir, 'tailwind.config')) return 'tailwind'
  if ('tailwindcss' in deps) return 'tailwind'
  if ('styled-components' in deps) return 'styled-components'
  if ('@emotion/react' in deps) return 'emotion'
  if ('sass' in deps) return 'sass'
  return null
}

/** Scan a project directory to detect its configuration */
export async function scanProject(projectRoot: string): Promise<ScannedProjectInfo> {
  const deps = await readPkgDeps(projectRoot)

  const [
    detectedLanguage,
    detectedFramework,
    detectedRuntime,
    detectedPackageManager,
    detectedTestFramework,
    detectedLinter,
    detectedFormatter,
    detectedStyleFramework,
  ] = await Promise.all([
    detectLanguage(projectRoot),
    detectFramework(projectRoot, deps),
    detectRuntime(projectRoot),
    detectPackageManager(projectRoot),
    detectTestFramework(projectRoot, deps),
    detectLinter(projectRoot),
    detectFormatter(projectRoot),
    detectStyleFramework(projectRoot, deps),
  ])

  return {
    detectedLanguage,
    detectedFramework,
    detectedRuntime,
    detectedPackageManager,
    detectedTestFramework,
    detectedLinter,
    detectedFormatter,
    detectedStyleFramework,
  }
}
