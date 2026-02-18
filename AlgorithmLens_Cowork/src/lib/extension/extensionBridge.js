/**
 * Extension Bridge — Web App ↔ Chrome Extension Communication
 *
 * Provides functions to communicate with the AlgorithmLens Chrome extension
 * via window.postMessage. The extension's auth_bridge.js content script
 * listens for these messages on algorithmlens.com pages.
 *
 * SYNC WARNING: Message types must match alg-gemini-extension/src/auth_bridge.js
 */

/**
 * Check if the AlgorithmLens Chrome extension is installed.
 * Looks for the DOM marker injected by the extension's auth_bridge.js.
 *
 * @returns {{ installed: boolean, version: string|null }}
 */
export function detectExtension() {
  const marker = document.getElementById('algorithmlens-extension-marker');
  return {
    installed: !!marker,
    version: marker?.getAttribute('data-version') || null,
  };
}

/**
 * Send the auth token to the Chrome extension.
 * Should be called after the user logs in or when the session refreshes.
 *
 * @param {string|null} token - JWT access token, or null to clear
 * @returns {Promise<boolean>} Whether the extension acknowledged the token
 */
export function sendAuthTokenToExtension(token) {
  return new Promise((resolve) => {
    const { installed } = detectExtension();
    if (!installed) {
      resolve(false);
      return;
    }

    // Set up listener for acknowledgment
    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(false);
    }, 2000);

    function handler(event) {
      if (event.data?.type === 'ALGORITHMLENS_AUTH_TOKEN_ACK') {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        resolve(event.data.success ?? false);
      }
    }

    window.addEventListener('message', handler);

    // Send the token
    window.postMessage({
      type: 'ALGORITHMLENS_AUTH_TOKEN',
      token,
    }, window.location.origin);
  });
}

/**
 * Check if the extension has a valid auth token.
 *
 * @returns {Promise<boolean>} Whether the extension is authenticated
 */
export function checkExtensionAuthStatus() {
  return new Promise((resolve) => {
    const { installed } = detectExtension();
    if (!installed) {
      resolve(false);
      return;
    }

    const timeout = setTimeout(() => {
      window.removeEventListener('message', handler);
      resolve(false);
    }, 2000);

    function handler(event) {
      if (event.data?.type === 'ALGORITHMLENS_AUTH_STATUS_RESPONSE') {
        clearTimeout(timeout);
        window.removeEventListener('message', handler);
        resolve(event.data.authenticated ?? false);
      }
    }

    window.addEventListener('message', handler);

    window.postMessage({
      type: 'ALGORITHMLENS_AUTH_STATUS_REQUEST',
    }, window.location.origin);
  });
}
