import { describe, expect, it, vi } from 'vitest'
import { callAi } from '../../src/ai/client.js'

describe('AI client', () => {
  it('should build correct Claude request', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        content: [{ text: '{"version":"1"}' }],
      }),
    }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse as Response)

    await callAi({
      provider: 'claude',
      apiKey: 'sk-ant-test',
      prompt: 'test prompt',
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.anthropic.com/v1/messages',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'x-api-key': 'sk-ant-test',
          'anthropic-version': '2023-06-01',
        }),
      }),
    )

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
    expect(body.model).toBe('claude-sonnet-4-20250514')
    expect(body.messages[0].content).toBe('test prompt')

    fetchSpy.mockRestore()
  })

  it('should build correct OpenAI request', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        choices: [{ message: { content: 'response text' } }],
      }),
    }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse as Response)

    const result = await callAi({
      provider: 'openai',
      apiKey: 'sk-test',
      prompt: 'test',
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      'https://api.openai.com/v1/chat/completions',
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer sk-test',
        }),
      }),
    )

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
    expect(body.model).toBe('gpt-4o')
    expect(result.text).toBe('response text')

    fetchSpy.mockRestore()
  })

  it('should build correct Gemini request', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: 'gemini response' }] } }],
      }),
    }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse as Response)

    const result = await callAi({
      provider: 'gemini',
      apiKey: 'AItest123',
      prompt: 'test',
    })

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining('generativelanguage.googleapis.com'),
      expect.anything(),
    )
    expect(fetchSpy.mock.calls[0][0]).toContain('key=AItest123')
    expect(result.text).toBe('gemini response')

    fetchSpy.mockRestore()
  })

  it('should throw on 401 unauthorized', async () => {
    const mockResponse = {
      ok: false,
      status: 401,
      text: async () => 'Unauthorized',
    }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse as Response)

    await expect(callAi({ provider: 'claude', apiKey: 'bad-key', prompt: 'test' })).rejects.toThrow(
      'Authentication failed',
    )

    fetchSpy.mockRestore()
  })

  it('should throw on 429 rate limit', async () => {
    const mockResponse = {
      ok: false,
      status: 429,
      text: async () => 'Rate limited',
    }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse as Response)

    await expect(callAi({ provider: 'openai', apiKey: 'key', prompt: 'test' })).rejects.toThrow(
      'Rate limited',
    )

    fetchSpy.mockRestore()
  })

  it('should throw on generic API error', async () => {
    const mockResponse = {
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse as Response)

    await expect(callAi({ provider: 'gemini', apiKey: 'key', prompt: 'test' })).rejects.toThrow(
      'gemini API error (500)',
    )

    fetchSpy.mockRestore()
  })

  it('should respect maxTokens option', async () => {
    const mockResponse = {
      ok: true,
      status: 200,
      json: async () => ({
        content: [{ text: 'ok' }],
      }),
    }

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(mockResponse as Response)

    await callAi({
      provider: 'claude',
      apiKey: 'key',
      prompt: 'test',
      maxTokens: 8192,
    })

    const body = JSON.parse(fetchSpy.mock.calls[0][1]?.body as string)
    expect(body.max_tokens).toBe(8192)

    fetchSpy.mockRestore()
  })
})
