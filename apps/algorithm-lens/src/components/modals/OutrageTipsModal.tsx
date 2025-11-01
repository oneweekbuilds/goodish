import React from 'react';
import { Modal } from '../system/Modal';
import { Lightbulb } from 'lucide-react';

interface OutrageTipsModalProps {
  open: boolean;
  onClose: () => void;
}

export function OutrageTipsModal({ open, onClose }: OutrageTipsModalProps) {
  const tips = [
    {
      title: 'Mute inflammatory keywords',
      description: 'Use platform tools to filter words and phrases that trigger outrage content.'
    },
    {
      title: 'Engage less with outrage posts',
      description: 'Avoid liking, sharing, or commenting on highly emotional content.'
    },
    {
      title: 'Seek out analytical sources',
      description: 'Follow accounts known for measured, fact-based analysis.'
    },
    {
      title: 'Set time limits',
      description: 'Reduce overall exposure by limiting daily time on each platform.'
    },
    {
      title: 'Curate your feed proactively',
      description: 'Regularly review and unfollow accounts that consistently post inflammatory content.'
    }
  ];

  return (
    <Modal isOpen={open} onClose={onClose} title="Reduce Outrage Content">
      <div className="space-y-6">
        <p className="text-secondary leading-relaxed">
          High levels of outrage content can increase stress and reduce critical thinking. Here are
          practical steps to reduce it:
        </p>

        <div className="space-y-4">
          {tips.map((tip, idx) => (
            <div key={idx} className="flex items-start gap-3 p-4 rounded-lg bg-neutral-50 border border-neutral-200">
              <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-primary mb-1">{tip.title}</h4>
                <p className="text-sm text-secondary">{tip.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-900">
            <strong>Research shows:</strong> Reducing outrage content exposure can improve mood and
            increase openness to different perspectives within 1-2 weeks.
          </p>
        </div>
      </div>
    </Modal>
  );
}
