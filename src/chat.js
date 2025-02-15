const axios = require('axios');
const readline = require('readline');
const fs = require('fs');
const path = require('path');
const Spinner = require('./utils/spinner');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Add function to save chat to file
async function saveChatToFile(conversation) {
  const now = new Date();
  const timestamp = now.toISOString();
  const date = now.toISOString().split('T')[0];
  const outputDir = path.join(__dirname, 'output');
  const filePath = path.join(outputDir, `chat-history-${date}.md`);

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Format both messages with timestamp
  const formattedConversation = `
### User (${timestamp})
${conversation.userMessage}

### SIP Assistant (${timestamp})
${conversation.assistantMessage}
`;

  // Append to file
  fs.appendFileSync(filePath, formattedConversation);
  console.log(`Conversation saved to ${filePath}`);
}

// Promisify readline question
const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

async function chat() {
  console.log('\nSIP Assistant: Hello! I can help you write SIP proposals. What would you like to discuss?\n');

  // Create a recursive function to keep the conversation going
  const promptUser = async () => {
    const input = await askQuestion('You: ');
    
    if (input.toLowerCase() === 'exit' || input.toLowerCase() === 'quit') {
      console.log('\nSIP Assistant: Goodbye! Have a great day!\n');
      rl.close();
      return;
    }

    const spinner = new Spinner('Waiting for response...');

    try {
      spinner.start();
      const response = await axios.post('http://localhost:3000/chat', {
        message: input
      });
      spinner.stop();

      if (!response.data || !response.data.response) {
        throw new Error('Invalid response format from server');
      }

      // Extract and display the assistant's message
      const assistantMessage = response.data.response;
      console.log('\nSIP Assistant:', assistantMessage, '\n');

      // Ask if user wants to save the conversation
      const saveResponse = await askQuestion('Would you like to save this response? (y/n): ');
      if (saveResponse.toLowerCase() === 'y') {
        await saveChatToFile({
          userMessage: input,
          assistantMessage: assistantMessage
        });
      }
      console.log(); // Add newline after save prompt

    } catch (error) {
      spinner.stop();
      const errorMessage = error.response?.data?.error || 'Could not connect to the chatbot server. Make sure it\'s running on port 3000.';
      console.log('\nError:', errorMessage, '\n');
    }

    // Continue the conversation
    promptUser();
  };

  promptUser();
}

// Start the chat
chat(); 