import { PostgrestError } from '@supabase/supabase-js';

/**
 * Format error message from various error types
 * @param error Error object
 * @returns Formatted error message
 */
export const formatErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (isPostgrestError(error)) {
    return error.message || 'Database error occurred';
  }
  
  return 'An unknown error occurred';
};

/**
 * Type guard for PostgrestError
 * @param error Error object
 * @returns True if the error is a PostgrestError
 */
export const isPostgrestError = (error: unknown): error is PostgrestError => {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    'code' in error &&
    'details' in error &&
    'hint' in error
  );
};

/**
 * Log error to console with additional context
 * @param error Error object
 * @param context Additional context information
 */
export const logError = (error: unknown, context?: string): void => {
  const errorMessage = formatErrorMessage(error);
  const contextMessage = context ? ` [${context}]` : '';
  
  console.error(`Error${contextMessage}: ${errorMessage}`);
  
  if (error instanceof Error && error.stack) {
    console.error(error.stack);
  }
};

/**
 * Handle API errors and return a user-friendly message
 * @param error Error object
 * @param defaultMessage Default message to show if error can't be parsed
 * @returns User-friendly error message
 */
export const handleApiError = (
  error: unknown,
  defaultMessage: string = 'An error occurred. Please try again.'
): string => {
  logError(error);
  
  if (isPostgrestError(error)) {
    // Handle specific Supabase error codes
    switch (error.code) {
      case '23505': // Unique violation
        return 'This record already exists.';
      case '23503': // Foreign key violation
        return 'This operation references a record that does not exist.';
      case '42P01': // Undefined table
        return 'The requested resource does not exist.';
      case '42501': // Insufficient privilege
        return 'You do not have permission to perform this action.';
      default:
        return error.message || defaultMessage;
    }
  }
  
  if (error instanceof Error) {
    // Handle network errors
    if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
      return 'Network error. Please check your internet connection.';
    }
    
    return error.message;
  }
  
  return defaultMessage;
};
