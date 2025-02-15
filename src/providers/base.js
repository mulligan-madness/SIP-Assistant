class BaseLLMProvider {
  async complete(prompt) {
    throw new Error('Method not implemented');
  }

  async chat(messages) {
    throw new Error('Method not implemented');
  }
}

module.exports = { BaseLLMProvider }; 