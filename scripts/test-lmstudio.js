const { LLMProviderFactory } = require('../src/providers/factory');
const debug = require('debug')('forum-scraper:lmstudio');

async function testLMStudio() {
  try {
    debug('Initializing LMStudio provider');
    const provider = LLMProviderFactory.createProvider('local', {
      baseUrl: 'http://localhost:1234/v1',
      model: 'phi-4',
      temperature: 0.7
    });

    // Test chat
    debug('Testing chat endpoint');
    console.log('\nSending chat request...');
    const chatResponse = await provider.chat([
      { role: 'system', content: 'You are a helpful assistant.' },
      { role: 'user', content: 'Say hello!' }
    ]);
    console.log('Chat Response:', chatResponse);

    // Test completion
    debug('Testing completion endpoint');
    console.log('\nSending completion request...');
    const completionResponse = await provider.complete(
      'Write a short haiku:'
    );
    console.log('Completion Response:', completionResponse);

    return true;
  } catch (error) {
    console.error('\nError testing LMStudio:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    return false;
  }
}

// Run the test if called directly
if (require.main === module) {
  console.log('Testing LMStudio integration...\n');
  testLMStudio()
    .then(success => {
      if (success) {
        console.log('\nLMStudio test completed successfully!');
      } else {
        console.log('\nLMStudio test failed!');
        process.exit(1);
      }
      process.exit(0);
    });
}

module.exports = { testLMStudio }; 