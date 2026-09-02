import { useQuery } from '@tanstack/react-query';
import { farmerApi } from '../../api';
import { formatCurrency, formatDate, getStatusColor } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { EmptyState, ErrorState } from '../../components/common/StateComponents';
import { Wallet, TrendingUp, Package, ArrowDownRight } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function IncomeDashboardPage() {
  const { data: income, isLoading, error, refetch } = useQuery({
    queryKey: ['farmerIncome'],
    queryFn: () => farmerApi.getIncome().then(r => r.data.data),
  });

  if (isLoading) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;
  if (error) return <ErrorState onRetry={refetch} />;
  if (!income) return null;

  const cropChartData = income.cropSummaries?.map((c: any) => ({
    name: c.cropName,
    available: c.availableQuantity,
    sold: c.soldQuantity,
    value: c.currentMarketValue,
  })) || [];

  return (
    <div className="space-y-6 max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">Income Dashboard</h1>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-green-100 rounded-xl flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-600" />
            </div>
            <span className="text-xs text-gray-500">Net Income</span>
          </div>
          <p className="text-xl font-bold text-green-700">{formatCurrency(income.totalNetIncome)}</p>
          <p className="text-xs text-gray-400 mt-1">from {income.transactionCount} transactions</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-xs text-gray-500">Sold Qty</span>
          </div>
          <p className="text-xl font-bold text-gray-900">{income.totalSoldQuantity} qtl</p>
          <p className="text-xs text-gray-400 mt-1">total quantity sold</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-amber-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-amber-600" />
            </div>
            <span className="text-xs text-gray-500">Market Value</span>
          </div>
          <p className="text-xl font-bold text-amber-700">
            {formatCurrency(income.cropSummaries?.reduce((s: number, c: any) => s + c.currentMarketValue, 0) || 0)}
          </p>
          <p className="text-xs text-gray-400 mt-1">current portfolio value</p>
        </div>

        <div className="card">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 bg-purple-100 rounded-xl flex items-center justify-center">
              <ArrowDownRight className="w-5 h-5 text-purple-600" />
            </div>
            <span className="text-xs text-gray-500">Available</span>
          </div>
          <p className="text-xl font-bold text-gray-900">
            {income.cropSummaries?.reduce((s: number, c: any) => s + c.availableQuantity, 0) || 0} qtl
          </p>
          <p className="text-xs text-gray-400 mt-1">unsold quantity</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Crop breakdown */}
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">Crop Portfolio</h2>
          {income.cropSummaries?.length === 0 ? (
            <EmptyState title="No crops yet" />
          ) : (
            <div className="space-y-4">
              {income.cropSummaries?.map((c: any) => (
                <div key={c.id} className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-800">{c.cropName}</span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">{c.quality.replace('_', ' ')}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <p className="text-xs text-gray-500">Total</p>
                      <p className="font-medium">{c.totalQuantity} qtl</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Available</p>
                      <p className="font-medium text-green-600">{c.availableQuantity} qtl</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Sold</p>
                      <p className="font-medium text-gray-500">{c.soldQuantity} qtl</p>
                    </div>
                  </div>
                  <div className="mt-2 flex justify-between text-sm">
                    <span className="text-gray-500">Market Price</span>
                    <span className="font-semibold">{formatCurrency(c.marketPrice)}/qtl</span>
                  </div>
                  <div className="flex justify-between text-sm mt-1">
                    <span className="text-gray-500">Est. Value</span>
                    <span className="font-bold text-green-700">{formatCurrency(c.currentMarketValue)}</span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>Sold</span><span>{Math.round((c.soldQuantity / c.totalQuantity) * 100) || 0}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-green-500 rounded-full"
                        style={{ width: `${Math.min(100, (c.soldQuantity / c.totalQuantity) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart */}
        {cropChartData.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-gray-900 mb-4">Quantity Overview</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cropChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: any) => [`${v} qtl`, '']} />
                <Bar dataKey="available" name="Available" fill="#16a34a" radius={[4,4,0,0]} />
                <Bar dataKey="sold" name="Sold" fill="#86efac" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent transactions */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Recent Transactions</h2>
        {income.recentTransactions?.length === 0 ? (
          <EmptyState title="No transactions yet" description="Your completed transactions will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Crop</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Qty</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Net Price</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Total</th>
                  <th className="text-center py-3 px-4 text-gray-500 font-medium">Status</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {income.recentTransactions?.map((tx: any) => (
                  <tr key={tx.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium">{tx.farmerCrop?.crop?.name}</td>
                    <td className="py-3 px-4 text-right">{tx.quantity} qtl</td>
                    <td className="py-3 px-4 text-right">{formatCurrency(tx.netRealization)}/qtl</td>
                    <td className="py-3 px-4 text-right font-semibold text-green-700">
                      {formatCurrency(tx.netRealization * tx.quantity)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getStatusColor(tx.status)}`}>
                        {tx.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400 text-xs">{formatDate(tx.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
