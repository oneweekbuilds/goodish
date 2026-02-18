/**
 * AlgorithmLens Auth Bridge Content Script
 *
 * Injected on algorithmlens.com (and localhost dev) to enable secure
 * communication between the web app and the Chrome extension.
 *
 * Purpose:
 * - Receives auth tokens from the web app via window.postMessage
 * - Forwards tokens to the background service worker via chrome.runtime.sendMessage
 * - Injects a DOM marker so the web app can detect the extension is installed
 *
 * Security:
 * - Only accepts messages with the correct type ('ALGORITHMLENS_AUTH_TOKEN')
 * - Validates origin matches the expected web app domain
 * - Never exposes extension internals to the page
 */

// Inject DOM marker so the web app can detect the extension
(function injectExtensionMarker() {
  const marker = document.createElement('div');
  marker.id = 'algorithmlens-extension-marker';
  marker.setAttribute('data-version', chrome.runtime.getManifest().version);
  marker.style.display = 'none';
  document.documentElement.appendChild(marker);
})();

// Allowed origins for auth token messages
const ALLOWED_ORIGINS = [
  'https://algorithmlens.com',
  'https://www.algorithmlens.com',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

// Listen for auth token messages from the web app
window.addEventListener('message', async (event) => {
  // Validate origin
  if (!ALLOWED_ORIGINS.includes(event.origin)) return;

  const { type, token, action } = event.data || {};

  // Handle auth token transfer
  if (type === 'ALGORITHMLENS_AUTH_TOKEN') {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'SET_AUTH_TOKEN',
        token: token || null,
      });
      // Notify web app of success
      window.postMessage({
        type: 'ALGORITHMLENS_AUTH_TOKEN_ACK',
        success: response?.success ?? false,
      }, event.origin);
    } catch (e) {
      console.warn('[AlgorithmLens] Auth bridge error:', e.message);
      window.postMessage({
        type: 'ALGORITHMLENS_AUTH_TOKEN_ACK',
        success: false,
        error: e.message,
      }, event.origin);
    }
  }

  // Handle auth status check
  if (type === 'ALGORITHMLENS_AUTH_STATUS_REQUEST') {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'GET_AUTH_STATUS',
      });
      window.postMessage({
        type: 'ALGORITHMLENS_AUTH_STATUS_RESPONSE',
        authenticated: response?.authenticated ?? false,
      }, event.origin);
    } catch (e) {
      window.postMessage({
        type: 'ALGORITHMLENS_AUTH_STATUS_RESPONSE',
        authenticated: false,
        error: e.message,
      }, event.origin);
    }
  }
});
