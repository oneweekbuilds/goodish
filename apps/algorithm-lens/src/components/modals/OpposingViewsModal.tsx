import React from 'react';
import { Modal } from '../system/Modal';
import { ExternalLink } from 'lucide-react';

interface OpposingViewsModalProps {
  open: boolean;
  onClose: () => void;
}

export function OpposingViewsModal({ open, onClose }: OpposingViewsModalProps) {
  const recommendations = [
    {
      platform: 'X (Twitter)',
      accounts: [
        { handle: '@example1', description: 'Center-left policy analyst' },
        { handle: '@example2', description: 'Conservative economist' },
        { handle: '@example3', description: 'Independent journalist' }
      ]
    },
    {
      platform: 'Instagram',
      accounts: [
        { handle: '@example4', description: 'Progressive educator' },
        { handle: '@example5', description: 'Libertarian commentator' }
      ]
    }
  ];

  return (
    <Modal isOpen={open} onClose={onClose} title="Follow Opposite-View Creators">
      <div className="space-y-6">
        <p className="text-secondary leading-relaxed">
          Diversifying your feed with credible voices from different perspectives can help reduce echo
          chamber effects. Here are some suggested accounts:
        </p>

        {recommendations.map((group, idx) => (
          <div key={idx}>
            <h3 className="font-semibold text-primary mb-3">{group.platform}</h3>
            <div className="space-y-2">
              {group.accounts.map((account, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-neutral-50 border border-neutral-200"
                >
                  <div>
                    <div className="font-medium text-brand-primary">{account.handle}</div>
                    <div className="text-sm text-secondary">{account.description}</div>
                  </div>
                  <button
                    className="p-2 rounded-lg hover:bg-neutral-200 transition"
                    aria-label={`View ${account.handle}`}
                  >
                    <ExternalLink className="w-4 h-4 text-secondary" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}

        <div className="mt-6 p-4 rounded-lg bg-blue-50 border border-blue-200">
          <p className="text-sm text-blue-900">
            <strong>Tip:</strong> Start by following 2-3 accounts per platform. Engage thoughtfully with
            their content to signal interest to the algorithm.
          </p>
        </div>
      </div>
    </Modal>
  );
}
