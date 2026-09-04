import { useQuery } from '@tanstack/react-query';
import { farmerApi } from '../../api';
import { formatCurrency } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { EmptyState, ErrorState } from '../../components/common/StateComponents';
import { Wallet, TrendingUp, Package, ArrowDownRight } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function IncomeDashboardPage() {
  const { t } = useLanguage();
  const { data: income, isLoading, error, refetch } = useQuery({
    queryKey: ['farmerIncome'],
    queryFn: () => farmerApi.getIncome().then(r => r.data.data),
  });

  if (isLoading) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;
  if (error) return <ErrorState onRetry={refetch} />;
  if (!income) return null;

  const cropChartData = income.cropSummaries?.map((c: any) => ({
    name: c.cropName,
    quantity: c.quantity,
    sold: c.soldQuantity,
    value: c.currentMarketValue,
  })) || [];

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">{t('income_dashboard')}</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">{t('net_income')}</span>
          </div>
          <p className="text-xl font-bold text-green-700">{formatCurrency(income.totalNetIncome)}</p>
          {/* <p className="text-xs text-gray-400 mt-1">{t('from_transactions').replace('{0}', income.transactionCount)}</p> */}
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">{t('sold_qty')}</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{income.totalSoldQuantity} {t('qtl')}</p>
          <p className="text-xs text-gray-400 mt-1">{t('total_qty_sold')}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs text-gray-500">{t('market_value')}</span>
          </div>
          <p className="text-xl font-bold text-amber-700">
            {formatCurrency(income.cropSummaries?.reduce((s: number, c: any) => s + c.currentMarketValue, 0) || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('current_portfolio')}</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">{t('total_quantity')}</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {income.cropSummaries?.reduce((s: number, c: any) => s + c.quantity, 0) || 0} {t('qtl')}
          </p>
          <p className="text-xs text-gray-400 mt-1">{t('total_crop_qty')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Crop breakdown */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">{t('crop_portfolio')}</h2>
          {income.cropSummaries?.length === 0 ? (
            <EmptyState title={t('no_crops_yet')} />
          ) : (
            <div className="space-y-4 overflow-y-auto h-50">
              {income.cropSummaries?.map((c: any) => (
                <div key={c.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-800">{c.cropName}</span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{c.quality.replace('_', ' ')}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">{t('quantity_quintals')}</p>
                      <p className="font-medium">{c.quantity} {t('qtl')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('sold_label')}</p>
                      <p className="font-medium text-gray-500">{c.soldQuantity ?? 0} {t('qtl')}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-500">{t('market_price')}</span>
                    <span className="font-semibold">{formatCurrency(c.marketPrice)}/{t('qtl')}</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">{t('est_value')}</span>
                    <span className="font-bold text-green-700">{formatCurrency(c.currentMarketValue)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart */}
        {cropChartData.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">{t('quantity_overview')}</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cropChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v} ${t('qtl')}`, '']} />
                <Bar dataKey="quantity" name={t('quantity_quintals')} fill="#16a34a" radius={[4,4,0,0]} />
                <Bar dataKey="sold" name={t('sold_label')} fill="#86efac" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
