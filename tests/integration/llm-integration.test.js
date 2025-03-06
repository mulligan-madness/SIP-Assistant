import { describe, it, expect, beforeEach } from 'vitest'
import nock from 'nock'
import { LLMProviderFactory } from '../../src/providers/factory.js'

describe('LLM Integration Tests', () => {
  describe('OpenAI Provider Integration', () => {
    let provider

    beforeEach(() => {
      nock.cleanAll()
      provider = LLMProviderFactory.createProvider('openai', {
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
        dangerouslyAllowBrowser: true
      })
    })

    it('should handle chat messages', async () => {
      // Mock the OpenAI API endpoint
      nock('https://api.openai.com')
        .post('/v1/chat/completions')
        .reply(200, {
          choices: [
            {
              message: {
                content: 'Test response'
              }
            }
          ]
        })

      const response = await provider.chat([
        { role: 'user', content: 'Test message' }
      ])

      expect(response).toBeDefined()
      expect(typeof response).toBe('string')
      expect(response).toBe('Test response')
    })

    it('should handle network errors gracefully', async () => {
      // Mock a failed request
      nock('https://api.openai.com')
        .post('/v1/chat/completions')
        .replyWithError('Network error')

      await expect(provider.chat([
        { role: 'user', content: 'Test message' }
      ])).rejects.toThrow()
    })
  })

  // Add more provider tests as needed
}) 