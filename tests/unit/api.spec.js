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
    expect(response.body).toHaveProperty('contextCompressed')
  })

  it('handles initialization automatically', async () => {
    // First status check should show initialization in progress
    const initialStatus = await request(app)
      .get('/api/status')
      .expect(200)

    // Status should eventually show initialization complete
    const finalStatus = await request(app)
      .get('/api/status')
      .expect(200)

    expect(finalStatus.body.llmInitialized).toBe(true)
  })
}) 