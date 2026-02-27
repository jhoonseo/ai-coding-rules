import type { AiProvider } from '../utils/config-store.js'

export interface AiRequestOptions {
  provider: AiProvider
  apiKey: string
  prompt: string
  maxTokens?: number
}

export interface AiResponse {
  text: string
  provider: AiProvider
}

const PROVIDER_CONFIG: Record<
  AiProvider,
  {
    url: string | ((apiKey: string) => string)
    model: string
    buildHeaders: (apiKey: string) => Record<string, string>
    buildBody: (prompt: string, model: string, maxTokens: number) => unknown
    extractText: (data: unknown) => string
  }
> = {
  claude: {
    url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-sonnet-4-20250514',
    buildHeaders: (apiKey) => ({
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    }),
    buildBody: (prompt, model, maxTokens) => ({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
    extractText: (data) => {
      const d = data as { content: { text: string }[] }
      return d.content[0].text
    },
  },
  openai: {
    url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o',
    buildHeaders: (apiKey) => ({
      Authorization: `Bearer ${apiKey}`,
      'content-type': 'application/json',
    }),
    buildBody: (prompt, model, maxTokens) => ({
      model,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    }),
    extractText: (data) => {
      const d = data as { choices: { message: { content: string } }[] }
      return d.choices[0].message.content
    },
  },
  gemini: {
    url: (apiKey) =>
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    model: 'gemini-2.0-flash',
    buildHeaders: () => ({
      'content-type': 'application/json',
    }),
    buildBody: (prompt, _model, maxTokens) => ({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    }),
    extractText: (data) => {
      const d = data as { candidates: { content: { parts: { text: string }[] } }[] }
      return d.candidates[0].content.parts[0].text
    },
  },
}

/** Call an AI provider API */
export async function callAi(options: AiRequestOptions): Promise<AiResponse> {
  const { provider, apiKey, prompt, maxTokens = 4096 } = options
  const config = PROVIDER_CONFIG[provider]

  const url = typeof config.url === 'function' ? config.url(apiKey) : config.url
  const headers = config.buildHeaders(apiKey)
  const body = config.buildBody(prompt, config.model, maxTokens)

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const errorBody = await response.text()
    if (response.status === 429) {
      throw new Error(`Rate limited by ${provider}. Please wait and try again.`)
    }
    if (response.status === 401) {
      throw new Error(`Authentication failed for ${provider}. Check your API key.`)
    }
    throw new Error(`${provider} API error (${response.status}): ${errorBody}`)
  }

  const data: unknown = await response.json()
  const text = config.extractText(data)

  return { text, provider }
}
