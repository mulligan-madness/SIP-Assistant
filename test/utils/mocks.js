class MockLLMProvider {
  constructor(responses = {}) {
    this.responses = responses;
  }

  async complete(prompt) {
    return this.responses.complete || 'mock completion response';
  }

  async chat(messages) {
    return this.responses.chat || 'mock chat response';
  }
}

module.exports = { MockLLMProvider }; 