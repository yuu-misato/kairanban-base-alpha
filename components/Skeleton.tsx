
import React from 'react';

interface SkeletonProps {
    className?: string;
    count?: number;
}

const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1 }) => {
    return (
        <>
            {Array.from({ length: count }).map((_, index) => (
                <div
                    key={index}
                    className={`bg-slate-200 animate-pulse rounded ${className}`}
                />
            ))}
        </>
    );
};

export const PostSkeleton: React.FC = () => {
    return (
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden mb-6 p-6">
            <div className="flex items-center gap-3 mb-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="space-y-2">
                    <Skeleton className="w-24 h-3" />
                    <Skeleton className="w-32 h-2" />
                </div>
            </div>
            <Skeleton className="w-3/4 h-6 mb-3" />
            <Skeleton className="w-full h-20 mb-4" />
            <div className="flex gap-4">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-8 h-8 rounded-full" />
            </div>
        </div>
    )
}

export default Skeleton;
