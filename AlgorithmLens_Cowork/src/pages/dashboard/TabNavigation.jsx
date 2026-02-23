import React from 'react';
import { TABS } from './dashboardCatalog';

/**
 * TabNavigation - Tab switcher with keyboard navigation support
 *
 * Displays tab buttons with active state styling and keyboard shortcuts
 * (arrow keys, Home, End for accessibility).
 */
const TabNavigation = ({
  activeTab,
  setActiveTab,
  handleTabKeyDown,
  tabContainerRef,
  isOnAlgorithmTab,
}) => {
  return (
    <div className={`${isOnAlgorithmTab ? 'mb-6' : 'mb-10'} overflow-hidden`}>
      <nav
        className="relative flex gap-1.5 overflow-x-auto p-1.5 scrollbar-hide rounded-2xl"
        aria-label="Dashboard tabs"
        role="tablist"
        ref={tabContainerRef}
        style={{
          scrollBehavior: 'smooth',
          WebkitOverflowScrolling: 'touch',
          background: 'linear-gradient(180deg, rgba(241, 245, 249, 0.8) 0%, rgba(248, 250, 252, 0.9) 100%)',
          border: '1px solid rgba(226, 232, 240, 0.6)',
          boxShadow: 'inset 0 1px 2px rgba(0, 0, 0, 0.03)',
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              data-tab-active={isActive}
              onClick={() => setActiveTab(tab.id)}
              onKeyDown={handleTabKeyDown}
              className="flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2.5 text-[11px] sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-blue/40 focus-visible:ring-offset-1 rounded-xl min-h-[40px]"
              style={{
                color: isActive ? '#FFFFFF' : '#64748B',
                background: isActive
                  ? `linear-gradient(135deg, ${tab.accent || '#2563EB'} 0%, ${tab.accent || '#2563EB'}DD 100%)`
                  : 'transparent',
                boxShadow: isActive
                  ? `0 2px 8px ${tab.accent || '#2563EB'}30, 0 1px 3px rgba(0,0,0,0.06)`
                  : 'none',
                letterSpacing: '-0.01em',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                  e.currentTarget.style.color = '#1E293B';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748B';
                }
              }}
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              title={tab.label}
            >
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

export default TabNavigation;
