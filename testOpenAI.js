const { Configuration, OpenAIApi } = require('openai');
require('dotenv').config();

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

async function testOpenAI() {
  try {
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: 'Hello, how can I help you today?',
      max_tokens: 50,
    });
    console.log(response.data.choices[0].text.trim());
  } catch (error) {
    console.error('Error with OpenAI API:', error);
  }
}

testOpenAI();
