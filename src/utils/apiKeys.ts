// Client-side API Keys Utilities
// Allows secure key entry and dynamic passage to server proxy requests.

const GEMINI_KEY_STORAGE_NAME = 'nexus_user_gemini_api_key';

/**
 * Retrieves the user-configured Gemini API Key from localStorage.
 */
export function getStoredApiKey(): string {
  return localStorage.getItem(GEMINI_KEY_STORAGE_NAME) || '';
}

/**
 * Saves a user-configured Gemini API Key to localStorage.
 */
export function setStoredApiKey(key: string): void {
  if (key) {
    localStorage.setItem(GEMINI_KEY_STORAGE_NAME, key.trim());
  } else {
    localStorage.removeItem(GEMINI_KEY_STORAGE_NAME);
  }
}

/**
 * Appends the custom API key header to configuration fetch requests if available.
 */
export function getApiHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extraHeaders,
  };

  const storedKey = getStoredApiKey();
  if (storedKey) {
    headers['x-gemini-api-key'] = storedKey;
  }

  return headers;
}
