import { cn } from '../../utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizes = { sm: 'w-4 h-4', md: 'w-8 h-8', lg: 'w-12 h-12' };
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn('border-4 border-gray-200 border-t-green-600 rounded-full animate-spin', sizes[size])} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="text-center">
        <LoadingSpinner size="lg" className="mb-4" />
        <p className="text-gray-500">Loading KisanMitra AI...</p>
      </div>
    </div>
  );
}

export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-3 bg-gray-200 rounded mb-2" style={{ width: `${60 + i * 10}%` }} />
      ))}
    </div>
  );
}

export function AIRecommendationSkeleton() {
  return (
    <div className="card border-2 border-green-100 animate-pulse">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-5 h-5 bg-gray-200 rounded-full" />
        <div className="h-4 bg-gray-200 rounded w-36" />
        <div className="ml-auto h-5 bg-gray-200 rounded-full w-28" />
      </div>

      {/* Decision badge */}
      <div className="h-9 bg-gray-200 rounded-xl w-40 mb-4" />

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i}>
            <div className="h-3 bg-gray-200 rounded w-16 mb-1.5" />
            <div className="h-6 bg-gray-200 rounded w-20" />
          </div>
        ))}
      </div>

      {/* Reasoning bullets */}
      <div className="space-y-2 mb-4">
        {[80, 65, 72].map(w => (
          <div key={w} className="flex items-start gap-2">
            <div className="w-2 h-2 bg-gray-200 rounded-full mt-1.5 flex-shrink-0" />
            <div className="h-3 bg-gray-200 rounded flex-1" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>

      {/* Value comparison bar */}
      <div className="flex justify-between bg-gray-50 rounded-xl p-3">
        <div>
          <div className="h-3 bg-gray-200 rounded w-24 mb-1.5" />
          <div className="h-5 bg-gray-200 rounded w-20" />
        </div>
        <div className="text-right">
          <div className="h-3 bg-gray-200 rounded w-28 mb-1.5 ml-auto" />
          <div className="h-5 bg-gray-200 rounded w-24 ml-auto" />
        </div>
      </div>

      {/* Disclaimer bar */}
      <div className="mt-4 h-10 bg-amber-50 rounded-xl" />
    </div>
  );
}
