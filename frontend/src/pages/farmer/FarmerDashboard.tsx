import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { Wheat, Users, Wallet, Bot, Briefcase, Star, ArrowRight, TrendingUp } from 'lucide-react';
import { farmerApi, marketApi, aiApi } from '../../api';
import type { RootState } from '../../store';
import { t } from '../../i18n';
import { formatCurrency, getTrendColor, getTrendIcon, getDecisionColor, getDecisionLabel } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';

export default function FarmerDashboard() {
  const { language } = useSelector((s: RootState) => s.ui);
  const { user } = useSelector((s: RootState) => s.auth);

  const { data: cropsData, isLoading: cropsLoading } = useQuery({
    queryKey: ['farmerCrops'],
    queryFn: () => farmerApi.getCrops().then(r => r.data.data),
  });

  const { data: latestPrices, isLoading: pricesLoading } = useQuery({
    queryKey: ['latestPrices'],
    queryFn: () => marketApi.getLatestPrices().then(r => r.data.data),
  });

  const { data: incomeData, isLoading: incomeLoading } = useQuery({
    queryKey: ['farmerIncome'],
    queryFn: () => farmerApi.getIncome().then(r => r.data.data),
  });

  const { data: recentRecs } = useQuery({
    queryKey: ['aiRecommendations'],
    queryFn: () => aiApi.getRecommendations().then(r => r.data.data),
  });

  const latestRec = recentRecs?.[0];

  // Group prices by crop for today's market card
  const priceMap = new Map<string, typeof latestPrices>();
  latestPrices?.forEach((p: any) => {
    if (!priceMap.has(p.cropId)) priceMap.set(p.cropId, []);
    priceMap.get(p.cropId)!.push(p);
  });

  const quickActions = [
    { label: t('market_prices', language), to: '/farmer/market', icon: TrendingUp, color: 'bg-blue-50 text-blue-600' },
    { label: t('buyers', language), to: '/farmer/buyers', icon: Users, color: 'bg-purple-50 text-purple-600' },
    { label: t('storage_advisor', language), to: '/farmer/storage-advisor', icon: Briefcase, color: 'bg-amber-50 text-amber-600' },
    { label: t('quality_check', language), to: '/farmer/quality', icon: Star, color: 'bg-rose-50 text-rose-600' },
    { label: t('income', language), to: '/farmer/income', icon: Wallet, color: 'bg-green-50 text-green-600' },
    { label: t('ai_assistant', language), to: '/farmer/ai-assistant', icon: Bot, color: 'bg-indigo-50 text-indigo-600' },
    { label: t('my_crops', language), to: '/farmer/crops', icon: Wheat, color: 'bg-green-50 text-green-700' },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Jai Kisan, {user?.name?.split(' ')[0]} 🙏
          </h1>
          <p className="text-gray-500 text-sm mt-1">Here's your market intelligence for today</p>
        </div>
        <Link to="/farmer/ai-assistant"
          className="btn-primary flex items-center gap-2 text-sm">
          <Bot className="w-4 h-4" /> {t('ask_ai', language)}
        </Link>
      </div>

      {/* Income Summary Cards */}
      {incomeLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <CardSkeleton key={i} lines={2} />)}
        </div>
      ) : incomeData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Total Crops</p>
            <p className="text-2xl font-bold text-gray-900">{incomeData.cropSummaries?.length || 0}</p>
            <p className="text-xs text-green-600 mt-1">Active listings</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Available Quantity</p>
            <p className="text-2xl font-bold text-gray-900">
              {incomeData.cropSummaries?.reduce((s: number, c: any) => s + c.availableQuantity, 0) || 0}
            </p>
            <p className="text-xs text-gray-400 mt-1">quintals</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Market Value</p>
            <p className="text-xl font-bold text-green-700">
              {formatCurrency(incomeData.cropSummaries?.reduce((s: number, c: any) => s + c.currentMarketValue, 0) || 0)}
            </p>
            <p className="text-xs text-gray-400 mt-1">estimated</p>
          </div>
          <div className="card">
            <p className="text-xs text-gray-500 mb-1">Net Income Earned</p>
            <p className="text-xl font-bold text-green-700">{formatCurrency(incomeData.totalNetIncome || 0)}</p>
            <p className="text-xs text-gray-400 mt-1">from {incomeData.transactionCount} transactions</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Market */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900">{t('today_market', language)}</h2>
              <Link to="/farmer/market" className="text-green-600 text-sm flex items-center gap-1 hover:underline">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            {pricesLoading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-14 skeleton rounded-xl" />)}
              </div>
            ) : latestPrices?.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No market prices available</p>
            ) : (
              <div className="space-y-3">
                {latestPrices?.slice(0, 6).map((price: any) => (
                  <div key={price.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{price.mandi?.name}</p>
                      <p className="text-xs text-gray-500">{price.crop?.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">{formatCurrency(price.modalPrice)}/qtl</p>
                      <p className={`text-xs font-medium ${getTrendColor(price.trend)}`}>
                        {getTrendIcon(price.trend)} {Math.abs(price.priceChangePct || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right panel */}
        <div className="space-y-4">
          {/* My Crops */}
          <div className="card">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-gray-900">{t('my_crops', language)}</h2>
              <Link to="/farmer/crops" className="text-green-600 text-sm hover:underline">Manage</Link>
            </div>
            {cropsLoading ? <CardSkeleton lines={2} /> : cropsData?.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-2">No crops added yet</p>
                <Link to="/farmer/crops" className="btn-primary text-xs px-3 py-1.5">Add Crop</Link>
              </div>
            ) : (
              <div className="space-y-2">
                {cropsData?.slice(0, 4).map((fc: any) => (
                  <div key={fc.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center gap-2">
                      <Wheat className="w-4 h-4 text-green-600" />
                      <span className="text-sm font-medium text-gray-700">{fc.crop?.name}</span>
                    </div>
                    <span className="text-sm text-gray-500">{fc.availableQuantity} qtl</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Recommendation */}
          {latestRec && (
            <div className="card border-green-100 bg-green-50/50">
              <div className="flex items-center gap-2 mb-3">
                <Bot className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">{t('ai_recommendation', language)}</h2>
              </div>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold mb-2 ${getDecisionColor(latestRec.decision)}`}>
                {getDecisionLabel(latestRec.decision)}
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">{latestRec.explanation?.slice(0, 140)}...</p>
              <Link to="/farmer/ai-assistant" className="text-green-600 text-xs font-medium mt-2 flex items-center gap-1 hover:underline">
                See full analysis <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActions.map((action) => (
            <Link key={action.to} to={action.to}
              className="card p-4 flex flex-col items-center gap-2 hover:shadow-md transition-shadow cursor-pointer text-center">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
