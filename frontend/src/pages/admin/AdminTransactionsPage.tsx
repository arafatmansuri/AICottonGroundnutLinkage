import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { formatCurrency, formatDate } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { ArrowLeftRight, Search, CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_COLORS: Record<string, string> = {
  OFFER_CREATED: 'bg-gray-100 text-gray-600',
  OFFER_SENT: 'bg-blue-100 text-blue-700',
  ACCEPTED: 'bg-indigo-100 text-indigo-700',
  CONFIRMED: 'bg-violet-100 text-violet-700',
  IN_PROGRESS: 'bg-amber-100 text-amber-700',
  COMPLETED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
  CANCELLED: 'bg-red-100 text-red-600',
  EXPIRED: 'bg-gray-100 text-gray-500',
  DISPUTED: 'bg-orange-100 text-orange-700',
};

export default function AdminTransactionsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminTransactions', page, statusFilter],
    queryFn: () => adminApi.getTransactions({
      page, limit: 20,
      ...(statusFilter !== 'ALL' && { status: statusFilter }),
    }).then(r => r.data.data),
  });

  const resolveMutation = useMutation({
    mutationFn: ({ id, action }: { id: string; action: string }) =>
      adminApi.resolveDispute(id, action),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminTransactions'] });
      toast.success('Dispute resolved');
    },
    onError: () => toast.error('Action failed'),
  });

  const transactions = (data?.transactions || []).filter((tx: any) =>
    !search ||
    tx.farmerCrop?.crop?.name?.toLowerCase().includes(search.toLowerCase()) ||
    tx.farmerProfile?.name?.toLowerCase().includes(search.toLowerCase()) ||
    tx.buyerProfile?.companyName?.toLowerCase().includes(search.toLowerCase())
  );

  const statuses = ['ALL', 'OFFER_CREATED', 'OFFER_SENT', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED', 'DISPUTED'];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start sm:items-center gap-3 flex-wrap">
        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <ArrowLeftRight className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Transaction Management</h1>
          <p className="text-sm text-gray-500">{data?.total || 0} total transactions</p>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {[
          { label: 'Total', value: data?.total || 0, color: 'bg-gray-50 text-gray-700' },
          { label: 'Completed', value: data?.completedCount || 0, color: 'bg-green-50 text-green-700' },
          { label: 'In Progress', value: data?.activeCount || 0, color: 'bg-blue-50 text-blue-700' },
          { label: 'Disputed', value: data?.disputedCount || 0, color: 'bg-orange-50 text-orange-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className="input pl-9 w-full" placeholder="Search crop, farmer, buyer…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-48" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          {statuses.map(s => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <CardSkeleton key={i} lines={3} />)}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Crop', 'Farmer', 'Buyer', 'Qty (qtl)', 'Agreed Price', 'Transport', 'Net Realization', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-3 text-gray-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx: any) => (
                <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-3 font-medium text-gray-800">{tx.farmerCrop?.crop?.name}</td>
                  <td className="py-3 px-3 text-gray-600">{tx.farmerProfile?.name}</td>
                  <td className="py-3 px-3 text-gray-600">{tx.buyerProfile?.companyName}</td>
                  <td className="py-3 px-3 text-gray-700">{tx.quantity}</td>
                  <td className="py-3 px-3 text-gray-700">{formatCurrency(tx.agreedPrice)}</td>
                  <td className="py-3 px-3 text-gray-500">{formatCurrency(tx.transportCost || 0)}</td>
                  <td className="py-3 px-3 font-semibold text-green-700">{formatCurrency(tx.netRealization)}</td>
                  <td className="py-3 px-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[tx.status] || 'bg-gray-100 text-gray-600'}`}>
                      {tx.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-gray-400 text-xs">{formatDate(tx.createdAt)}</td>
                  <td className="py-3 px-3">
                    {tx.status === 'DISPUTED' && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => resolveMutation.mutate({ id: tx.id, action: 'COMPLETED' })}
                          className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded-lg flex items-center gap-1"
                        >
                          <CheckCircle className="w-3 h-3" /> Complete
                        </button>
                        <button
                          onClick={() => resolveMutation.mutate({ id: tx.id, action: 'CANCELLED' })}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg flex items-center gap-1"
                        >
                          <XCircle className="w-3 h-3" /> Cancel
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={10} className="py-8 text-center text-gray-400">No transactions found</td></tr>
              )}
            </tbody>
          </table>
          {data?.totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-500">Page {page} of {data.totalPages}</p>
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
