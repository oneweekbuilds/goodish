import { DashboardPage as BaseDashboardPage } from '../../components/DashboardPage'

interface DashboardPageProps {
  onNavigate?: (page: string, params?: any) => void;
  currentPlan?: 'free' | 'premium';
  onUpgrade?: () => void;
}

export default function DashboardPage({ 
  onNavigate = () => {}, 
  currentPlan = 'free', 
  onUpgrade = () => {} 
}: DashboardPageProps) {
  return (
    <div className="alg-fm">
      <BaseDashboardPage 
        onNavigate={onNavigate}
        currentPlan={currentPlan}
        onUpgrade={onUpgrade}
      />
    </div>
  )
}









