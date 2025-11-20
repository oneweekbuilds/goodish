const LS_ACCOUNT_ID = "alg_account_id";
const LS_API_BASE = "alg_api_base_url";

export type ConnectedSettings = {
  accountId: string;
  apiBaseUrl: string;
};

export function getConnectedSettings(): ConnectedSettings {
  const accountId = (localStorage.getItem(LS_ACCOUNT_ID) || "").trim();
  const apiBaseUrl = (localStorage.getItem(LS_API_BASE) || "").trim();
  return { accountId, apiBaseUrl };
}

export function setConnectedSettings(next: ConnectedSettings) {
  localStorage.setItem(LS_ACCOUNT_ID, (next.accountId || "").trim());
  localStorage.setItem(LS_API_BASE, (next.apiBaseUrl || "").trim());
}
