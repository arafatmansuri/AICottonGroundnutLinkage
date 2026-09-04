import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { Shield, Search, Filter } from 'lucide-react';

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700',
  UPDATE: 'bg-blue-100 text-blue-700',
  DELETE: 'bg-red-100 text-red-700',
  LOGIN: 'bg-gray-100 text-gray-600',
  VERIFY: 'bg-teal-100 text-teal-700',
  SUSPEND: 'bg-orange-100 text-orange-700',
  STATUS_CHANGE: 'bg-indigo-100 text-indigo-700',
  REJECT: 'bg-red-100 text-red-600',
};

export default function AdminAuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const { data, isLoading } = useQuery({
    queryKey: ['adminAuditLogs', page, actionFilter, entityFilter],
    queryFn: () => adminApi.getAuditLogs({
      page, limit: 25,
      ...(actionFilter !== 'ALL' && { action: actionFilter }),
      ...(entityFilter !== 'ALL' && { entityType: entityFilter }),
    }).then(r => r.data.data),
    refetchInterval: 15_000,
  });

  const logs = (data?.logs || []).filter((l: any) =>
    !search ||
    l.user?.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.entityType?.toLowerCase().includes(search.toLowerCase()) ||
    l.action?.toLowerCase().includes(search.toLowerCase())
  );

  const actions = ['ALL', 'CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'VERIFY', 'SUSPEND', 'STATUS_CHANGE'];
  const entities = ['ALL', 'USER', 'FARMER_PROFILE', 'BUYER_PROFILE', 'FARMER_CROP', 'BUYER_OFFER', 'TRANSACTION', 'MARKET_PRICE'];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
          <Shield className="w-5 h-5 text-slate-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-500">{data?.total || 0} log entries — auto-refreshes every 15s</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className="input pl-9 w-full" placeholder="Search user, entity, action…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <select className="input flex-1 min-w-[120px]" value={actionFilter} onChange={e => setActionFilter(e.target.value)}>
            {actions.map(a => <option key={a} value={a}>{a === 'ALL' ? 'All Actions' : a}</option>)}
          </select>
          <select className="input flex-1 min-w-[140px]" value={entityFilter} onChange={e => setEntityFilter(e.target.value)}>
            {entities.map(e => <option key={e} value={e}>{e === 'ALL' ? 'All Entities' : e.replace(/_/g, ' ')}</option>)}
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <CardSkeleton key={i} lines={1} />)}</div>
      ) : (
        <div className="card overflow-x-auto -mx-0">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Timestamp', 'User', 'Action', 'Entity Type', 'Entity ID', 'Details', 'IP'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any) => (
                <tr key={log.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap font-mono">
                    {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-4">
                    <p className="font-medium text-gray-700 text-xs">{log.user?.email || 'System'}</p>
                    <p className="text-gray-400 text-xs font-mono">{log.userId?.slice(0, 8) || '—'}</p>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.action] || 'bg-gray-100 text-gray-600'}`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-600 text-xs">{log.entityType?.replace(/_/g, ' ')}</td>
                  <td className="py-3 px-4 text-gray-400 text-xs font-mono">{log.entityId?.slice(0, 8)}…</td>
                  <td className="py-3 px-4 text-gray-500 text-xs max-w-[200px] truncate">
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs font-mono">{log.ipAddress || '—'}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No audit logs found</td></tr>
              )}
            </tbody>
          </table>

          {data?.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-500">Page {page} of {data.totalPages} · {data.total} entries</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs disabled:opacity-40">Previous</button>
                <button disabled={page >= data.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
