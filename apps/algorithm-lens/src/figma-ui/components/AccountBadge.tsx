import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Settings, FileText, Trash2, LogOut } from 'lucide-react';

interface AccountBadgeProps {
  currentPlan: 'free' | 'premium';
  onManagePlan: () => void;
  onBillingHistory: () => void;
  onDeleteData: () => void;
  onLogOut: () => void;
}

export function AccountBadge({
  currentPlan,
  onManagePlan,
  onBillingHistory,
  onDeleteData,
  onLogOut,
}: AccountBadgeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const planColors: Record<string, { bg: string; text: string; border: string }> = {
    free: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
    premium: { bg: 'bg-gradient-to-r from-[#7D66E6]/10 to-[#4F9FA9]/10', text: 'text-foreground', border: 'border-[#7D66E6]/30' },
  };

  const planLabels: Record<string, string> = {
    free: 'Free',
    premium: 'Premium',
  };

  // Fallback for edge cases
  const safePlan = (planColors[currentPlan] ? currentPlan : 'free') as 'free' | 'premium';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const menuItems = [
    { icon: <Settings size={16} />, label: 'Manage Plan', onClick: onManagePlan },
    { icon: <FileText size={16} />, label: 'Billing History', onClick: onBillingHistory },
    { icon: <Trash2 size={16} />, label: 'Delete My Data', onClick: onDeleteData, danger: true },
    { icon: <LogOut size={16} />, label: 'Log Out', onClick: onLogOut },
  ];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all duration-300 ${
          planColors[safePlan].bg
        } ${planColors[safePlan].border} hover:shadow-md`}
      >
        <span className={`text-sm font-semibold ${planColors[safePlan].text}`}>
          {planLabels[safePlan]}
        </span>
        <ChevronDown 
          size={16} 
          className={`transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
          style={{ color: 'var(--foreground-secondary)' }}
        />
      </button>

      {isOpen && (
        <div
          className="absolute right-0 mt-2 w-56 rounded-2xl bg-white border border-gray-200 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200"
          style={{ boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)' }}
        >
          <div className="p-2">
            {menuItems.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                  item.danger
                    ? 'hover:bg-red-50 text-red-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <span style={{ color: item.danger ? '#ef4444' : 'var(--foreground-tertiary)' }}>
                  {item.icon}
                </span>
                <span className="text-sm font-medium" style={{ color: item.danger ? '#ef4444' : 'var(--foreground)' }}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

