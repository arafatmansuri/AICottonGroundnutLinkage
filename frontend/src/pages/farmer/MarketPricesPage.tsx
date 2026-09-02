import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketApi } from '../../api';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/StateComponents';
import { formatCurrency, getTrendColor, getTrendIcon, formatDate } from '../../utils';
import { Filter } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

export default function MarketPricesPage() {
  const [selectedCropId, setSelectedCropId] = useState('');
  const [selectedMandiId, setSelectedMandiId] = useState('');

  const { data: crops } = useQuery({
    queryKey: ['allCrops'],
    queryFn: () => marketApi.getCrops().then(r => r.data.data),
  });

  const { data: mandis } = useQuery({
    queryKey: ['mandis'],
    queryFn: () => marketApi.getMandis().then(r => r.data.data),
  });

  const { data: latestPrices, isLoading, error, refetch } = useQuery({
    queryKey: ['latestPrices', selectedCropId],
    queryFn: () => marketApi.getLatestPrices(selectedCropId || undefined).then(r => r.data.data),
  });

  const { data: priceHistory } = useQuery({
    queryKey: ['priceHistory', selectedCropId, selectedMandiId],
    queryFn: () => selectedCropId
      ? marketApi.getPriceHistory(selectedCropId, selectedMandiId || undefined, 30).then(r => r.data.data)
      : Promise.resolve([]),
    enabled: !!selectedCropId,
  });

  // Format history for chart
  const chartData = priceHistory?.reduce((acc: any[], price: any) => {
    const date = new Date(price.priceDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const existing = acc.find(d => d.date === date);
    if (existing) {
      existing[price.mandi?.name] = price.modalPrice;
    } else {
      acc.push({ date, [price.mandi?.name]: price.modalPrice });
    }
    return acc;
  }, []) || [];

  const mandiNames = [...new Set(priceHistory?.map((p: any) => p.mandi?.name) || [])];

  const colors = ['#16a34a', '#2563eb', '#d97706', '#7c3aed', '#dc2626'];

  if (isLoading) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Market Prices</h1>
        <div className="text-xs text-gray-400 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200">
          ⚡ Live market data
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Filter</span>
        </div>
        <div className="flex gap-3 flex-wrap">
          <select className="input max-w-[180px] text-sm" value={selectedCropId}
            onChange={e => setSelectedCropId(e.target.value)}>
            <option value="">All Crops</option>
            {crops?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input max-w-[180px] text-sm" value={selectedMandiId}
            onChange={e => setSelectedMandiId(e.target.value)}>
            <option value="">All Mandis</option>
            {mandis?.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {/* Price trend chart */}
      {selectedCropId && chartData.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">
            30-Day Price Trend — {crops?.find((c: any) => c.id === selectedCropId)?.name}
          </h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(1)}k`} domain={['auto', 'auto']} />
              <Tooltip formatter={(v: any) => [`₹${v.toLocaleString('en-IN')}`, '']} />
              <Legend />
              {(mandiNames as string[]).slice(0, 5).map((mandi, i) => (
                <Line key={mandi} type="monotone" dataKey={mandi} stroke={colors[i % colors.length]}
                  strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Latest prices table */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Current Mandi Prices</h2>
        {latestPrices?.length === 0 ? (
          <p className="text-center text-gray-400 py-8">No price data available for selected filters</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Mandi</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">Crop</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Min</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Modal</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Max</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Trend</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {latestPrices?.map((price: any) => (
                  <tr key={price.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{price.mandi?.name}</td>
                    <td className="py-3 px-4 text-gray-600">{price.crop?.name}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(price.minPrice)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900">{formatCurrency(price.modalPrice)}</td>
                    <td className="py-3 px-4 text-right text-gray-600">{formatCurrency(price.maxPrice)}</td>
                    <td className={`py-3 px-4 text-right font-medium ${getTrendColor(price.trend)}`}>
                      {getTrendIcon(price.trend)} {Math.abs(price.priceChangePct || 0).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400 text-xs">{formatDate(price.priceDate)}</td>
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
