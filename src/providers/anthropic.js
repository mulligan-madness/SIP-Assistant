const { BaseLLMProvider } = require('./base');
const Anthropic = require('@anthropic-ai/sdk');
const debug = require('debug')('forum-scraper:anthropic');

class AnthropicProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super();
    if (!config.apiKey) {
      throw new Error('Anthropic API key is required');
    }
    this.client = new Anthropic({ apiKey: config.apiKey });
    this.model = config.model || 'claude-3-opus-latest';
    debug('Initialized AnthropicProvider with model:', this.model);
  }

  async complete(prompt) {
    debug('Sending completion request');
    try {
      const response = await this.client.messages.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 4096
      });
      
      debug('Received completion response');
      return response.content[0].text;
    } catch (error) {
      debug('Error in completion request:', error.message);
      throw error;
    }
  }

  async chat(messages) {
    debug('Sending chat request');
    try {
      // Extract system message if present
      const systemMessage = messages.find(m => m.role === 'system')?.content;
      const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content
      }));

      const response = await this.client.messages.create({
        model: this.model,
        messages: userMessages,
        system: systemMessage, // Pass system message as top-level parameter
        max_tokens: 4096
      });
      
      debug('Received chat response');
      return response.content[0].text;
    } catch (error) {
      debug('Error in chat request:', error.message);
      throw error;
    }
  }
}

module.exports = { AnthropicProvider }; 