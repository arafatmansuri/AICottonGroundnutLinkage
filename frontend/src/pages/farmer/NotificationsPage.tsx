import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../api';
import { formatDateTime } from '../../utils';
import { Bell, CheckCheck, BellOff } from 'lucide-react';
import { EmptyState } from '../../components/common/StateComponents';
import { useLanguage } from '../../hooks/useLanguage';
import toast from 'react-hot-toast';

const typeColors: Record<string, string> = {
  PRICE_ALERT: 'bg-green-100 text-green-700',
  BUYER_MATCH: 'bg-blue-100 text-blue-700',
  MARKET_ALERT: 'bg-amber-100 text-amber-700',
  TRANSACTION_UPDATE: 'bg-purple-100 text-purple-700',
  AI_RECOMMENDATION: 'bg-indigo-100 text-indigo-700',
  SYSTEM: 'bg-gray-100 text-gray-700',
};

export default function NotificationsPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll().then(r => r.data.data),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      toast.success(t('all_marked_read'));
    },
  });

  const unreadCount = notifications?.filter((n: any) => !n.isRead).length || 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{t('notifications_title')}</h1>
          {unreadCount > 0 && (
            <span className="w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={() => markAllMutation.mutate()} className="btn-secondary text-sm flex items-center gap-2">
            <CheckCheck className="w-4 h-4" /> {t('mark_all_read')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="card h-16 skeleton" />)}</div>
      ) : notifications?.length === 0 ? (
        <EmptyState
          title={t('no_notifications')}
          description={t('no_notifications_desc')}
          action={<BellOff className="w-8 h-8 text-gray-300 mx-auto" />}
        />
      ) : (
        <div className="space-y-2">
          {notifications?.map((n: any) => (
            <div
              key={n.id}
              className={`card cursor-pointer transition-all hover:shadow-md ${!n.isRead ? 'border-green-200 bg-green-50/30' : ''}`}
              onClick={() => !n.isRead && markReadMutation.mutate(n.id)}
            >
              <div className="flex items-start gap-3">
                <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full ${typeColors[n.type] || 'bg-gray-100 text-gray-600'}`}>
                  <Bell className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-medium text-gray-900 text-sm">{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />}
                  </div>
                  <p className="text-sm text-gray-600">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${typeColors[n.type] || 'bg-gray-100 text-gray-600'}`}>
                  {n.type.replace('_', ' ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
