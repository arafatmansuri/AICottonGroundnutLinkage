import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmerApi, marketApi } from '../../api';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { EmptyState, ErrorState } from '../../components/common/StateComponents';
import { formatCurrency, formatDate, getDecisionColor } from '../../utils';
import { Plus, Wheat, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';

const qualityOptions = ['GRADE_A', 'GRADE_B', 'GRADE_C', 'UNGRADED'];
const storageOptions = ['NOT_STORED', 'IN_STORAGE', 'PARTIALLY_STORED'];

function QualityBadge({ quality }: { quality: string }) {
  const map: Record<string, string> = {
    GRADE_A: 'bg-green-100 text-green-700',
    GRADE_B: 'bg-blue-100 text-blue-700',
    GRADE_C: 'bg-yellow-100 text-yellow-700',
    UNGRADED: 'bg-gray-100 text-gray-600',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[quality] || map.UNGRADED}`}>
      {quality.replace('_', ' ')}
    </span>
  );
}

export default function FarmerCropsPage() {
  const qc = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState({
    cropId: '', totalQuantity: '', unit: 'quintal', quality: 'UNGRADED',
    expectedPrice: '', location: '', district: '', harvestDate: '',
    storageStatus: 'NOT_STORED', notes: '',
  });

  const { data: crops, isLoading, error, refetch } = useQuery({
    queryKey: ['farmerCrops'],
    queryFn: () => farmerApi.getCrops().then(r => r.data.data),
  });

  const { data: allCrops } = useQuery({
    queryKey: ['allCrops'],
    queryFn: () => marketApi.getCrops().then(r => r.data.data),
  });

  const addMutation = useMutation({
    mutationFn: (data: any) => farmerApi.addCrop(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farmerCrops'] });
      qc.invalidateQueries({ queryKey: ['farmerIncome'] });
      toast.success('Crop added successfully!');
      setShowAddForm(false);
      setForm({ cropId: '', totalQuantity: '', unit: 'quintal', quality: 'UNGRADED',
        expectedPrice: '', location: '', district: '', harvestDate: '',
        storageStatus: 'NOT_STORED', notes: '' });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to add crop'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => farmerApi.deleteCrop(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farmerCrops'] });
      toast.success('Crop removed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      ...form,
      totalQuantity: Number(form.totalQuantity),
      expectedPrice: form.expectedPrice ? Number(form.expectedPrice) : undefined,
    });
  };

  const districts = ['Ahmedabad', 'Rajkot', 'Surendranagar', 'Bhavnagar', 'Junagadh', 'Anand', 'Surat', 'Vadodara'];

  if (isLoading) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Crops</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add Crop
        </button>
      </div>

      {/* Add Crop Form */}
      {showAddForm && (
        <div className="card border-green-200 bg-green-50/30">
          <h2 className="font-semibold text-gray-800 mb-4">Add New Crop</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Crop *</label>
              <select className="input" value={form.cropId} onChange={e => setForm({ ...form, cropId: e.target.value })} required>
                <option value="">Select crop</option>
                {allCrops?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Quantity (quintals) *</label>
              <input type="number" className="input" placeholder="100" min="0.1" step="0.1"
                value={form.totalQuantity} onChange={e => setForm({ ...form, totalQuantity: e.target.value })} required />
            </div>
            <div>
              <label className="label">Quality Grade</label>
              <select className="input" value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value })}>
                {qualityOptions.map(q => <option key={q} value={q}>{q.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Expected Price (₹/qtl)</label>
              <input type="number" className="input" placeholder="7000"
                value={form.expectedPrice} onChange={e => setForm({ ...form, expectedPrice: e.target.value })} />
            </div>
            <div>
              <label className="label">Location *</label>
              <input type="text" className="input" placeholder="Village/Town"
                value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
            </div>
            <div>
              <label className="label">District *</label>
              <select className="input" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} required>
                <option value="">Select district</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Harvest Date</label>
              <input type="date" className="input"
                value={form.harvestDate} onChange={e => setForm({ ...form, harvestDate: e.target.value })} />
            </div>
            <div>
              <label className="label">Storage Status</label>
              <select className="input" value={form.storageStatus} onChange={e => setForm({ ...form, storageStatus: e.target.value })}>
                {storageOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">Notes</label>
              <input type="text" className="input" placeholder="Optional notes"
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={addMutation.isPending} className="btn-primary flex-1 disabled:opacity-50">
                {addMutation.isPending ? 'Adding...' : 'Add Crop'}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Crops list */}
      {crops?.length === 0 ? (
        <EmptyState title="No crops added yet" description="Add your first crop to start getting market intelligence and AI recommendations."
          action={<button onClick={() => setShowAddForm(true)} className="btn-primary">Add Your First Crop</button>} />
      ) : (
        <div className="space-y-4">
          {crops?.map((fc: any) => (
            <div key={fc.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center">
                    <Wheat className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{fc.crop?.name}</h3>
                    <p className="text-sm text-gray-500">{fc.location}, {fc.district}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <QualityBadge quality={fc.quality} />
                  <button onClick={() => deleteMutation.mutate(fc.id)}
                    className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => setExpandedId(expandedId === fc.id ? null : fc.id)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg">
                    {expandedId === fc.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-4">
                <div>
                  <p className="text-xs text-gray-500">Total</p>
                  <p className="font-semibold">{fc.totalQuantity} qtl</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Available</p>
                  <p className="font-semibold text-green-600">{fc.availableQuantity} qtl</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Sold</p>
                  <p className="font-semibold text-gray-500">{fc.soldQuantity} qtl</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Expected Price</p>
                  <p className="font-semibold">{fc.expectedPrice ? formatCurrency(fc.expectedPrice) : '—'}</p>
                </div>
              </div>

              {expandedId === fc.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-sm">
                  <div><span className="text-gray-500">Harvest Date:</span> <span className="font-medium">{fc.harvestDate ? formatDate(fc.harvestDate) : '—'}</span></div>
                  <div><span className="text-gray-500">Storage:</span> <span className="font-medium">{fc.storageStatus.replace(/_/g, ' ')}</span></div>
                  <div><span className="text-gray-500">Added:</span> <span className="font-medium">{formatDate(fc.createdAt)}</span></div>
                  {fc.aiRecommendations?.[0] && (
                    <div className="col-span-3">
                      <span className="text-gray-500">Latest AI Rec: </span>
                      <span className={`font-semibold px-2 py-0.5 rounded text-xs ${getDecisionColor(fc.aiRecommendations[0].decision)}`}>
                        {fc.aiRecommendations[0].decision.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
