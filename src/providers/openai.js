const OpenAI = require('openai');
const { BaseLLMProvider } = require('./base');
const debug = require('debug')('chatbot:openai');

class OpenAIProvider extends BaseLLMProvider {
  constructor(config = {}) {
    super();
    debug('Initializing OpenAI provider with config:', { ...config, apiKey: config.apiKey ? 'Set' : 'Not set' });
    
    // If running in test mode, use a dummy client
    if (process.env.NODE_ENV === 'test') {
      this.client = {
        chat: {
          completions: {
            create: async (options) => {
              return { choices: [{ message: { content: 'Test response' } }] };
            }
          }
        }
      };
    } else {
      this.client = new OpenAI({
        apiKey: config.apiKey
      });
    }

    this.model = config.model || 'gpt-3.5-turbo';
    this.config = config;
    debug('Using model:', this.model);
  }

  async complete(prompt) {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: this.config.maxTokens,
      temperature: this.config.temperature
    });

    return response.choices[0].message.content;
  }

  async chat(messages) {
    // Convert system messages to user messages if needed
    const adaptedMessages = messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role,
      content: msg.content
    }));

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: adaptedMessages
    });
    return response.choices[0].message.content;
  }
}

module.exports = { OpenAIProvider }; 