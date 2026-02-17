import React from 'react';

/**
 * Shimmer animation for skeleton loading states.
 * Shows animated placeholder shapes while dashboard data loads.
 */
const shimmer = 'animate-pulse bg-slate-200 rounded';

const SkeletonHero = () => (
  <div className="border border-slate-200 rounded-xl p-6 space-y-3">
    <div className={`h-5 w-24 ${shimmer} rounded-full`} />
    <div className={`h-7 w-3/4 ${shimmer}`} />
    <div className={`h-4 w-full ${shimmer}`} />
    <div className={`h-4 w-2/3 ${shimmer}`} />
    <div className={`h-3 w-40 ${shimmer}`} />
  </div>
);

const SkeletonCard = () => (
  <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
    <div className={`h-4 w-2/3 ${shimmer}`} />
    <div className={`h-10 w-24 ${shimmer}`} />
    <div className={`h-3 w-1/2 ${shimmer}`} />
  </div>
);

const SkeletonBar = () => (
  <div className="space-y-3">
    <div className={`h-4 w-40 ${shimmer}`} />
    <div className={`h-12 w-full ${shimmer} rounded-xl`} />
    <div className="flex gap-4 justify-center">
      <div className={`h-3 w-20 ${shimmer}`} />
      <div className={`h-3 w-20 ${shimmer}`} />
      <div className={`h-3 w-20 ${shimmer}`} />
    </div>
  </div>
);

const DashboardSkeleton = () => (
  <div className="space-y-8">
    <SkeletonHero />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
    <SkeletonBar />
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <SkeletonCard />
      <SkeletonCard />
    </div>
  </div>
);

export { DashboardSkeleton, SkeletonHero, SkeletonCard, SkeletonBar };
export default DashboardSkeleton;
