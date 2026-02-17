import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

/**
 * BackLink - Consistent back navigation (#19)
 *
 * @param {string} to - Route to navigate to
 * @param {string} label - Text label (default: 'Back')
 */
const BackLink = ({ to, label = 'Back' }) => (
  <Link
    to={to}
    className="inline-flex items-center gap-1 text-sm font-medium text-text-muted hover:text-primary-blue transition-colors mb-6"
  >
    <ChevronLeft size={18} />
    {label}
  </Link>
);

export default BackLink;
