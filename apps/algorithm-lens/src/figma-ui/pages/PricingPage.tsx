import { PricingPage as BasePricingPage } from '../../components/PricingPage'

interface PricingPageProps {
  currentPlan?: 'free' | 'premium';
  onPlanChange?: (plan: 'free' | 'premium') => void;
}

export default function PricingPage({ 
  currentPlan = 'free', 
  onPlanChange = () => {} 
}: PricingPageProps) {
  return (
    <div className="alg-fm">
      <BasePricingPage 
        currentPlan={currentPlan}
        onPlanChange={onPlanChange}
      />
    </div>
  )
}

