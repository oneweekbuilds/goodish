import React from 'react';

/**
 * PageFooter - Dashboard footer disclaimer
 */
const PageFooter = () => {
  return (
    <div className="text-center py-4 mt-6">
      <p
        className="text-[11px] italic"
        style={{ color: 'rgba(148, 163, 184, 0.7)' }}
      >
        These insights show patterns in what you're shown, not who you are.
      </p>
    </div>
  );
};

export default PageFooter;
