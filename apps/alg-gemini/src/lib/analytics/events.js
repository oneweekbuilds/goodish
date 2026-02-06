/**
 * Analytics event name constants
 * Internal funnel tracking for AlgorithmLens
 */

export const EVENTS = {
  // Scan flow
  SCAN_STARTED: 'scan_started',
  SCAN_COMPLETE: 'scan_complete',

  // Auth funnel
  RESULTS_GATE_SHOWN: 'results_gate_shown',
  EMAIL_SUBMITTED: 'email_submitted',
  MAGIC_LINK_SENT: 'magic_link_sent',
  LOGIN_SUCCESS: 'login_success',
  RESULTS_VIEWED: 'results_viewed',

  // Upgrade funnel
  UPGRADE_CTA_CLICKED: 'upgrade_cta_clicked',
  PAYWALL_VIEWED: 'paywall_viewed',

  // Future: Stripe events
};
