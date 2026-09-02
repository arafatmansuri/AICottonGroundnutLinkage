import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { aiApi, farmerApi, marketApi } from '../../api';
import { formatCurrency, getDecisionColor, getDecisionLabel, getTrendColor, getTrendIcon } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { Briefcase, TrendingUp, Zap, AlertTriangle } from 'lucide-react';

export default function StorageAdvisorPage() {
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

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['forecast', selectedCropId, selectedMandiId],
    queryFn: () => selectedCropId
      ? aiApi.getForecast(selectedCropId, selectedMandiId || undefined, 30).then(r => r.data.data)
      : Promise.resolve(null),
    enabled: !!selectedCropId,
  });

  const { data: farmerCrops } = useQuery({
    queryKey: ['farmerCrops'],
    queryFn: () => farmerApi.getCrops().then(r => r.data.data),
  });

  const selectedFarmerCrop = farmerCrops?.find((fc: any) => fc.cropId === selectedCropId);

  const storageQuery = useQuery({
    queryKey: ['storageAdvisor', selectedCropId, forecast?.currentPrice],
    queryFn: () => aiApi.storageAdvisor({
      currentPrice: forecast?.currentPrice || 7000,
      forecastMin: forecast?.forecastRange?.min || 7000,
      forecastMax: forecast?.forecastRange?.max || 7200,
      forecastConfidence: forecast?.confidence || 0.6,
      storageCostPerUnit: 50,
      storageDurationDays: 30,
      quantity: selectedFarmerCrop?.availableQuantity || 100,
      riskProfile: 'MODERATE',
    }).then(r => r.data.data),
    enabled: !!forecast?.currentPrice,
  });

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Sell or Store? Advisor</h1>
        <div className="text-xs bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full border border-amber-200">
          AI-powered analysis
        </div>
      </div>

      {/* Selectors */}
      <div className="card p-5">
        <p className="text-sm font-medium text-gray-700 mb-3">Select crop to analyze:</p>
        <div className="flex gap-3 flex-wrap">
          <select className="input max-w-[200px] text-sm" value={selectedCropId}
            onChange={e => setSelectedCropId(e.target.value)}>
            <option value="">Select crop</option>
            {crops?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="input max-w-[200px] text-sm" value={selectedMandiId}
            onChange={e => setSelectedMandiId(e.target.value)}>
            <option value="">All Mandis</option>
            {mandis?.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {!selectedCropId ? (
        <div className="card text-center py-12">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">Select a crop above to get sell vs store analysis</p>
        </div>
      ) : forecastLoading ? (
        <CardSkeleton />
      ) : (
        <div className="space-y-4">
          {/* Forecast */}
          {forecast && (
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                <h2 className="font-semibold text-gray-900">Price Forecast (7 days)</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Current Price</p>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(forecast.currentPrice)}</p>
                  <p className="text-xs text-gray-400">per quintal</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Forecast Range</p>
                  <p className="text-lg font-bold text-gray-800">
                    {formatCurrency(forecast.forecastRange.min)} – {formatCurrency(forecast.forecastRange.max)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Trend</p>
                  <p className={`text-lg font-bold ${getTrendColor(forecast.trend)}`}>
                    {getTrendIcon(forecast.trend)} {forecast.trend}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Confidence</p>
                  <p className="text-lg font-bold text-gray-800">{Math.round(forecast.confidence * 100)}%</p>
                  <div className="h-1.5 bg-gray-200 rounded-full mt-1">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: `${forecast.confidence * 100}%` }} />
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 bg-blue-50 rounded-xl px-4 py-3">{forecast.explanation}</p>
              <p className="text-xs text-gray-400 mt-2">Based on {forecast.dataPoints} price data points</p>
            </div>
          )}

          {/* Storage recommendation */}
          {storageQuery.data && (
            <div className="card border-2 border-green-100">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-green-600" />
                <h2 className="font-semibold text-gray-900">AI Recommendation</h2>
              </div>

              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-bold mb-4 ${getDecisionColor(storageQuery.data.recommendation)}`}>
                {getDecisionLabel(storageQuery.data.recommendation)}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <p className="text-xs text-gray-500">Sell Now Qty</p>
                  <p className="text-lg font-bold text-green-700">{storageQuery.data.sellNowQuantity} qtl</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Store Qty</p>
                  <p className="text-lg font-bold text-blue-700">{storageQuery.data.storeQuantity} qtl</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Storage Cost</p>
                  <p className="text-lg font-bold text-gray-700">{formatCurrency(storageQuery.data.storageCost)}/qtl</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Risk Level</p>
                  <p className={`text-lg font-bold ${
                    storageQuery.data.riskLevel === 'HIGH' ? 'text-red-600' :
                    storageQuery.data.riskLevel === 'LOW' ? 'text-green-600' : 'text-amber-600'
                  }`}>{storageQuery.data.riskLevel}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                {storageQuery.data.reasoning?.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span>{r}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between text-sm bg-gray-50 rounded-xl p-3">
                <div>
                  <p className="text-gray-500 text-xs">Current Net Value</p>
                  <p className="font-bold">{formatCurrency(storageQuery.data.currentNetValue)}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs">Expected Future Value</p>
                  <p className={`font-bold ${storageQuery.data.potentialGain > 0 ? 'text-green-600' : 'text-red-500'}`}>
                    {formatCurrency(storageQuery.data.expectedFutureNetValue)}
                    {' '}({storageQuery.data.potentialGain > 0 ? '+' : ''}{formatCurrency(storageQuery.data.potentialGain)})
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>AI-assisted guidance based on available market data. Not a guaranteed financial outcome. Storage costs, quality deterioration risk, and market volatility may affect results.</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
