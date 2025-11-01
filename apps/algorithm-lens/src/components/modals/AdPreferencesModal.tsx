import React from 'react';
import { Modal } from '../system/Modal';
import { CheckCircle } from 'lucide-react';

interface AdPreferencesModalProps {
  open: boolean;
  onClose: () => void;
}

export function AdPreferencesModal({ open, onClose }: AdPreferencesModalProps) {
  const steps = [
    {
      platform: 'X (Twitter)',
      instructions: [
        'Go to Settings → Privacy and Safety',
        'Click on "Ads preferences"',
        'Review and adjust your interests',
        'Turn off personalized ads if desired'
      ]
    },
    {
      platform: 'Instagram',
      instructions: [
        'Go to Settings → Ads',
        'Tap "Ad Topics"',
        'Select topics you want to see less of',
        'Save changes'
      ]
    },
    {
      platform: 'Facebook',
      instructions: [
        'Go to Settings → Ads',
        'Click "Ad Preferences"',
        'Review advertisers and topics',
        'Hide ads from specific advertisers'
      ]
    }
  ];

  return (
    <Modal isOpen={open} onClose={onClose} title="Adjust Ad Preferences">
      <div className="space-y-6">
        <p className="text-secondary leading-relaxed">
          Follow these platform-specific steps to customize what kinds of ads you see:
        </p>

        {steps.map((platform, idx) => (
          <div key={idx}>
            <h3 className="font-semibold text-primary mb-3">{platform.platform}</h3>
            <ul className="space-y-2">
              {platform.instructions.map((instruction, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-secondary">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                  <span>{instruction}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}

        <div className="mt-6 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <p className="text-sm text-amber-900">
            <strong>Note:</strong> Changes may take 24-48 hours to fully take effect across platforms.
          </p>
        </div>
      </div>
    </Modal>
  );
}
