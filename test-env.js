const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment variables
const envPath = path.join(__dirname, '.env');
console.log('Checking .env file at:', envPath);
console.log('File exists:', fs.existsSync(envPath));

// Load the .env file
dotenv.config({ path: envPath });

// Check if the OpenAI API key is loaded
console.log('OPENAI_API_KEY exists:', !!process.env.OPENAI_API_KEY);
console.log('OPENAI_API_KEY length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);
console.log('First 10 chars of OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 10) : 'N/A'); 