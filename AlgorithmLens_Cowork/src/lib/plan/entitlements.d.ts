/**
 * Entitlements API Client - Type declarations
 */

export interface EntitlementsResponse {
  is_plus: boolean;
  subscription?: {
    status?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

export interface SyncResult {
  synced: boolean;
  tier?: string;
  reason?: string;
  error?: string;
  subscriptionStatus?: string;
}

export function fetchEntitlements(): Promise<EntitlementsResponse | null>;
export function syncPlanTierFromEntitlements(params: {
  isDemoMode: boolean;
  authReady: boolean;
  hasSession: boolean;
}): Promise<SyncResult>;
