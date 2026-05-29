import { motion } from 'framer-motion';

export const SkeletonPulse = ({ className }) => (
  <div className={`animate-pulse bg-white/5 rounded-2xl ${className}`} />
);

export const SkeletonCard = () => (
  <div className="relative p-3 sm:p-5 rounded-2xl glass-panel overflow-hidden h-full flex flex-col border border-white/5">
    <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-center sm:items-start">
      <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-[12px] sm:rounded-2xl bg-white/10 animate-pulse" />
      <div className="flex-1 w-full space-y-2 py-1">
        <div className="h-4 bg-white/10 rounded-full w-3/4 animate-pulse" />
        <div className="h-3 bg-white/5 rounded-full w-1/2 animate-pulse" />
      </div>
    </div>
    <div className="mt-auto pt-5 flex justify-between items-center">
      <div className="flex gap-2">
        <div className="h-4 w-8 bg-white/10 rounded-full animate-pulse" />
        <div className="h-4 w-12 bg-white/5 rounded-full animate-pulse" />
      </div>
      <div className="h-8 w-16 bg-white/10 rounded-full animate-pulse" />
    </div>
  </div>
);

export const SkeletonDetail = () => (
  <div className="min-h-screen pt-24 pb-20">
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Hero Skeleton */}
      <div className="glass-panel p-8 md:p-12 rounded-[2rem] mb-12 flex flex-col md:flex-row gap-8 items-start md:items-center">
        <div className="w-32 h-32 md:w-48 md:h-48 rounded-[2rem] bg-white/10 animate-pulse flex-shrink-0" />
        <div className="flex-1 space-y-4 w-full">
          <div className="h-10 md:h-16 bg-white/10 rounded-xl w-3/4 animate-pulse" />
          <div className="h-6 bg-white/5 rounded-lg w-1/2 animate-pulse" />
          <div className="flex gap-4">
             <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />
             <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />
             <div className="h-6 w-20 bg-white/5 rounded-full animate-pulse" />
          </div>
          <div className="h-14 w-40 bg-white/10 rounded-xl animate-pulse mt-4" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="h-80 w-full glass-panel rounded-3xl animate-pulse" />
          <div className="h-40 w-full glass-panel rounded-3xl animate-pulse" />
        </div>
        <div className="h-64 w-full glass-panel rounded-3xl animate-pulse" />
      </div>
    </div>
  </div>
);
