import React from 'react';
import { AlertTriangle, RefreshCw, Inbox } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <AlertTriangle className="w-7 h-7 text-red-500" />
      </div>
      <p className="text-gray-600 mb-4 max-w-xs">{message || t('something_wrong')}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> {t('retry')}
        </button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center mb-4">
        <Inbox className="w-7 h-7 text-green-400" />
      </div>
      <h3 className="font-semibold text-gray-700 mb-1">{title || t('no_data_yet')}</h3>
      {description && <p className="text-gray-500 text-sm mb-4 max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
