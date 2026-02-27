import fs from 'node:fs/promises'
import path from 'node:path'
import type { ScannedDepsInfo } from '../types/scanner.js'

const CATEGORY_MAP: Record<string, string[]> = {
  ui: ['react', 'vue', 'svelte', 'angular', 'solid-js', 'preact', '@angular/core'],
  state: ['zustand', 'redux', '@reduxjs/toolkit', 'recoil', 'jotai', 'pinia', 'mobx', 'valtio'],
  styling: [
    'tailwindcss',
    'styled-components',
    '@emotion/react',
    'sass',
    'less',
    '@mui/material',
    'antd',
  ],
  api: ['axios', 'ky', '@trpc/client', '@apollo/client', 'graphql', 'swr', '@tanstack/react-query'],
  database: [
    'prisma',
    'drizzle-orm',
    'typeorm',
    'mongoose',
    'sequelize',
    '@supabase/supabase-js',
    'knex',
  ],
  testing: ['vitest', 'jest', '@testing-library/react', 'playwright', 'cypress', 'pytest', 'mocha'],
  build: ['tsup', 'esbuild', 'rollup', 'webpack', 'vite', 'turbo', 'nx'],
}

/** Categorize a single dependency name */
function categorize(dep: string): string {
  for (const [category, packages] of Object.entries(CATEGORY_MAP)) {
    if (packages.some((pkg) => dep === pkg || dep.startsWith(`${pkg}/`))) {
      return category
    }
  }
  return 'other'
}

/** Read dependencies from package.json */
async function readNodeDeps(projectRoot: string): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(path.join(projectRoot, 'package.json'), 'utf-8')
    const pkg = JSON.parse(raw) as Record<string, unknown>
    const deps = (pkg.dependencies ?? {}) as Record<string, string>
    const devDeps = (pkg.devDependencies ?? {}) as Record<string, string>
    return { ...deps, ...devDeps }
  } catch {
    return {}
  }
}

/** Read dependencies from requirements.txt */
async function readPythonDeps(projectRoot: string): Promise<Record<string, string>> {
  try {
    const raw = await fs.readFile(path.join(projectRoot, 'requirements.txt'), 'utf-8')
    const deps: Record<string, string> = {}
    for (const line of raw.split('\n')) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) continue
      const match = trimmed.match(/^([a-zA-Z0-9_-]+)(.*)$/)
      if (match) {
        deps[match[1]] = match[2] || '*'
      }
    }
    return deps
  } catch {
    return {}
  }
}

/** Scan all dependencies and categorize them */
export async function scanDeps(projectRoot: string): Promise<ScannedDepsInfo> {
  let raw: Record<string, string> = {}

  raw = await readNodeDeps(projectRoot)
  if (Object.keys(raw).length === 0) {
    raw = await readPythonDeps(projectRoot)
  }

  const categorized: ScannedDepsInfo['categorized'] = {
    ui: [],
    state: [],
    styling: [],
    api: [],
    database: [],
    testing: [],
    build: [],
    other: [],
  }

  for (const dep of Object.keys(raw)) {
    const cat = categorize(dep)
    categorized[cat as keyof typeof categorized].push(dep)
  }

  return { raw, categorized }
}
