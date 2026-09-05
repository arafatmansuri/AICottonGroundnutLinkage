import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { formatNumber } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { ShieldCheck, ShieldX, Users, Wheat, TrendingUp, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const qc = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getStats().then(r => r.data.data),
  });

  const { data: pendingBuyersData, isLoading: buyersLoading } = useQuery({
    queryKey: ['adminBuyersPending'],
    queryFn: () => adminApi.getBuyers({ page: 1, limit: 10, verificationStatus: 'PENDING' }).then(r => r.data.data),
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.verifyBuyer(id, status),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['adminBuyersPending'] });
      qc.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success(`Buyer ${vars.status.toLowerCase()}`);
    },
    onError: () => toast.error('Action failed'),
  });

  const pieData = stats ? [
    { name: 'Verified Buyers', value: stats.verifiedBuyers, color: '#16a34a' },
    { name: 'Pending Buyers', value: stats.buyers - stats.verifiedBuyers, color: '#d97706' },
  ] : [];

  return (
    <div className="space-y-6 max-w-7xl">
      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Stats grid */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {[1,2,3,4,5].map(i => <CardSkeleton key={i} lines={2} />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: 'Farmers', value: stats?.farmers, icon: Users, color: 'bg-green-100 text-green-600' },
            { label: 'Buyers', value: stats?.buyers, icon: Users, color: 'bg-blue-100 text-blue-600' },
            { label: 'Verified Buyers', value: stats?.verifiedBuyers, icon: ShieldCheck, color: 'bg-teal-100 text-teal-600' },
            { label: 'Active Crops', value: stats?.activeCrops, icon: Wheat, color: 'bg-amber-100 text-amber-600' },
            { label: 'Market Records', value: stats?.marketRecords, icon: TrendingUp, color: 'bg-cyan-100 text-cyan-600' },
          ].map(s => (
            <div key={s.label} className="card">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${s.color}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{formatNumber(s.value || 0)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Buyer verification pie chart */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Buyer Verification Status</h3>
          {statsLoading ? <CardSkeleton lines={3} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Platform health */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-gray-500" /> Platform Health
          </h3>
          <div className="space-y-3">
            {[
              { label: 'Database', status: 'Operational', ok: true },
              { label: 'AI Service', status: 'Demo Mode', ok: true },
              { label: 'Market Data', status: 'Seed Data', ok: true },
              { label: 'Authentication', status: 'JWT Active', ok: true },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${item.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {item.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending buyers quick-action */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Pending Buyer Verifications</h3>
        {buyersLoading ? <CardSkeleton lines={2} /> : (
          <>
            {(pendingBuyersData?.data ?? []).length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">No pending verifications 🎉</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[480px]">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {['Company', 'Contact', 'District', 'Registered', 'Actions'].map(h => (
                        <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(pendingBuyersData?.data ?? []).map((b: any) => (
                      <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">{b.companyName}</td>
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{b.contactName}</td>
                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{b.district}</td>
                        <td className="py-3 px-4 text-gray-400 text-xs whitespace-nowrap">
                          {b.user?.createdAt ? new Date(b.user.createdAt).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => verifyMutation.mutate({ id: b.id, status: 'VERIFIED' })}
                              disabled={verifyMutation.isPending}
                              className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-2 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50"
                            >
                              <ShieldCheck className="w-3 h-3" /> Verify
                            </button>
                            <button
                              onClick={() => verifyMutation.mutate({ id: b.id, status: 'REJECTED' })}
                              disabled={verifyMutation.isPending}
                              className="text-xs bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg flex items-center gap-1 disabled:opacity-50"
                            >
                              <ShieldX className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
