import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionApi } from '../../api';
import { formatCurrency, formatDate, getStatusColor } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { EmptyState, ErrorState } from '../../components/common/StateComponents';
import { ArrowLeftRight } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUSES = ['', 'OFFER_CREATED', 'OFFER_SENT', 'ACCEPTED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'REJECTED', 'CANCELLED'];

export default function TransactionsPage() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['transactions', statusFilter, page],
    queryFn: () => transactionApi.getAll({ status: statusFilter || undefined, page: page, limit: 20 }).then(r => r.data.data),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      transactionApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['transactions'] });
      qc.invalidateQueries({ queryKey: ['farmerCrops'] });
      qc.invalidateQueries({ queryKey: ['farmerIncome'] });
      toast.success('Transaction status updated');
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Update failed'),
  });

  if (isLoading) return <div className="space-y-3">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <span className="text-sm text-gray-500">{data?.total || 0} total</span>
      </div>

      <div className="flex gap-2 flex-wrap">
        {STATUSES.map(s => (
          <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
              statusFilter === s ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {data?.transactions?.length === 0 ? (
        <EmptyState title="No transactions found" description="Your transactions will appear here once you start selling." />
      ) : (
        <div className="space-y-4">
          {data?.transactions?.map((tx: any) => (
            <div key={tx.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                    <ArrowLeftRight className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{tx.farmerCrop?.crop?.name}</p>
                    <p className="text-sm text-gray-500">{tx.quantity} qtl @ {formatCurrency(tx.agreedPrice)}/qtl</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(tx.status)}`}>
                  {tx.status.replace(/_/g, ' ')}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Gross</p>
                  <p className="font-medium">{formatCurrency(tx.agreedPrice)}/qtl</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Transport</p>
                  <p className="font-medium text-red-500">-{formatCurrency(tx.transportCost)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Net</p>
                  <p className="font-semibold text-green-600">{formatCurrency(tx.netRealization)}/qtl</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="font-bold text-green-700">{formatCurrency(tx.netRealization * tx.quantity)}</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                <span>{formatDate(tx.createdAt)}</span>
                <div className="flex gap-2">
                  {tx.status === 'OFFER_CREATED' && (
                    <button onClick={() => statusMutation.mutate({ id: tx.id, status: 'CANCELLED' })}
                      className="text-red-500 hover:underline">Cancel</button>
                  )}
                  {tx.status === 'OFFER_SENT' && (
                    <button onClick={() => statusMutation.mutate({ id: tx.id, status: 'ACCEPTED' })}
                      className="text-green-600 font-medium hover:underline">Accept</button>
                  )}
                  {tx.status === 'CONFIRMED' && (
                    <button onClick={() => statusMutation.mutate({ id: tx.id, status: 'IN_PROGRESS' })}
                      className="text-blue-600 hover:underline">Mark In Progress</button>
                  )}
                  {tx.status === 'IN_PROGRESS' && (
                    <button onClick={() => statusMutation.mutate({ id: tx.id, status: 'COMPLETED' })}
                      className="text-green-600 font-medium hover:underline">Complete</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {data?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page === 1} onClick={() => setPage((p: number) => p - 1)}
            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-500">Page {page} of {data.totalPages}</span>
          <button disabled={page === data.totalPages} onClick={() => setPage((p: number) => p + 1)}
            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
        </div>
      )}
    </div>
  );
}
