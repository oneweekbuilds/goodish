// TODO(legacy-scan-route): redirect-only file. Migrate callers (History empty-state CTA, Dashboard CTAs, Scanner "Scan Another Platform") to /scan during their respective redesign passes, then delete this file and remove the Tabs.Screen registration from (tabs)/_layout.tsx.

import { useEffect } from 'react';
import { router } from 'expo-router';

export default function LegacyScanRedirect() {
  useEffect(() => {
    router.replace('/scan');
  }, []);
  return null;
}
