const { LLMProviderFactory } = require('../src/providers/factory');
const debug = require('debug')('forum-scraper:anthropic');
require('dotenv').config();

async function testAnthropic() {
  try {
    console.log('Starting Anthropic test...');
    debug('Initializing Anthropic provider');
    
    // Log environment check
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not found in environment');
    }
    
    const provider = LLMProviderFactory.createProvider('anthropic', {
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: 'claude-3-5-sonnet-20241022'
    });

    console.log('\nTesting Anthropic integration...');
    debug('Sending test chat message');
    
    const response = await provider.chat([
      { 
        role: 'system', 
        content: 'You are an expert on SuperRare, a decentralized digital art marketplace and its governance process. SuperRare Improvement Proposals (SIPs) are formal documents proposing changes to the SuperRare protocol, governance, or ecosystem.' 
      },
      { 
        role: 'user', 
        content: 'What is a SuperRare Improvement Proposal (SIP)?' 
      }
    ]);

    console.log('\nResponse:', response);
    return true;
  } catch (error) {
    console.error('\nError:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
    if (error.stack) {
      debug('Error stack:', error.stack);
    }
    return false;
  }
}

if (require.main === module) {
  console.log('Running Anthropic test script...');
  testAnthropic()
    .then(success => {
      if (success) {
        console.log('\nAnthropic test completed successfully!');
      } else {
        console.log('\nAnthropic test failed!');
        process.exit(1);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('\nUnexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testAnthropic }; 