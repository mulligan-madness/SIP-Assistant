const { LLMProviderFactory } = require('../src/providers/factory');
const debug = require('debug')('forum-scraper:openai');
require('dotenv').config();

async function testOpenAI() {
  try {
    debug('Initializing OpenAI provider');
    const provider = LLMProviderFactory.createProvider('openai', {
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.LLM_MODEL || 'gpt-4'
    });

    console.log('\nTesting OpenAI integration...');
    const response = await provider.chat([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'What is a SIP?' }
    ]);

    console.log('\nResponse:', response);
    return true;
  } catch (error) {
    console.error('Error:', error.message);
    return false;
  }
}

if (require.main === module) {
  testOpenAI()
    .then(success => {
      if (success) {
        console.log('\nOpenAI test completed successfully!');
      } else {
        console.log('\nOpenAI test failed!');
        process.exit(1);
      }
      process.exit(0);
    });
} 