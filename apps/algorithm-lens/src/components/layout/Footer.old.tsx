import React from 'react';

interface FooterProps {
  onNavigate?: (route: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="bg-bg py-16 border-t border-stroke">
      <div className="max-w-[1200px] mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {/* Product Column */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-ink">Product</h4>
            <ul className="space-y-3 text-sm text-ink-3">
              <li>
                <button
                  onClick={() => onNavigate?.('dashboard')}
                  className="hover:text-accent transition-colors"
                >
                  Dashboard
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('samples')}
                  className="hover:text-accent transition-colors"
                >
                  Try Sample Data
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('import')}
                  className="hover:text-accent transition-colors"
                >
                  Connect Accounts
                </button>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-ink">Resources</h4>
            <ul className="space-y-3 text-sm text-ink-3">
              <li>
                <button
                  onClick={() => onNavigate?.('about')}
                  className="hover:text-accent transition-colors"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate?.('privacy')}
                  className="hover:text-accent transition-colors"
                >
                  Privacy
                </button>
              </li>
            </ul>
          </div>

          {/* About Column */}
          <div>
            <h4 className="text-sm font-semibold mb-4 text-ink">About</h4>
            <p className="text-sm text-ink-3 leading-relaxed mb-2">
              Understanding algorithms for human clarity. Built with privacy-first principles.
            </p>
            <p className="text-xs text-ink-3">
              Research-backed algorithmic transparency
            </p>
          </div>
        </div>

        {/* Legal Line */}
        <div className="border-t border-stroke mt-12 pt-8 text-center text-ink-3">
          <p className="text-sm">&copy; 2025 AlgorithmLens. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
