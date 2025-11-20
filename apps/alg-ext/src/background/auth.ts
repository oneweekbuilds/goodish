import type { DeviceInfo, ExtensionSettings } from '../types';

/**
 * Register a new device with the API
 */
export async function registerDevice(
  accountId: string,
  apiBaseUrl: string
): Promise<DeviceInfo> {
  const response = await fetch(`${apiBaseUrl}/v1/devices/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ accountId })
  });

  if (!response.ok) {
    throw new Error(`Device registration failed: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    deviceId: data.deviceId,
    deviceToken: data.deviceToken,
    expiresAt: data.expiresAt,
    accountId
  };
}

/**
 * Get or create device
 */
export async function getOrCreateDevice(
  settings: ExtensionSettings
): Promise<DeviceInfo> {
  // Try to get existing device from storage
  const stored = await chrome.storage.local.get('device');

  if (stored.device) {
    const device = stored.device as DeviceInfo;

    // Check if token is still valid (with 1 day buffer)
    if (device.expiresAt > Date.now() + 86400000) {
      return device;
    }
  }

  // Register new device
  const device = await registerDevice(settings.accountId, settings.apiBaseUrl);

  // Store device info
  await chrome.storage.local.set({ device });

  return device;
}

/**
 * Get stored device
 */
export async function getStoredDevice(): Promise<DeviceInfo | null> {
  const stored = await chrome.storage.local.get('device');
  return stored.device || null;
}
