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
    console.log(`[ANTHROPIC] Making chat request with ${messages.length} messages`);
    
    try {
      // Extract system message if present
      const systemMessage = messages.find(m => m.role === 'system')?.content;
      const userMessages = messages.filter(m => m.role !== 'system').map(m => ({
        role: m.role,
        content: m.content
      }));
      
      console.log(`[ANTHROPIC] Using model: ${this.model}`);
      console.log(`[ANTHROPIC] System message:`, systemMessage ? systemMessage.substring(0, 100) + (systemMessage.length > 100 ? '...' : '') : 'None');
      console.log(`[ANTHROPIC] First few user messages:`, JSON.stringify(userMessages.slice(0, 2), null, 2));

      console.log(`[ANTHROPIC] Sending request to Anthropic API`);
      const response = await this.client.messages.create({
        model: this.model,
        messages: userMessages,
        system: systemMessage, // Pass system message as top-level parameter
        max_tokens: 4096
      });
      
      debug('Received chat response');
      console.log(`[ANTHROPIC] Received response from Anthropic API`);
      console.log(`[ANTHROPIC] Response:`, JSON.stringify({
        id: response.id,
        model: response.model,
        content: response.content[0].text.substring(0, 100) + (response.content[0].text.length > 100 ? '...' : '')
      }, null, 2));
      
      return response.content[0].text;
    } catch (error) {
      debug('Error in chat request:', error.message);
      console.error(`[ANTHROPIC] Error in chat request:`, error);
      throw error;
    }
  }
}

module.exports = { AnthropicProvider }; 