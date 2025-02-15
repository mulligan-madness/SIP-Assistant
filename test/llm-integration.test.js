import { describe, it, expect, beforeEach } from 'vitest'
import nock from 'nock'
import { LLMProviderFactory } from '../src/providers/factory.js'

describe('LLM Integration Tests', () => {
  describe('Local Provider Integration', () => {
    let provider

    beforeEach(() => {
      nock.cleanAll()
      provider = LLMProviderFactory.createProvider('local', {
        baseUrl: 'http://localhost:3000/v1'
      })
    })

    it('should handle chat messages', async () => {
      // Mock the chat completion endpoint
      nock('http://localhost:3000/v1')
        .post('/chat/completions')
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
    }, { timeout: 10000 })

    it('should handle network errors gracefully', async () => {
      // Mock a failed request
      nock('http://localhost:3000/v1')
        .post('/chat/completions')
        .replyWithError('Network error')

      await expect(provider.chat([
        { role: 'user', content: 'Test message' }
      ])).rejects.toThrow()
    }, { timeout: 10000 })
  })

  // Add more provider tests as needed
}) 