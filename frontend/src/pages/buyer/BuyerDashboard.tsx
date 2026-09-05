import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Wheat, Bell, UserCircle, Search, ArrowRight, CheckCircle, Clock } from 'lucide-react';
import { buyerApi } from '../../api';
import type { RootState } from '../../store';
import { formatCurrency } from '../../utils';

export default function BuyerDashboard() {
  const { user } = useSelector((s: RootState) => s.auth);

  const { data: profileData } = useQuery({
    queryKey: ['buyerProfile'],
    queryFn: () => buyerApi.getProfile().then(r => r.data.data),
  });

  const { data: interests } = useQuery({
    queryKey: ['buyerInterests'],
    queryFn: () => buyerApi.getInterests().then(r => r.data.data),
  });

  const quickActions = [
    { label: 'Search Crops', to: '/buyer/crops', icon: Search, color: 'bg-green-50 text-green-600' },
    { label: 'My Interests', to: '/buyer/interests', icon: Bell, color: 'bg-amber-50 text-amber-600' },
    { label: 'My Profile', to: '/buyer/profile', icon: UserCircle, color: 'bg-blue-50 text-blue-600' },
  ];

  const recentInterests = interests?.slice(0, 5) ?? [];

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome */}
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Welcome, {user?.name?.split(' ')[0]} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Find and connect with farmers across the marketplace.</p>
        </div>
        <Link
          to="/buyer/crops"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Search className="w-4 h-4" /> Browse Crops
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Total Interests Sent</p>
          <p className="text-3xl font-bold text-gray-900">{interests?.length ?? 0}</p>
          <p className="text-xs text-green-600 mt-1">Crops contacted</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">Verification Status</p>
          <p className="text-lg font-bold capitalize text-gray-900">
            {(profileData as any)?.verificationStatus?.replace('_', ' ') ?? '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">Buyer account</p>
        </div>
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs text-gray-500 mb-1">District</p>
          <p className="text-lg font-bold text-gray-900">{(profileData as any)?.district ?? '—'}</p>
          <p className="text-xs text-gray-400 mt-1">Operating area</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {quickActions.map((action) => (
            <Link
              key={action.to}
              to={action.to}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col items-center gap-3 hover:shadow-md transition-shadow cursor-pointer text-center"
            >
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-sm font-medium text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Interests */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Interest Notifications</h2>
          <Link to="/buyer/interests" className="text-green-600 text-sm flex items-center gap-1 hover:underline">
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {recentInterests.length === 0 ? (
          <div className="text-center py-8">
            <Wheat className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">No interests sent yet.</p>
            <Link to="/buyer/crops" className="mt-3 inline-block text-green-600 text-sm font-medium hover:underline">
              Browse crops to get started
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentInterests.map((interest: any) => (
              <div key={interest.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Wheat className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800 text-sm">{interest.farmerCrop?.crop?.name}</p>
                    <p className="text-xs text-gray-500">
                      {interest.farmerCrop?.farmerProfile?.name} · {interest.farmerCrop?.district}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-800">
                    {interest.farmerCrop?.quantity} {interest.farmerCrop?.unit}
                  </p>
                  {interest.farmerCrop?.expectedPrice && (
                    <p className="text-xs text-gray-500">{formatCurrency(interest.farmerCrop.expectedPrice)}/qtl</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
