import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { farmerApi, marketApi } from '../../api';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { EmptyState, ErrorState } from '../../components/common/StateComponents';
import { formatCurrency, formatDate, getDecisionColor } from '../../utils';
import { Plus, Wheat, Trash2, ChevronDown, ChevronUp, Pencil, X, Check } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';
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

const emptyForm = {
  cropId: '', quantity: '', soldQuantity: '0', unit: 'quintal', quality: 'UNGRADED',
  expectedPrice: '', location: '', district: '', harvestDate: '',
  storageStatus: 'NOT_STORED', notes: '',
};

export default function FarmerCropsPage() {
  const { t } = useLanguage();
  const qc = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  const districts = ['Ahmedabad', 'Rajkot', 'Surendranagar', 'Bhavnagar', 'Junagadh', 'Anand', 'Surat', 'Vadodara'];

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
      setForm({ ...emptyForm });
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to add crop'),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => farmerApi.updateCrop(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farmerCrops'] });
      qc.invalidateQueries({ queryKey: ['farmerIncome'] });
      toast.success('Crop updated!');
      setEditingId(null);
    },
    onError: (err: any) => toast.error(err.response?.data?.error?.message || 'Failed to update crop'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => farmerApi.deleteCrop(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farmerCrops'] });
      qc.invalidateQueries({ queryKey: ['farmerIncome'] });
      toast.success('Crop removed');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addMutation.mutate({
      ...form,
      quantity: Number(form.quantity),
      soldQuantity: Number(form.soldQuantity) || 0,
      expectedPrice: form.expectedPrice ? Number(form.expectedPrice) : undefined,
    });
  };

  const startEdit = (fc: any) => {
    setEditingId(fc.id);
    setEditForm({
      quantity: String(fc.quantity),
      soldQuantity: String(fc.soldQuantity ?? 0),
      quality: fc.quality,
      expectedPrice: fc.expectedPrice ? String(fc.expectedPrice) : '',
      location: fc.location,
      district: fc.district,
      storageStatus: fc.storageStatus,
      notes: fc.notes || '',
    });
  };

  const handleEditSubmit = (id: string) => {
    updateMutation.mutate({
      id,
      data: {
        quantity: Number(editForm.quantity),
        soldQuantity: Number(editForm.soldQuantity) || 0,
        quality: editForm.quality,
        expectedPrice: editForm.expectedPrice ? Number(editForm.expectedPrice) : undefined,
        location: editForm.location,
        district: editForm.district,
        storageStatus: editForm.storageStatus,
        notes: editForm.notes || undefined,
      },
    });
  };

  if (isLoading) return <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">{t('my_crops')}</h1>
        <button onClick={() => setShowAddForm(!showAddForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('add_crop')}
        </button>
      </div>

      {/* Add Crop Form */}
      {showAddForm && (
        <div className="card border-green-200 bg-green-50/30">
          <h2 className="font-semibold text-gray-800 mb-4">{t('add_new_crop')}</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">{t('crop')} *</label>
              <select className="input" value={form.cropId} onChange={e => setForm({ ...form, cropId: e.target.value })} required>
                <option value="">{t('select_crop')}</option>
                {allCrops?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('quantity_quintals')} *</label>
              <input type="number" className="input" placeholder="100" min="0.1" step="0.1"
                value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div>
              <label className="label">{t('sold_label')} ({t('qtl')})</label>
              <input type="number" className="input" placeholder="0" min="0" step="0.1"
                value={form.soldQuantity} onChange={e => setForm({ ...form, soldQuantity: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('quality_grade')}</label>
              <select className="input" value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value })}>
                {qualityOptions.map(q => <option key={q} value={q}>{q.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('expected_price')} (₹/{t('qtl')})</label>
              <input type="number" className="input" placeholder="7000"
                value={form.expectedPrice} onChange={e => setForm({ ...form, expectedPrice: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('location')} *</label>
              <input type="text" className="input" placeholder={t('village_town')}
                value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} required />
            </div>
            <div>
              <label className="label">{t('district')} *</label>
              <select className="input" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} required>
                <option value="">{t('select_district')}</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('harvest_date')}</label>
              <input type="date" className="input"
                value={form.harvestDate} onChange={e => setForm({ ...form, harvestDate: e.target.value })} />
            </div>
            <div>
              <label className="label">{t('storage_status')}</label>
              <select className="input" value={form.storageStatus} onChange={e => setForm({ ...form, storageStatus: e.target.value })}>
                {storageOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
              </select>
            </div>
            <div className="col-span-2">
              <label className="label">{t('notes')}</label>
              <input type="text" className="input" placeholder={t('optional_notes')}
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={addMutation.isPending} className="btn-primary flex-1 disabled:opacity-50">
                {addMutation.isPending ? t('adding') : t('add_crop')}
              </button>
              <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary flex-1">{t('cancel')}</button>
            </div>
          </form>
        </div>
      )}

      {/* Crops list */}
      {crops?.length === 0 ? (
        <EmptyState title={t('no_crops_title')} description={t('no_crops_desc')}
          action={<button onClick={() => setShowAddForm(true)} className="btn-primary">{t('add_first_crop')}</button>} />
      ) : (
        <div className="space-y-4">
          {crops?.map((fc: any) => (
            <div key={fc.id} className="card hover:shadow-md transition-shadow">
              {/* Card header */}
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
                  <button
                    onClick={() => editingId === fc.id ? setEditingId(null) : startEdit(fc)}
                    className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                    title="Edit crop"
                  >
                    {editingId === fc.id ? <X className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                  </button>
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

              {/* Edit form */}
              {editingId === fc.id ? (
                <div className="mt-4 pt-4 border-t border-blue-100 bg-blue-50/30 rounded-xl p-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Edit Crop Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="label text-xs">{t('quantity_quintals')}</label>
                      <input type="number" className="input" min="0.1" step="0.1"
                        value={editForm.quantity}
                        onChange={e => setEditForm({ ...editForm, quantity: e.target.value })} />
                    </div>
                    <div>
                      <label className="label text-xs">{t('sold_label')} ({t('qtl')})</label>
                      <input type="number" className="input" min="0" step="0.1"
                        value={editForm.soldQuantity}
                        onChange={e => setEditForm({ ...editForm, soldQuantity: e.target.value })} />
                    </div>
                    <div>
                      <label className="label text-xs">{t('quality_grade')}</label>
                      <select className="input" value={editForm.quality}
                        onChange={e => setEditForm({ ...editForm, quality: e.target.value })}>
                        {qualityOptions.map(q => <option key={q} value={q}>{q.replace('_', ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">{t('expected_price')} (₹/{t('qtl')})</label>
                      <input type="number" className="input" min="0"
                        value={editForm.expectedPrice}
                        onChange={e => setEditForm({ ...editForm, expectedPrice: e.target.value })} />
                    </div>
                    <div>
                      <label className="label text-xs">{t('location')}</label>
                      <input type="text" className="input"
                        value={editForm.location}
                        onChange={e => setEditForm({ ...editForm, location: e.target.value })} />
                    </div>
                    <div>
                      <label className="label text-xs">{t('district')}</label>
                      <select className="input" value={editForm.district}
                        onChange={e => setEditForm({ ...editForm, district: e.target.value })}>
                        {districts.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">{t('storage_status')}</label>
                      <select className="input" value={editForm.storageStatus}
                        onChange={e => setEditForm({ ...editForm, storageStatus: e.target.value })}>
                        {storageOptions.map(s => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="label text-xs">{t('notes')}</label>
                      <input type="text" className="input"
                        value={editForm.notes}
                        onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={() => handleEditSubmit(fc.id)}
                      disabled={updateMutation.isPending}
                      className="btn-primary flex items-center gap-1.5 disabled:opacity-50 text-sm px-4 py-2"
                    >
                      <Check className="w-3.5 h-3.5" />
                      {updateMutation.isPending ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary text-sm px-4 py-2">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* Quantity summary */}
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div>
                      <p className="text-xs text-gray-500">{t('quantity_quintals')}</p>
                      <p className="font-semibold">{fc.quantity} {t('qtl')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('sold_label')}</p>
                      <p className="font-semibold text-gray-500">{fc.soldQuantity ?? 0} {t('qtl')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">{t('expected_price')}</p>
                      <p className="font-semibold">{fc.expectedPrice ? formatCurrency(fc.expectedPrice) : '—'}</p>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {expandedId === fc.id && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-3 gap-3 text-sm">
                      <div><span className="text-gray-500">{t('harvest_date_label')}</span> <span className="font-medium">{fc.harvestDate ? formatDate(fc.harvestDate) : '—'}</span></div>
                      <div><span className="text-gray-500">{t('storage_label')}</span> <span className="font-medium">{fc.storageStatus.replace(/_/g, ' ')}</span></div>
                      <div><span className="text-gray-500">{t('added_label')}</span> <span className="font-medium">{formatDate(fc.createdAt)}</span></div>
                      {fc.aiRecommendations?.[0] && (
                        <div className="col-span-3">
                          <span className="text-gray-500">{t('latest_ai_rec')}</span>
                          <span className={`font-semibold px-2 py-0.5 rounded text-xs ${getDecisionColor(fc.aiRecommendations[0].decision)}`}>
                            {fc.aiRecommendations[0].decision.replace(/_/g, ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
