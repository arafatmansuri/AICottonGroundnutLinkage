import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { formatDate, formatNumber } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { ShieldCheck, ShieldX, Users, Wheat, TrendingUp, Activity } from 'lucide-react';
import toast from 'react-hot-toast';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'buyers' | 'farmers'>('overview');

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getStats().then(r => r.data.data),
  });

  const { data: buyersData, isLoading: buyersLoading } = useQuery({
    queryKey: ['adminBuyers'],
    queryFn: () => adminApi.getBuyers({ page: 1, limit: 20 }).then(r => r.data.data),
    enabled: activeTab === 'buyers',
  });

  const { data: farmersData } = useQuery({
    queryKey: ['adminFarmers'],
    queryFn: () => adminApi.getFarmers({ page: 1, limit: 20 }).then(r => r.data.data),
    enabled: activeTab === 'farmers',
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.verifyBuyer(id, status),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['adminBuyers'] });
      qc.invalidateQueries({ queryKey: ['adminStats'] });
      toast.success(`Buyer ${vars.status.toLowerCase()}`);
    },
    onError: () => toast.error('Action failed'),
  });

  const pieData = stats ? [
    { name: 'Verified Buyers', value: stats.verifiedBuyers, color: '#16a34a' },
    { name: 'Pending Buyers', value: stats.buyers - stats.verifiedBuyers, color: '#d97706' },
  ] : [];

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'buyers', label: 'Buyers', icon: Users },
    { id: 'farmers', label: 'Farmers', icon: Wheat },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            <tab.icon className="w-4 h-4" />{tab.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && (
        <>
          {statsLoading ? (
            <div className="grid grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <CardSkeleton key={i} lines={2} />)}</div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {[
                  { label: 'Farmers', value: stats?.farmers, icon: Users, color: 'bg-green-100 text-green-600' },
                  { label: 'Buyers', value: stats?.buyers, icon: Users, color: 'bg-blue-100 text-blue-600' },
                  { label: 'Verified Buyers', value: stats?.verifiedBuyers, icon: ShieldCheck, color: 'bg-teal-100 text-teal-600' },
                  { label: 'Active Crops', value: stats?.activeCrops, icon: Wheat, color: 'bg-amber-100 text-amber-600' },
                  { label: 'Active Offers', value: stats?.activeOffers, icon: TrendingUp, color: 'bg-purple-100 text-purple-600' },
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

              <div className="grid md:grid-cols-2 gap-6">
                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-4">Buyer Verification Status</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h3 className="font-semibold text-gray-900 mb-4">Platform Health</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Database', status: 'Operational', ok: true },
                      { label: 'AI Service', status: 'Demo Mode', ok: true },
                      { label: 'Market Data', status: 'SEED Data', ok: true },
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
            </>
          )}
        </>
      )}

      {/* Buyers tab */}
      {activeTab === 'buyers' && (
        <div className="space-y-3">
          <h2 className="font-semibold text-gray-900">Buyer Management</h2>
          {buyersLoading ? <CardSkeleton /> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    {['Company', 'Contact', 'District', 'Status', 'Registered', 'Actions'].map(h => (
                      <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {buyersData?.buyers?.map((b: any) => (
                    <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium text-gray-800">{b.companyName}</td>
                      <td className="py-3 px-4 text-gray-600">{b.contactName}</td>
                      <td className="py-3 px-4 text-gray-600">{b.district}</td>
                      <td className="py-3 px-4">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          b.verificationStatus === 'VERIFIED' ? 'badge-verified' :
                          b.verificationStatus === 'REJECTED' ? 'badge-rejected' : 'badge-pending'
                        }`}>
                          {b.verificationStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(b.user?.createdAt)}</td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2">
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
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Farmers tab */}
      {activeTab === 'farmers' && (
        <div>
          <h2 className="font-semibold text-gray-900 mb-3">Farmer Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Name', 'District', 'Village', 'Email', 'Status', 'Registered'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {farmersData?.farmers?.map((f: any) => (
                  <tr key={f.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{f.name}</td>
                    <td className="py-3 px-4 text-gray-600">{f.district}</td>
                    <td className="py-3 px-4 text-gray-500">{f.village || '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{f.user?.email}</td>
                    <td className="py-3 px-4">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${f.user?.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {f.user?.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(f.user?.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
