
import React from 'react';

interface SkeletonProps {
  className?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-white/5 rounded-lg ${className}`}></div>
  );
};

export const DashboardSkeleton = () => (
    <div className="space-y-8 w-full max-w-7xl mx-auto py-8">
        <div className="w-full h-40 bg-white/5 rounded-xl animate-pulse"></div>
        <div className="w-full h-96 bg-white/5 rounded-[2.5rem] animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="h-64 bg-white/5 rounded-[2rem] animate-pulse"></div>
            <div className="h-64 bg-white/5 rounded-[2rem] animate-pulse"></div>
            <div className="h-64 bg-white/5 rounded-[2rem] animate-pulse"></div>
            <div className="h-64 bg-white/5 rounded-[2rem] animate-pulse"></div>
        </div>
    </div>
);
