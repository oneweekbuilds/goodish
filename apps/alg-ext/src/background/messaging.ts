import type { CaptureState, Message } from '../types';

/**
 * Broadcast message to all tabs
 */
export async function broadcastToTabs(message: Message): Promise<void> {
  const tabs = await chrome.tabs.query({});

  for (const tab of tabs) {
    if (tab.id) {
      try {
        await chrome.tabs.sendMessage(tab.id, message);
      } catch {
        // Tab might not have content script, ignore
      }
    }
  }
}

/**
 * Send state update to popup
 */
export function sendStateUpdate(state: CaptureState): void {
  // Try to send to popup (will fail silently if not open)
  chrome.runtime.sendMessage({
    type: 'STATE_UPDATE',
    state
  } as Message).catch(() => {
    // Popup not open, ignore
  });
}
