import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../../api';
import { formatCurrency, formatDate } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/StateComponents';
import { ArrowLeftRight, CheckCircle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_BADGE: Record<string, string> = {
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

// What the buyer can do at each status
const BUYER_ACTIONS: Record<string, { label: string; status: string; style: string }[]> = {
  OFFER_SENT: [
    { label: 'Accept Offer', status: 'ACCEPTED', style: 'bg-green-600 text-white hover:bg-green-700' },
    { label: 'Reject', status: 'REJECTED', style: 'bg-red-50 text-red-600 hover:bg-red-100' },
  ],
  ACCEPTED: [
    { label: 'Confirm Purchase', status: 'CONFIRMED', style: 'bg-indigo-600 text-white hover:bg-indigo-700' },
    { label: 'Cancel', status: 'CANCELLED', style: 'bg-gray-100 text-gray-600 hover:bg-gray-200' },
  ],
  CONFIRMED: [
    { label: 'Mark In Progress', status: 'IN_PROGRESS', style: 'bg-amber-600 text-white hover:bg-amber-700' },
  ],
  IN_PROGRESS: [
    { label: 'Mark Completed', status: 'COMPLETED', style: 'bg-green-600 text-white hover:bg-green-700' },
    { label: 'Raise Dispute', status: 'DISPUTED', style: 'bg-orange-50 text-orange-700 hover:bg-orange-100' },
  ],
};

export default function BuyerTransactionsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['buyerTransactions', statusFilter, page],
    queryFn: () => transactionApi.getAll({
      page, limit: 15,
      ...(statusFilter !== 'ALL' && { status: statusFilter }),
    }).then(r => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      transactionApi.updateStatus(id, status),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['buyerTransactions'] });
      toast.success(`Transaction ${vars.status.replace(/_/g, ' ').toLowerCase()}`);
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Action failed'),
  });

  const statuses = ['ALL', 'OFFER_SENT', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-100 rounded-xl flex items-center justify-center">
          <ArrowLeftRight className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Purchase Transactions</h1>
          <p className="text-sm text-gray-500">Manage your incoming offers and active purchases</p>
        </div>
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {statuses.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              statusFilter === s ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s === 'ALL' ? 'All' : s.replace(/_/g, ' ')}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <CardSkeleton key={i} lines={3} />)}</div>
      ) : (data?.transactions?.length === 0) ? (
        <EmptyState
          title="No transactions found"
          description="Incoming purchase offers from farmers will appear here."
        />
      ) : (
        <div className="space-y-3">
          {data?.transactions?.map((tx: any) => {
            const actions = BUYER_ACTIONS[tx.status] || [];
            const isExpanded = expandedId === tx.id;

            return (
              <div key={tx.id} className="card hover:shadow-md transition-shadow">
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <span className="text-green-700 font-bold text-sm">
                        {tx.farmerCrop?.crop?.name?.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{tx.farmerCrop?.crop?.name}</h3>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[tx.status] || 'bg-gray-100 text-gray-600'}`}>
                          {tx.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        Farmer: <span className="font-medium text-gray-700">{tx.farmerProfile?.name}</span>
                        {' · '}{tx.farmerProfile?.district}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-700">{formatCurrency(tx.netRealization)}<span className="text-xs font-normal text-gray-400">/qtl</span></p>
                    <p className="text-xs text-gray-400">{tx.quantity} qtl</p>
                  </div>
                </div>

                {/* Price breakdown */}
                <div className="mt-3 grid grid-cols-3 gap-3 text-center">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <p className="text-xs text-gray-400">Agreed Price</p>
                    <p className="text-sm font-semibold text-gray-700">{formatCurrency(tx.agreedPrice)}</p>
                  </div>
                  <div className="bg-red-50 rounded-lg p-2">
                    <p className="text-xs text-gray-400">Transport</p>
                    <p className="text-sm font-semibold text-red-600">−{formatCurrency(tx.transportCost || 0)}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <p className="text-xs text-gray-400">Net Realization</p>
                    <p className="text-sm font-bold text-green-700">{formatCurrency(tx.netRealization)}</p>
                  </div>
                </div>

                {/* Footer */}
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{formatDate(tx.createdAt)}</span>
                    {tx.statusHistory?.length > 0 && (
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : tx.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        History {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </button>
                    )}
                  </div>
                  {actions.length > 0 && (
                    <div className="flex gap-2">
                      {actions.map(action => (
                        <button
                          key={action.status}
                          disabled={statusMutation.isPending}
                          onClick={() => statusMutation.mutate({ id: tx.id, status: action.status })}
                          className={`text-sm px-4 py-1.5 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-1.5 ${action.style}`}
                        >
                          {action.status === 'COMPLETED' && <CheckCircle className="w-4 h-4" />}
                          {(action.status === 'REJECTED' || action.status === 'CANCELLED') && <XCircle className="w-4 h-4" />}
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Status history timeline */}
                {isExpanded && tx.statusHistory && (
                  <div className="mt-3 pt-3 border-t border-gray-50">
                    <p className="text-xs font-medium text-gray-500 mb-2">Status History</p>
                    <div className="space-y-1.5">
                      {(tx.statusHistory as any[]).map((h: any, i: number) => (
                        <div key={i} className="flex items-center gap-3 text-xs">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                          <span className={`px-2 py-0.5 rounded-full font-medium ${STATUS_BADGE[h.status] || 'bg-gray-100 text-gray-600'}`}>
                            {h.status.replace(/_/g, ' ')}
                          </span>
                          <span className="text-gray-400">{new Date(h.timestamp).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Pagination */}
          {data?.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
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
