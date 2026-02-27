import { describe, expect, it } from 'vitest'
import { buildRetryPrompt, parseAiResponse } from '../../src/ai/response-parser.js'

describe('parseAiResponse', () => {
  it('should parse valid JSON response', () => {
    const json = JSON.stringify({
      version: '1',
      project: { name: 'test', type: 'cli', language: 'typescript' },
      targets: ['claude'],
    })

    const result = parseAiResponse(json)
    expect(result.project.name).toBe('test')
    expect(result.project.language).toBe('typescript')
    expect(result.targets).toContain('claude')
  })

  it('should extract JSON from markdown fences', () => {
    const response = `Here is the config:
\`\`\`json
{
  "version": "1",
  "project": { "name": "test", "type": "api", "language": "python" },
  "targets": ["cursor"]
}
\`\`\`
Some explanation here.`

    const result = parseAiResponse(response)
    expect(result.project.name).toBe('test')
    expect(result.project.language).toBe('python')
  })

  it('should add defaults for missing version and targets', () => {
    const json = JSON.stringify({
      project: { name: 'test', type: 'library', language: 'go' },
    })

    const result = parseAiResponse(json)
    expect(result.version).toBe('1')
    expect(result.targets.length).toBeGreaterThan(0)
  })

  it('should throw on invalid JSON', () => {
    expect(() => parseAiResponse('not json at all')).toThrow('not valid JSON')
  })

  it('should throw on invalid schema', () => {
    const json = JSON.stringify({
      version: '1',
      project: { name: '' },
      targets: ['claude'],
    })

    expect(() => parseAiResponse(json)).toThrow()
  })

  it('should handle JSON embedded in text', () => {
    const response = `Sure, here's the config: {"version":"1","project":{"name":"app","type":"web-app","language":"typescript"},"targets":["claude"]} Hope that helps!`

    const result = parseAiResponse(response)
    expect(result.project.name).toBe('app')
  })
})

describe('buildRetryPrompt', () => {
  it('should include error message', () => {
    const prompt = buildRetryPrompt('bad response', 'Invalid JSON')
    expect(prompt).toContain('Invalid JSON')
    expect(prompt).toContain('bad response')
  })

  it('should truncate long original responses', () => {
    const longResponse = 'x'.repeat(1000)
    const prompt = buildRetryPrompt(longResponse, 'error')
    expect(prompt.length).toBeLessThan(longResponse.length + 200)
  })
})
