/**
 * On-page capture indicator
 */

import type { Message } from '../types';

let isCapturing = false;
let indicatorEl: HTMLDivElement | null = null;

/**
 * Create indicator element
 */
function createIndicator(): HTMLDivElement {
  const el = document.createElement('div');
  el.id = 'algorithmlens-indicator';
  el.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    z-index: 999999;
    background: rgba(0, 0, 0, 0.85);
    color: #fff;
    padding: 8px 16px;
    border-radius: 20px;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    user-select: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  `;

  // Indicator dot
  const dot = document.createElement('span');
  dot.style.cssText = `
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #22c55e;
    animation: pulse 2s ease-in-out infinite;
  `;
  el.appendChild(dot);

  // Text
  const text = document.createElement('span');
  text.textContent = 'AlgorithmLens: capturing';
  el.appendChild(text);

  // Pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    #algorithmlens-indicator:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.4);
    }
  `;
  document.head.appendChild(style);

  // Click to toggle
  el.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'TOGGLE_CAPTURE' });
  });

  return el;
}

/**
 * Show indicator
 */
function showIndicator() {
  if (indicatorEl) return;

  indicatorEl = createIndicator();
  document.body.appendChild(indicatorEl);
}

/**
 * Hide indicator
 */
function hideIndicator() {
  if (!indicatorEl) return;

  indicatorEl.remove();
  indicatorEl = null;
}

/**
 * Message handler
 */
chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type === 'START_CAPTURE') {
    isCapturing = true;
    showIndicator();
  } else if (message.type === 'STOP_CAPTURE') {
    isCapturing = false;
    hideIndicator();
  }
});

// Check if already capturing
chrome.runtime.sendMessage({ type: 'GET_STATE' }, (response: any) => {
  if (response?.state?.isCapturing) {
    isCapturing = true;
    showIndicator();
  }
});

console.log('Indicator loaded');
