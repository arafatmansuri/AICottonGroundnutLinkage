import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../../api';
import { formatDateTime, getRelativeTime } from '../../utils';
import {
  Bell, CheckCheck, BellOff, TrendingUp, Users, AlertTriangle,
  RefreshCw, DollarSign, Bot, Settings, Wheat, Phone, Mail,
  BadgeCheck, Building2,
} from 'lucide-react';
import { EmptyState } from '../../components/common/StateComponents';
import { useLanguage } from '../../hooks/useLanguage';
import toast from 'react-hot-toast';

// ── Type metadata ─────────────────────────────────────────────────────────────

const TYPE_META: Record<string, {
  label: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
}> = {
  PRICE_ALERT:        { label: 'Price Alert',        icon: TrendingUp,    colorClass: 'text-green-700',  bgClass: 'bg-green-100'  },
  BUYER_MATCH:        { label: 'Buyer Match',         icon: Users,         colorClass: 'text-blue-700',   bgClass: 'bg-blue-100'   },
  MARKET_ALERT:       { label: 'Market Alert',        icon: AlertTriangle, colorClass: 'text-amber-700',  bgClass: 'bg-amber-100'  },
  TRANSACTION_UPDATE: { label: 'Transaction Update',  icon: RefreshCw,     colorClass: 'text-purple-700', bgClass: 'bg-purple-100' },
  PAYMENT_RECEIVED:   { label: 'Payment',             icon: DollarSign,    colorClass: 'text-teal-700',   bgClass: 'bg-teal-100'   },
  AI_RECOMMENDATION:  { label: 'AI Insight',          icon: Bot,           colorClass: 'text-indigo-700', bgClass: 'bg-indigo-100' },
  SYSTEM:             { label: 'System',              icon: Settings,      colorClass: 'text-gray-700',   bgClass: 'bg-gray-100'   },
  CROP_INTEREST:      { label: 'Buyer Interest',      icon: Wheat,         colorClass: 'text-green-700',  bgClass: 'bg-green-100'  },
};

const DEFAULT_META = { label: 'Notification', icon: Bell, colorClass: 'text-gray-700', bgClass: 'bg-gray-100' };

// ── CROP_INTEREST card ────────────────────────────────────────────────────────

function CropInterestCard({ n, onMarkRead }: { n: any; onMarkRead: (id: string) => void }) {
  const data = n.data as Record<string, any> | null;

  return (
    <div
      className={`rounded-2xl border p-5 transition-all ${
        !n.isRead
          ? 'border-green-200 bg-green-50/40 hover:shadow-sm'
          : 'border-gray-100 bg-white hover:shadow-sm'
      }`}
      onClick={() => !n.isRead && onMarkRead(n.id)}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
          <Wheat className="w-4 h-4 text-green-600" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900 text-sm">{n.title}</p>
            {!n.isRead && <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />}
            <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{getRelativeTime(n.createdAt)}</span>
          </div>

          <p className="text-sm text-gray-600 mb-3">{n.message}</p>

          {/* Buyer contact block rendered from notification.data */}
          {data && (data.companyName || data.contactName) && (
            <div className="bg-white rounded-xl border border-green-200 p-3 space-y-2">
              <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Interested Buyer</p>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-blue-700 font-bold text-xs">
                    {String(data.contactName ?? data.companyName ?? '?').charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{data.contactName}</p>
                  {data.companyName && (
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {data.companyName}
                    </p>
                  )}
                </div>
                {data.verificationStatus === 'VERIFIED' && (
                  <BadgeCheck className="w-4 h-4 text-green-500 ml-auto flex-shrink-0" title="Verified buyer" />
                )}
              </div>
              {data.email && (
                <a href={`mailto:${data.email}`}
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-700 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <Mail className="w-3.5 h-3.5 text-gray-400" />
                  {data.email}
                </a>
              )}
              {data.phone && (
                <a href={`tel:${data.phone}`}
                  className="flex items-center gap-2 text-xs text-gray-600 hover:text-blue-700 transition-colors"
                  onClick={e => e.stopPropagation()}
                >
                  <Phone className="w-3.5 h-3.5 text-gray-400" />
                  {data.phone}
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Generic notification card ─────────────────────────────────────────────────

function GenericCard({ n, onMarkRead }: { n: any; onMarkRead: (id: string) => void }) {
  const meta = TYPE_META[n.type] ?? DEFAULT_META;
  const Icon = meta.icon;

  return (
    <div
      className={`rounded-2xl border p-4 transition-all cursor-pointer ${
        !n.isRead
          ? 'border-green-200 bg-green-50/30 hover:shadow-sm'
          : 'border-gray-100 bg-white hover:shadow-sm'
      }`}
      onClick={() => !n.isRead && onMarkRead(n.id)}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${meta.bgClass}`}>
          <Icon className={`w-4 h-4 ${meta.colorClass}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-medium text-gray-900 text-sm">{n.title}</p>
            {!n.isRead && <span className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0" />}
            <span className="ml-auto text-xs text-gray-400 flex-shrink-0">{getRelativeTime(n.createdAt)}</span>
          </div>
          <p className="text-sm text-gray-600">{n.message}</p>
          <p className="text-xs text-gray-400 mt-1">{formatDateTime(n.createdAt)}</p>
        </div>
        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${meta.bgClass} ${meta.colorClass}`}>
          {meta.label}
        </span>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

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

  const notifs: any[] = (notifications as any[]) ?? [];
  const unreadCount = notifs.filter(n => !n.isRead).length;

  // Group: buyer interest first, then rest newest-first
  const interestNotifs = notifs.filter(n => n.type === 'CROP_INTEREST');
  const otherNotifs    = notifs.filter(n => n.type !== 'CROP_INTEREST');

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900">{t('notifications_title')}</h1>
          {unreadCount > 0 && (
            <span className="min-w-[24px] h-6 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="btn-secondary text-sm flex items-center gap-2 disabled:opacity-50"
          >
            <CheckCheck className="w-4 h-4" /> {t('mark_all_read')}
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="rounded-2xl border border-gray-100 h-20 animate-pulse bg-gray-50" />
          ))}
        </div>
      ) : notifs.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{t('no_notifications')}</p>
          <p className="text-gray-400 text-sm mt-1 max-w-xs mx-auto">{t('no_notifications_desc')}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Buyer interest notifications */}
          {interestNotifs.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Wheat className="w-4 h-4 text-green-600" />
                <h2 className="text-sm font-semibold text-gray-700">
                  Buyer Interest Notifications
                  {interestNotifs.filter(n => !n.isRead).length > 0 && (
                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
                      {interestNotifs.filter(n => !n.isRead).length} new
                    </span>
                  )}
                </h2>
              </div>
              <div className="space-y-3">
                {interestNotifs.map(n => (
                  <CropInterestCard
                    key={n.id}
                    n={n}
                    onMarkRead={id => markReadMutation.mutate(id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other notifications */}
          {otherNotifs.length > 0 && (
            <div>
              {interestNotifs.length > 0 && (
                <div className="flex items-center gap-2 mb-3 mt-2">
                  <Bell className="w-4 h-4 text-gray-400" />
                  <h2 className="text-sm font-semibold text-gray-700">Other Notifications</h2>
                </div>
              )}
              <div className="space-y-2">
                {otherNotifs.map(n => (
                  <GenericCard
                    key={n.id}
                    n={n}
                    onMarkRead={id => markReadMutation.mutate(id)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
