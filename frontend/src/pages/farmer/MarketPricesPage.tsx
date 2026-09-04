import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { marketApi } from '../../api';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { ErrorState } from '../../components/common/StateComponents';
import { formatCurrency, getTrendColor, getTrendIcon, formatDate } from '../../utils';
import { Filter, Clock, AlertCircle } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

export default function MarketPricesPage() {
  const { t } = useLanguage();
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

  const { data: latestPrices, isLoading, error, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['latestPrices', selectedCropId],
    queryFn: () => marketApi.getLatestPrices(selectedCropId || undefined).then(r => r.data.data),
    refetchInterval: 5 * 60 * 1000,
  });

  const { data: priceHistory } = useQuery({
    queryKey: ['priceHistory', selectedCropId, selectedMandiId],
    queryFn: () => selectedCropId
      ? marketApi.getPriceHistory(selectedCropId, selectedMandiId || undefined, 30).then(r => r.data.data)
      : Promise.resolve([]),
    enabled: !!selectedCropId,
  });

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
      <div className="flex items-start sm:items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('market_prices')}</h1>
          <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            {dataUpdatedAt ? `${t('updated')} ${new Date(dataUpdatedAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}` : t('loading')}
            · {t('auto_refresh')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5" />
            {t('demo_data')}
          </span>
          <button onClick={() => refetch()} className="btn-secondary text-xs">{t('refresh')}</button>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">{t('filter')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select className="input text-sm w-full" value={selectedCropId}
            onChange={e => setSelectedCropId(e.target.value)}>
            <option value="">{t('all_crops_filter')}</option>
            {crops?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input text-sm w-full" value={selectedMandiId}
            onChange={e => setSelectedMandiId(e.target.value)}>
            <option value="">{t('all_mandis')}</option>
            {mandis?.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {/* Price trend chart */}
      {selectedCropId && chartData.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-gray-900 mb-4">
            {t('day_price_trend')} — {crops?.find((c: any) => c.id === selectedCropId)?.name}
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
      <div className="card overflow-hidden">
        <h2 className="font-semibold text-gray-900 mb-4">{t('current_mandi_prices')}</h2>
        {latestPrices?.length === 0 ? (
          <p className="text-center text-gray-400 py-8">{t('no_price_data')}</p>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-sm min-w-[560px]">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('mandi')}</th>
                  <th className="text-left py-3 px-4 text-gray-500 font-medium">{t('crop')}</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('min_price')}</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('modal_price')}</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('max_price')}</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('trend')}</th>
                  <th className="text-right py-3 px-4 text-gray-500 font-medium">{t('date')}</th>
                </tr>
              </thead>
              <tbody>
                {latestPrices?.map((price: any) => (
                  <tr key={price.id} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800 whitespace-nowrap">{price.mandi?.name}</td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">{price.crop?.name}</td>
                    <td className="py-3 px-4 text-right text-gray-600 whitespace-nowrap">{formatCurrency(price.minPrice)}</td>
                    <td className="py-3 px-4 text-right font-semibold text-gray-900 whitespace-nowrap">{formatCurrency(price.modalPrice)}</td>
                    <td className="py-3 px-4 text-right text-gray-600 whitespace-nowrap">{formatCurrency(price.maxPrice)}</td>
                    <td className={`py-3 px-4 text-right font-medium whitespace-nowrap ${getTrendColor(price.trend)}`}>
                      {getTrendIcon(price.trend)} {Math.abs(price.priceChangePct || 0).toFixed(1)}%
                    </td>
                    <td className="py-3 px-4 text-right text-gray-400 text-xs whitespace-nowrap">{formatDate(price.priceDate)}</td>
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
