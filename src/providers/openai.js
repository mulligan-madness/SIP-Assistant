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
    console.log(`[OPENAI] Making chat request with ${messages.length} messages`);
    
    // Convert system messages to user messages if needed
    const adaptedMessages = messages.map(msg => ({
      role: msg.role === 'system' ? 'user' : msg.role,
      content: msg.content
    }));
    
    console.log(`[OPENAI] Using model: ${this.model}`);
    console.log(`[OPENAI] First few messages:`, JSON.stringify(adaptedMessages.slice(0, 2), null, 2));
    
    try {
      console.log(`[OPENAI] Sending request to OpenAI API`);
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: adaptedMessages
      });
      
      console.log(`[OPENAI] Received response from OpenAI API`);
      console.log(`[OPENAI] Response:`, JSON.stringify({
        id: response.id,
        model: response.model,
        usage: response.usage,
        content: response.choices[0].message.content.substring(0, 100) + (response.choices[0].message.content.length > 100 ? '...' : '')
      }, null, 2));
      
      return response.choices[0].message.content;
    } catch (error) {
      console.error(`[OPENAI] Error in chat request:`, error);
      throw error;
    }
  }
}

module.exports = { OpenAIProvider }; 