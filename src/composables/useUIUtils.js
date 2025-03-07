import { marked } from 'marked';
import Prism from 'prismjs';

/**
 * Composable for UI utilities
 * @returns {Object} UI utility functions
 */
export function useUIUtils() {
  /**
   * Render markdown content to HTML
   * @param {string} content - Markdown content to render
   * @returns {string} Rendered HTML
   */
  const renderMarkdown = (content) => {
    // Handle null or undefined content
    if (!content) {
      console.warn('Received null or undefined content in renderMarkdown');
      return '';
    }
    
    try {
      const rendered = marked(content, { breaks: true });
      setTimeout(() => {
        Prism.highlightAll();
      }, 0);
      return rendered;
    } catch (error) {
      console.error('Error rendering markdown:', error);
      return String(content); // Return the content as a string if rendering fails
    }
  };
  
  /**
   * Scroll an element to the bottom
   * @param {HTMLElement} element - Element to scroll
   */
  const scrollToBottom = (element) => {
    if (element) {
      element.scrollTop = element.scrollHeight;
    }
  };
  
  /**
   * Export text content to a file
   * @param {string} content - Content to export
   * @param {string} filename - Filename to use
   */
  const exportToFile = (content, filename = 'export.txt') => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Success status
   */
  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (error) {
      console.error('Failed to copy text:', error);
      return false;
    }
  };
  
  return {
    renderMarkdown,
    scrollToBottom,
    exportToFile,
    copyToClipboard
  };
} 