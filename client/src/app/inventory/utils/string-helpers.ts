/**
 * Utility functions for string manipulation
 */

/**
 * Convert camelCase keys to snake_case for server sort fields
 */
export const toSnakeCase = (key: string): string => {
  return key.replace(/[A-Z]/g, (m) => '_' + m.toLowerCase());
};

/**
 * Convert snake_case to camelCase
 */
export const toCamelCase = (key: string): string => {
  return key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
};

/**
 * Convert string to title case
 */
export const toTitleCase = (str: string): string => {
  return str.replace(/\w\S*/g, (txt) => 
    txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
  );
};
