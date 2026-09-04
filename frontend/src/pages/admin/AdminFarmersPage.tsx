import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { formatDate } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { Users, Search, ShieldOff, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminFarmersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminFarmers', page],
    queryFn: () => adminApi.getFarmers({ page, limit: 20 }).then(r => r.data.data),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateFarmerStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminFarmers'] });
      toast.success('Farmer status updated');
    },
    onError: () => toast.error('Action failed'),
  });

  const farmers = (data?.data || []).filter((f: any) =>
    !search ||
    f.name?.toLowerCase().includes(search.toLowerCase()) ||
    f.district?.toLowerCase().includes(search.toLowerCase()) ||
    f.user?.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
            <Users className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Farmer Management</h1>
            <p className="text-sm text-gray-500">{data?.total || 0} registered farmers</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                className="input pl-9 w-full sm:max-w-sm"
            placeholder="Search by name, district, email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <CardSkeleton key={i} lines={2} />)}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Name', 'District', 'Village', 'Phone', 'Email', 'Land (acres)', 'Status', 'Joined', 'Actions'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {farmers.map((f: any) => (
                <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-green-700">{f.name?.charAt(0)}</span>
                      </div>
                      <span className="font-medium text-gray-800">{f.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-600">{f.district}</td>
                  <td className="py-3 px-4 text-gray-500">{f.village || '—'}</td>
                  <td className="py-3 px-4 text-gray-500">{f.phone || '—'}</td>
                  <td className="py-3 px-4 text-gray-500 text-xs">{f.user?.email}</td>
                  <td className="py-3 px-4 text-gray-600">{f.landholding ?? '—'}</td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      f.user?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                      f.user?.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
                    }`}>{f.user?.status || 'ACTIVE'}</span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(f.user?.createdAt)}</td>
                  <td className="py-3 px-4">
                    {f.user?.status !== 'SUSPENDED' ? (
                      <button
                        onClick={() => suspendMutation.mutate({ id: f.id, status: 'SUSPENDED' })}
                        className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg flex items-center gap-1"
                      >
                        <ShieldOff className="w-3 h-3" /> Suspend
                      </button>
                    ) : (
                      <button
                        onClick={() => suspendMutation.mutate({ id: f.id, status: 'ACTIVE' })}
                        className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded-lg flex items-center gap-1"
                      >
                        <ShieldCheck className="w-3 h-3" /> Reactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {farmers.length === 0 && (
                <tr><td colSpan={9} className="py-8 text-center text-gray-400">No farmers found</td></tr>
              )}
            </tbody>
          </table>
          {/* Pagination */}
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
    </div>
  );
}
