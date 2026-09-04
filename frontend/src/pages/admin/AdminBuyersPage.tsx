import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { formatCurrency, formatDate } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { Briefcase, Search, ShieldCheck, ShieldX, Eye } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminBuyersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['adminBuyers', page, statusFilter],
    queryFn: () => adminApi.getBuyers({
      page, limit: 20,
      ...(statusFilter !== 'ALL' && { verificationStatus: statusFilter }),
    }).then(r => r.data.data),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: string; notes?: string }) =>
      adminApi.verifyBuyer(id, status, notes),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['adminBuyers'] });
      qc.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success(`Buyer ${vars.status.toLowerCase()}`);
      setSelected(null);
    },
    onError: () => toast.error('Action failed'),
  });

  const buyers = (data?.data || []).filter((b: any) =>
    !search ||
    b.companyName?.toLowerCase().includes(search.toLowerCase()) ||
    b.contactName?.toLowerCase().includes(search.toLowerCase()) ||
    b.district?.toLowerCase().includes(search.toLowerCase())
  );

  const statusBadge = (s: string) => {
    if (s === 'VERIFIED') return 'bg-green-100 text-green-700';
    if (s === 'REJECTED') return 'bg-red-100 text-red-700';
    return 'bg-amber-100 text-amber-700';
  };

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Buyer Management</h1>
          <p className="text-sm text-gray-500">{data?.total || 0} registered buyers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input className="input pl-9 w-full" placeholder="Search company, contact, district…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input sm:w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="ALL">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="VERIFIED">Verified</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          { label: 'Total Buyers', value: data?.total || 0, color: 'bg-blue-50 text-blue-700' },
          { label: 'Verified', value: (data?.data || []).filter((b: any) => b.verificationStatus === 'VERIFIED').length, color: 'bg-green-50 text-green-700' },
          { label: 'Pending Review', value: (data?.data || []).filter((b: any) => b.verificationStatus === 'PENDING').length, color: 'bg-amber-50 text-amber-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <CardSkeleton key={i} lines={2} />)}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Company', 'Contact', 'District', 'Crop Interest', 'Offer Price', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {buyers.map((b: any) => (
                <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-blue-700">{b.companyName?.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-gray-800">{b.companyName}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{b.contactName}</td>
                  <td className="py-3 px-4 text-gray-500">{b.district}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{b.cropInterest || '—'}</td>
                  <td className="py-3 px-4 text-gray-700">{b.offers?.[0] ? formatCurrency(b.offers[0].offeredPrice) : '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(b.verificationStatus)}`}>
                      {b.verificationStatus}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(b.user?.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex gap-1.5">
                      <button onClick={() => setSelected(b)}
                        className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded-lg flex items-center gap-1">
                        <Eye className="w-3 h-3" /> View
                      </button>
                      {b.verificationStatus !== 'VERIFIED' && (
                        <button onClick={() => verifyMutation.mutate({ id: b.id, status: 'VERIFIED' })}
                          className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded-lg flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" /> Verify
                        </button>
                      )}
                      {b.verificationStatus !== 'REJECTED' && (
                        <button onClick={() => verifyMutation.mutate({ id: b.id, status: 'REJECTED' })}
                          className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg flex items-center gap-1">
                          <ShieldX className="w-3 h-3" /> Reject
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {buyers.length === 0 && (
                <tr><td colSpan={8} className="py-8 text-center text-gray-400">No buyers found</td></tr>
              )}
            </tbody>
          </table>
          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-500">Page {page} of {data!.totalPages}</p>
              <div className="flex gap-2">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="btn-secondary text-xs disabled:opacity-40">Previous</button>
                <button disabled={page >= data!.totalPages} onClick={() => setPage(p => p + 1)} className="btn-secondary text-xs disabled:opacity-40">Next</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-gray-900">{selected.companyName}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(selected.verificationStatus)}`}>
                {selected.verificationStatus}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><p className="text-xs text-gray-400">Contact</p><p className="font-medium">{selected.contactName}</p></div>
              <div><p className="text-xs text-gray-400">District</p><p className="font-medium">{selected.district}</p></div>
              <div><p className="text-xs text-gray-400">Email</p><p className="font-medium text-xs">{selected.user?.email}</p></div>
              <div><p className="text-xs text-gray-400">Transactions</p><p className="font-medium">{selected.totalTransactions || 0}</p></div>
            </div>
            {selected.verificationStatus === 'PENDING' && (
              <div className="flex gap-3 pt-2">
                <button onClick={() => verifyMutation.mutate({ id: selected.id, status: 'VERIFIED' })}
                  disabled={verifyMutation.isPending}
                  className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:opacity-50">
                  <ShieldCheck className="w-4 h-4" /> Approve
                </button>
                <button onClick={() => verifyMutation.mutate({ id: selected.id, status: 'REJECTED' })}
                  disabled={verifyMutation.isPending}
                  className="flex-1 bg-red-600 text-white rounded-xl py-2.5 text-sm font-medium hover:bg-red-700 flex items-center justify-center gap-2 disabled:opacity-50">
                  <ShieldX className="w-4 h-4" /> Reject
                </button>
              </div>
            )}
            <button onClick={() => setSelected(null)} className="w-full btn-secondary text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
