/**
 * Date utility functions for consistent date formatting across the application
 */

/**
 * Format a date string to a localized date string
 * @param {string|Date} dateString - Date string or Date object to format
 * @param {Object} options - Formatting options
 * @param {string} options.format - Format type ('short', 'medium', 'long', 'full', 'iso', 'custom')
 * @param {Object} options.customOptions - Custom formatting options for toLocaleDateString
 * @param {string} options.fallback - Fallback string if date is invalid
 * @returns {string} Formatted date string
 */
function formatDate(dateString, options = {}) {
  const {
    format = 'medium',
    customOptions = {},
    fallback = 'No date'
  } = options;

  if (!dateString) return fallback;
  
  try {
    const date = dateString instanceof Date ? dateString : new Date(dateString);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      return fallback;
    }
    
    switch (format) {
      case 'short':
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'numeric', 
          day: 'numeric' 
        });
      case 'medium':
        return date.toLocaleDateString();
      case 'long':
        return date.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'full':
        return date.toLocaleDateString(undefined, { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
      case 'iso':
        return date.toISOString();
      case 'custom':
        return date.toLocaleDateString(undefined, customOptions);
      default:
        return date.toLocaleDateString();
    }
  } catch (error) {
    console.error('Error formatting date:', error);
    return fallback;
  }
}

/**
 * Get current date in ISO format
 * @returns {string} Current date in ISO format
 */
function getCurrentISODate() {
  return new Date().toISOString();
}

/**
 * Get current date in ISO format (date part only)
 * @returns {string} Current date in YYYY-MM-DD format
 */
function getCurrentDateOnly() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format a timestamp for file naming (removes special characters)
 * @returns {string} Formatted timestamp for filenames
 */
function getTimestampForFilename() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

module.exports = {
  formatDate,
  getCurrentISODate,
  getCurrentDateOnly,
  getTimestampForFilename
}; 