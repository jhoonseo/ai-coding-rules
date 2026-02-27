import { describe, expect, it } from 'vitest'
import { configSchema, DEFAULT_CONFIG } from '../../src/types/config.js'

describe('configSchema', () => {
  const validConfig = {
    version: '1',
    project: {
      name: 'my-app',
      type: 'web-app',
      language: 'typescript',
      framework: 'next.js',
      runtime: 'node',
      packageManager: 'npm',
    },
    rules: {
      style: {
        indentation: 'spaces',
        indentSize: 2,
        quotes: 'single',
        semicolons: false,
        maxLineLength: 100,
        trailingComma: 'all',
      },
      naming: {
        files: 'kebab-case',
        components: 'PascalCase',
        functions: 'camelCase',
        constants: 'UPPER_SNAKE_CASE',
        types: 'PascalCase',
      },
      patterns: {
        'server-components': 'Use server components by default',
      },
    },
    structure: {
      'src/app': 'Next.js App Router pages',
      'src/components': 'Reusable React components',
    },
    instructions: {
      do: ['Use TypeScript strict mode', 'Write unit tests'],
      dont: ['Use any type', 'Use class components'],
      guidelines: ['Prefer functional approach'],
    },
    targets: ['claude', 'cursor', 'copilot'],
    overrides: {
      claude: {
        extraInstructions: ['Build with npm run build'],
        excludeSections: [],
      },
    },
  }

  it('should parse a valid config', () => {
    const result = configSchema.parse(validConfig)
    expect(result.version).toBe('1')
    expect(result.project.name).toBe('my-app')
    expect(result.targets).toEqual(['claude', 'cursor', 'copilot'])
  })

  it('should apply defaults for optional sections', () => {
    const minimal = {
      version: '1',
      project: {
        name: 'test',
        type: 'library',
        language: 'typescript',
      },
      targets: ['claude'],
    }
    const result = configSchema.parse(minimal)
    expect(result.rules).toEqual({})
    expect(result.structure).toEqual({})
    expect(result.instructions).toEqual({})
  })

  it('should reject invalid version', () => {
    const invalid = { ...validConfig, version: '2' }
    expect(() => configSchema.parse(invalid)).toThrow()
  })

  it('should reject missing project name', () => {
    const invalid = {
      ...validConfig,
      project: { ...validConfig.project, name: '' },
    }
    expect(() => configSchema.parse(invalid)).toThrow()
  })

  it('should reject invalid project type', () => {
    const invalid = {
      ...validConfig,
      project: { ...validConfig.project, type: 'invalid-type' },
    }
    expect(() => configSchema.parse(invalid)).toThrow()
  })

  it('should reject empty targets array', () => {
    const invalid = { ...validConfig, targets: [] }
    expect(() => configSchema.parse(invalid)).toThrow()
  })

  it('should reject invalid target agent', () => {
    const invalid = { ...validConfig, targets: ['unknown-agent'] }
    expect(() => configSchema.parse(invalid)).toThrow()
  })

  it('should reject invalid naming convention', () => {
    const invalid = {
      ...validConfig,
      rules: {
        naming: { files: 'INVALID_CASE' },
      },
    }
    expect(() => configSchema.parse(invalid)).toThrow()
  })

  it('should allow unknown fields (passthrough)', () => {
    const withExtra = { ...validConfig, customField: 'value' }
    // Should not throw — unknown fields are ignored
    const result = configSchema.parse(withExtra)
    expect(result.version).toBe('1')
  })
})

describe('DEFAULT_CONFIG', () => {
  it('should have version 1', () => {
    expect(DEFAULT_CONFIG.version).toBe('1')
  })

  it('should have default targets', () => {
    expect(DEFAULT_CONFIG.targets).toEqual(['claude', 'cursor', 'copilot'])
  })

  it('should have default style rules', () => {
    expect(DEFAULT_CONFIG.rules.style?.indentation).toBe('spaces')
    expect(DEFAULT_CONFIG.rules.style?.indentSize).toBe(2)
    expect(DEFAULT_CONFIG.rules.style?.quotes).toBe('single')
    expect(DEFAULT_CONFIG.rules.style?.semicolons).toBe(false)
  })

  it('should have default naming rules', () => {
    expect(DEFAULT_CONFIG.rules.naming?.files).toBe('kebab-case')
    expect(DEFAULT_CONFIG.rules.naming?.functions).toBe('camelCase')
    expect(DEFAULT_CONFIG.rules.naming?.types).toBe('PascalCase')
    expect(DEFAULT_CONFIG.rules.naming?.constants).toBe('UPPER_SNAKE_CASE')
  })
})
