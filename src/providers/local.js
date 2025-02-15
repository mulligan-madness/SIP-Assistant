const { BaseLLMProvider } = require('./base');
const axios = require('axios');
const debug = require('debug')('forum-scraper:local-provider');

class LocalLLMProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super();
    this.baseUrl = config.baseUrl || 'http://localhost:1234/v1';
    this.model = config.model || 'phi-4';
    this.temperature = config.temperature || 0.7;
    this.maxTokens = config.maxTokens || 15000;
    debug('Initialized LocalLLMProvider with baseUrl:', this.baseUrl);
  }

  async complete(prompt) {
    debug('Sending completion request');
    try {
      const response = await axios.post(`${this.baseUrl}/completions`, {
        prompt,
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens
      });
      
      debug('Received completion response');
      if (!response.data?.choices?.[0]?.text) {
        throw new Error('Invalid response format from LMStudio');
      }
      return response.data.choices[0].text;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Could not connect to LMStudio. Is it running?');
      }
      debug('Error in completion request:', error.message);
      throw error;
    }
  }

  async chat(messages) {
    debug('Sending chat request');
    try {
      const response = await axios.post(`${this.baseUrl}/chat/completions`, {
        messages,
        model: this.model,
        temperature: this.temperature,
        max_tokens: this.maxTokens
      });
      
      debug('Received chat response');
      if (!response.data?.choices?.[0]?.message?.content) {
        throw new Error('Invalid response format from LMStudio');
      }
      return response.data.choices[0].message.content;
    } catch (error) {
      if (error.code === 'ECONNREFUSED') {
        throw new Error('Could not connect to LMStudio. Is it running?');
      }
      debug('Error in chat request:', error.message);
      throw error;
    }
  }
}

module.exports = { LocalLLMProvider }; 