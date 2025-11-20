import { ReactNode } from 'react';
import { PaywallBanner } from './PaywallBanner';

interface FeatureGateProps {
  children: ReactNode;
  minPlan: 'premium';
  currentPlan: 'free' | 'premium';
  featureName: string;
  benefits: string[];
  onUpgrade: () => void;
  onLearnMore: () => void;
}

export function FeatureGate({
  children,
  minPlan,
  currentPlan,
  featureName,
  benefits,
  onUpgrade,
  onLearnMore,
}: FeatureGateProps) {
  const planHierarchy = { free: 0, premium: 1 };
  const hasAccess = planHierarchy[currentPlan] >= planHierarchy[minPlan];

  const pricing = {
    premium: '$9.99/mo',
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <PaywallBanner
      minPlan={minPlan}
      featureName={featureName}
      benefits={benefits}
      price={pricing[minPlan]}
      onUpgrade={onUpgrade}
      onLearnMore={onLearnMore}
    />
  );
}










