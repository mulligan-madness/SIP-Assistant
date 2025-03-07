/**
 * Service for chat API communication
 */
export class ChatApiService {
  /**
   * Get the base URL for API requests
   * @returns {string} Base URL
   */
  static getBaseUrl() {
    return (window.location.origin && window.location.origin !== 'null') 
      ? window.location.origin 
      : 'http://localhost';
  }
  
  /**
   * Check server status
   * @returns {Promise<Object>} Server status
   */
  static async checkServerStatus() {
    try {
      const response = await fetch(`${this.getBaseUrl()}/api/status`);
      return await response.json();
    } catch (error) {
      console.error('Error checking server status:', error);
      throw error;
    }
  }
  
  /**
   * Send a chat message
   * @param {string} message - Message text
   * @param {string} sessionId - Session ID
   * @param {Array} messageHistory - Message history
   * @param {boolean} isInterviewMode - Whether interview mode is active
   * @returns {Promise<Object>} Response data
   */
  static async sendMessage(message, sessionId, messageHistory, isInterviewMode = false) {
    try {
      const endpoint = isInterviewMode 
        ? `${this.getBaseUrl()}/api/interview` 
        : `${this.getBaseUrl()}/api/chat`;
      
      console.log(`Sending chat request to: ${endpoint}`);
      
      // Convert the frontend message format to the server's expected format
      const formattedHistory = messageHistory.map(msg => ({
        role: msg.type === 'user' ? 'user' : 'assistant',
        content: msg.content
      }));
      
      const requestBody = {
        message,
        sessionId,
        messageHistory: formattedHistory,
        useRetrieval: true // Enable retrieval for interview mode
      };
      
      console.log('Request payload:', JSON.stringify(requestBody, null, 2));
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      
      // Clone the response and get the text
      const responseClone = response.clone();
      const responseText = await responseClone.text();
      
      if (!response.ok) {
        console.error('Error response received:', response.status, responseText);
        try {
          const errorData = JSON.parse(responseText);
          throw new Error(errorData.userMessage || errorData.error || 'Network response was not ok');
        } catch (parseError) {
          throw new Error(`Server returned ${response.status}: ${responseText.substring(0, 100)}...`);
        }
      }
      
      // Process the response
      let responseContent = '';
      
      try {
        // Try to parse as JSON first
        const parsedResponse = JSON.parse(responseText);
        
        // For our API responses that follow the {success, message, sessionId} format
        if (parsedResponse && typeof parsedResponse.message === 'string') {
          responseContent = parsedResponse.message;
        }
        // Fallbacks for other response formats
        else if (parsedResponse && typeof parsedResponse.response === 'string') {
          responseContent = parsedResponse.response;
        }
        else if (parsedResponse && typeof parsedResponse.content === 'string') {
          responseContent = parsedResponse.content;
        }
        // Last resort - if we can't extract a specific field, just use plain text
        else {
          console.warn('Could not find message field in response, using fallback');
          responseContent = 'The assistant response could not be processed correctly. Please try again.';
        }
      } catch (jsonError) {
        // Not JSON, use as plain text
        console.log('Response is not JSON, using as plain text');
        responseContent = responseText;
      }
      
      return { content: responseContent, sessionId };
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }
  
  /**
   * Clear interview session
   * @param {string} sessionId - Session ID
   * @returns {Promise<void>}
   */
  static async clearInterviewSession(sessionId) {
    try {
      await fetch(`${this.getBaseUrl()}/api/interview/clear/${sessionId}`, {
        method: 'POST'
      });
      console.log('Cleared interview session');
    } catch (error) {
      console.error('Error clearing interview session:', error);
      throw error;
    }
  }
} 