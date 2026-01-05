import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ExternalLink } from 'lucide-react';

const PostItem = ({ 
  thumbnail, 
  creator, 
  caption, 
  badges = [], 
  categories = [],
  details = null,
  timestamp,
  engagement,
}) => {
  const [expanded, setExpanded] = useState(false);

  const getBadgeStyles = (badge) => {
    const lowerBadge = badge.toLowerCase();
    if (lowerBadge.includes('sponsored') || lowerBadge.includes('ad')) {
      return 'bg-amber-100 text-amber-800 border-amber-200';
    }
    if (lowerBadge.includes('political')) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    return 'bg-blue-50 text-blue-700 border-blue-100';
  };

  const handleToggle = () => {
    setExpanded(!expanded);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div 
        className="p-4 flex items-start gap-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-expanded={expanded}
        aria-label={expanded ? `Collapse details for post by ${creator || 'creator'}` : `Expand details for post by ${creator || 'creator'}`}
      >
        {/* Thumbnail */}
        {thumbnail ? (
          <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-slate-100">
            <img 
              src={thumbnail} 
              alt="" 
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        ) : (
          <div className="flex-shrink-0 w-16 h-16 rounded-lg bg-slate-100 flex items-center justify-center">
            <span className="text-2xl text-slate-400">📄</span>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Creator */}
          {creator && (
            <p className="text-sm font-semibold text-slate-800 mb-1">
              @{creator}
            </p>
          )}
          
          {/* Caption - only show if caption exists (null/empty captions are hidden for desktop scans) */}
          {caption && (
            <p className="text-sm text-slate-600 line-clamp-2 mb-2">
              {caption}
            </p>
          )}

          {/* Badges */}
          <div className="flex flex-wrap gap-1.5">
            {Array.isArray(badges) && badges.map((badge, index) => (
              <span 
                key={index}
                className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getBadgeStyles(badge)}`}
              >
                {badge}
              </span>
            ))}
            {Array.isArray(categories) && categories.slice(0, 3).map((category, index) => (
              <span 
                key={`cat-${index}`}
                className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200"
              >
                {category}
              </span>
            ))}
          </div>
        </div>

        {/* Expand indicator */}
        <div className="flex-shrink-0 p-1 text-slate-400" aria-hidden="true">
          {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && details && (
        <div className="px-4 pb-4 pt-2 border-t border-slate-100 bg-slate-50">
          <div className="grid grid-cols-2 gap-4 text-sm">
            {details.isAd !== undefined && (
              <div>
                <span className="text-slate-500">Type:</span>
                <span className="ml-2 font-medium text-slate-700">
                  {details.isAd ? 'Sponsored Content' : 'Organic Content'}
                </span>
              </div>
            )}
            {details.valence && (
              <div>
                <span className="text-slate-500">Tone:</span>
                <span className={`ml-2 font-medium ${
                  details.valence === 'POSITIVE' ? 'text-green-600' :
                  details.valence === 'NEGATIVE' ? 'text-red-600' : 'text-slate-600'
                }`}>
                  {details.valence}
                </span>
              </div>
            )}
            {Array.isArray(details.themes) && details.themes.length > 0 && (
              <div className="col-span-2">
                <span className="text-slate-500">Themes:</span>
                <span className="ml-2 font-medium text-slate-700">
                  {details.themes.join(', ')}
                </span>
              </div>
            )}
            {details.product && (
              <div className="col-span-2">
                <span className="text-slate-500">Product/Service:</span>
                <span className="ml-2 font-medium text-slate-700">
                  {details.product}
                </span>
              </div>
            )}
            {timestamp && (
              <div>
                <span className="text-slate-500">Captured:</span>
                <span className="ml-2 font-medium text-slate-700">
                  {timestamp}
                </span>
              </div>
            )}
            {engagement && (
              <div>
                <span className="text-slate-500">Engagement:</span>
                <span className="ml-2 font-medium text-slate-700">
                  {engagement}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostItem;

