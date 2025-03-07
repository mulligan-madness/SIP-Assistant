const path = require('path');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

// Load environment variables
const envPath = path.join(__dirname, '.env');
dotenv.config({ path: envPath });

console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);

try {
  // Initialize OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  
  console.log('OpenAI client initialized successfully');
  
  // Test a simple API call
  async function testEmbedding() {
    try {
      const embedding = await openai.embeddings.create({
        model: "text-embedding-3-small",
        input: "Hello, world!"
      });
      console.log('Embedding created successfully');
      console.log('Embedding dimensions:', embedding.data[0].embedding.length);
    } catch (error) {
      console.error('Error creating embedding:', error.message);
      if (error.response) {
        console.error('Error details:', error.response.data);
      }
    }
  }
  
  testEmbedding();
} catch (error) {
  console.error('Error initializing OpenAI client:', error.message);
} 