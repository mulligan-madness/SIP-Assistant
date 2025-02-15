const { BaseLLMProvider } = require('./base');
const { OpenAI } = require('openai');

class OpenAIProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super();
    this.client = new OpenAI(config.apiKey);
    this.model = config.model || 'o1-mini-2024-09-12';
    this.config = config;
  }

  async complete(prompt) {
    // Determine which parameter name to use based on model
    const isOModel = this.config.model.startsWith('o');
    const tokenParam = isOModel ? 'max_completion_tokens' : 'max_tokens';

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: [{ role: 'user', content: prompt }],
      [tokenParam]: this.config.maxTokens,
      temperature: this.config.temperature
    });

    return response.choices[0].message.content;
  }

  async chat(messages) {
    // For O-series models, convert system messages to user messages
    const isOModel = this.config.model.startsWith('o');
    const adaptedMessages = isOModel ? 
      messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role,
        content: msg.content
      })) : messages;

    const response = await this.client.chat.completions.create({
      model: this.config.model,
      messages: adaptedMessages
    });
    return response.choices[0].message.content;
  }
}

module.exports = { OpenAIProvider }; 