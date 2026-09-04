import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, marketApi } from '../../api';
import { formatCurrency, formatDate } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { TrendingUp, Plus, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

export default function AdminMarketDataPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [form, setForm] = useState({
    cropId: '', mandiId: '', modalPrice: '', minPrice: '', maxPrice: '',
    arrivalQuantity: '', unit: 'QUINTAL', priceDate: new Date().toISOString().split('T')[0],
  });

  const { data: crops } = useQuery({
    queryKey: ['allCrops'],
    queryFn: () => marketApi.getCrops().then(r => r.data.data),
  });

  const { data: mandis } = useQuery({
    queryKey: ['allMandis'],
    queryFn: () => marketApi.getMandis().then(r => r.data.data),
  });

  const { data: latestPrices, isLoading: pricesLoading } = useQuery({
    queryKey: ['adminLatestPrices'],
    queryFn: () => marketApi.getLatestPrices().then(r => r.data.data),
    refetchInterval: 60_000,
  });

  const { data: history } = useQuery({
    queryKey: ['adminPriceHistory', selectedCrop],
    queryFn: () => marketApi.getPriceHistory(selectedCrop, undefined, 30).then(r => r.data.data),
    enabled: !!selectedCrop,
  });

  const addPriceMutation = useMutation({
    mutationFn: (data: any) => adminApi.addMarketPrice(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminLatestPrices'] });
      qc.invalidateQueries({ queryKey: ['adminPriceHistory'] });
      toast.success('Market price added');
      setShowForm(false);
      setForm({ cropId: '', mandiId: '', modalPrice: '', minPrice: '', maxPrice: '', arrivalQuantity: '', unit: 'QUINTAL', priceDate: new Date().toISOString().split('T')[0] });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Failed to add price'),
  });

  const chartData = (history?.history || []).map((h: any) => ({
    date: new Date(h.priceDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
    modal: h.modalPrice,
    min: h.minPrice,
    max: h.maxPrice,
  })).reverse();

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Market Data Management</h1>
            <p className="text-sm text-gray-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Auto-refreshes every 60s
            </p>
          </div>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 flex-shrink-0">
          <Plus className="w-4 h-4" /> Add Price Entry
        </button>
      </div>

      {/* DEMO badge */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
        <span className="text-xs font-bold bg-amber-500 text-white px-2 py-0.5 rounded">DEMO DATA</span>
        <p className="text-xs text-amber-800">Market prices shown are seeded demo data. In production, prices are fetched from real mandi APIs (Agmarknet / eNAM).</p>
      </div>

      {/* Add price form */}
      {showForm && (
        <div className="card border-teal-200 bg-teal-50/20">
          <h2 className="font-semibold text-gray-800 mb-4">Add Market Price Entry</h2>
          <form onSubmit={e => {
            e.preventDefault();
            addPriceMutation.mutate({
              ...form,
              modalPrice: Number(form.modalPrice),
              minPrice: Number(form.minPrice),
              maxPrice: Number(form.maxPrice),
              arrivalQuantity: form.arrivalQuantity ? Number(form.arrivalQuantity) : undefined,
            });
          }} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Crop *</label>
              <select className="input" value={form.cropId} onChange={e => setForm({ ...form, cropId: e.target.value })} required>
                <option value="">Select crop</option>
                {crops?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Mandi *</label>
              <select className="input" value={form.mandiId} onChange={e => setForm({ ...form, mandiId: e.target.value })} required>
                <option value="">Select mandi</option>
                {mandis?.map((m: any) => <option key={m.id} value={m.id}>{m.name} ({m.district})</option>)}
              </select>
            </div>
            <div>
              <label className="label">Price Date *</label>
              <input type="date" className="input" value={form.priceDate} onChange={e => setForm({ ...form, priceDate: e.target.value })} required />
            </div>
            <div>
              <label className="label">Modal Price (₹/qtl) *</label>
              <input type="number" className="input" placeholder="7500" min="1"
                value={form.modalPrice} onChange={e => setForm({ ...form, modalPrice: e.target.value })} required />
            </div>
            <div>
              <label className="label">Min Price (₹/qtl)</label>
              <input type="number" className="input" placeholder="7200"
                value={form.minPrice} onChange={e => setForm({ ...form, minPrice: e.target.value })} />
            </div>
            <div>
              <label className="label">Max Price (₹/qtl)</label>
              <input type="number" className="input" placeholder="7800"
                value={form.maxPrice} onChange={e => setForm({ ...form, maxPrice: e.target.value })} />
            </div>
            <div>
              <label className="label">Arrival Qty (qtl)</label>
              <input type="number" className="input" placeholder="500"
                value={form.arrivalQuantity} onChange={e => setForm({ ...form, arrivalQuantity: e.target.value })} />
            </div>
            <div className="col-span-1 sm:col-span-2 md:col-span-3 flex gap-3">
              <button type="submit" disabled={addPriceMutation.isPending} className="btn-primary flex-1 disabled:opacity-50">
                {addPriceMutation.isPending ? 'Saving…' : 'Save Price Entry'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Chart */}
      {/* <div className="card">
        <div className="flex items-start sm:items-center justify-between mb-4 gap-3 flex-wrap">
          <h2 className="font-semibold text-gray-900">Price Trend (30 days)</h2>
          <select className="input sm:w-40" value={selectedCrop} onChange={e => setSelectedCrop(e.target.value)}>
            <option value="">Select crop</option>
            {crops?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(1)}k`} />
              <Tooltip formatter={(v: any) => [`₹${v}`, '']} />
              <Legend />
              <Line type="monotone" dataKey="modal" stroke="#16a34a" strokeWidth={2} dot={false} name="Modal" />
              <Line type="monotone" dataKey="min" stroke="#3b82f6" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Min" />
              <Line type="monotone" dataKey="max" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" dot={false} name="Max" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-40 flex items-center justify-center text-gray-400 text-sm">
            Select a crop to view price trend
          </div>
        )}
      </div> */}

      {/* Latest prices table */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-4">Latest Prices by Mandi</h2>
        {pricesLoading ? <CardSkeleton lines={3} /> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[540px]">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Crop', 'Mandi', 'District', 'Modal Price', 'Min', 'Max', 'Arrival', 'Date'].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium text-xs uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(latestPrices || []).map((p: any, i: number) => (
                  <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-800">{p.crop?.name}</td>
                    <td className="py-3 px-4 text-gray-600">{p.mandi?.name}</td>
                    <td className="py-3 px-4 text-gray-500">{p.mandi?.district}</td>
                    <td className="py-3 px-4 font-semibold text-green-700">{formatCurrency(p.modalPrice)}</td>
                    <td className="py-3 px-4 text-gray-500">{p.minPrice ? formatCurrency(p.minPrice) : '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{p.maxPrice ? formatCurrency(p.maxPrice) : '—'}</td>
                    <td className="py-3 px-4 text-gray-500">{p.arrivalQuantity ? `${p.arrivalQuantity} qtl` : '—'}</td>
                    <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(p.priceDate)}</td>
                  </tr>
                ))}
                {(latestPrices || []).length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-400">No price data found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
