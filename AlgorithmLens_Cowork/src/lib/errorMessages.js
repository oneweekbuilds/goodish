/**
 * Error Message Utility (#18)
 *
 * Maps HTTP status codes and error types to user-friendly, actionable messages.
 * This is the single source of truth for error messaging across the app.
 *
 * Usage:
 * ```js
 * import { getErrorMessage } from '../lib/errorMessages';
 * const friendlyMessage = getErrorMessage(error);
 * setErrorMessage(friendlyMessage);
 * ```
 */

/**
 * Get a user-friendly error message for a given error.
 *
 * @param {Error|Response|number|string} error - The error object, response, HTTP status code, or error string
 * @returns {string} User-friendly error message
 */
export function getErrorMessage(error) {
  // Handle Response objects
  if (error instanceof Response) {
    return getErrorMessageByStatus(error.status);
  }

  // Handle HTTP status codes
  if (typeof error === 'number') {
    return getErrorMessageByStatus(error);
  }

  // Handle Error objects
  if (error instanceof Error) {
    // Check for network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'Unable to connect to AlgorithmLens servers. Check your internet connection.';
    }

    // Check for timeout errors
    if (error.message.includes('timeout')) {
      return 'The request took too long. Please check your internet connection and try again.';
    }

    // Return the original error message if it's descriptive
    if (error.message && !error.message.includes('undefined')) {
      return error.message;
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Default fallback
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Get error message by HTTP status code.
 *
 * @param {number} status - HTTP status code
 * @returns {string} User-friendly error message
 */
export function getErrorMessageByStatus(status) {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input and try again.';
    case 401:
      return 'Your session has expired. Please sign in again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'The requested resource was not found.';
    case 409:
      return 'This action conflicts with the current state. Please refresh and try again.';
    case 413:
      return 'The file is too large. Please upload a smaller file.';
    case 429:
      return 'Too many requests. Please wait a moment and try again.';
    case 500:
    case 502:
    case 503:
    case 504:
      return 'Something went wrong on our end. Please try again in a moment.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Get error context for analytics/logging.
 *
 * @param {Error|Response|number|string} error - The error object
 * @returns {Object} Error context with type and status
 */
export function getErrorContext(error) {
  let status = null;
  let type = 'unknown';

  if (error instanceof Response) {
    status = error.status;
    type = 'http_error';
  } else if (typeof error === 'number') {
    status = error;
    type = 'http_error';
  } else if (error instanceof Error) {
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      type = 'network_error';
    } else if (error.message.includes('timeout')) {
      type = 'timeout_error';
    } else {
      type = 'application_error';
    }
  } else if (typeof error === 'string') {
    type = 'string_error';
  }

  return {
    type,
    status,
    message: getErrorMessage(error),
  };
}
