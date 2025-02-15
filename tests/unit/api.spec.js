import { describe, it, expect } from 'vitest'
import request from 'supertest'
import app from '../../src/chatbot.js'

describe('API Endpoints', () => {
  it('returns server status', async () => {
    const response = await request(app)
      .get('/api/status')
      .expect('Content-Type', /json/)
      .expect(200)

    expect(response.body).toHaveProperty('llmInitialized')
    expect(response.body).toHaveProperty('dataLoaded')
  })

  it('initializes LLM provider', async () => {
    const response = await request(app)
      .post('/api/init-llm')
      .send({ provider: '1' })
      .expect('Content-Type', /json/)
      .expect(200)

    expect(response.body).toHaveProperty('success', true)
  })
}) 