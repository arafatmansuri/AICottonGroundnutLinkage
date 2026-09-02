import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyerApi, marketApi } from '../../api';
import { formatCurrency, formatDate } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { EmptyState } from '../../components/common/StateComponents';
import { Plus } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BuyerDashboard() {
  const qc = useQueryClient();
  const [showOfferForm, setShowOfferForm] = useState(false);
  const [form, setForm] = useState({
    cropId: '', offeredPrice: '', minQuantity: '', maxQuantity: '',
    quality: 'GRADE_B', district: '', state: 'Gujarat', notes: '', expiresAt: '',
  });

  const { data: profile } = useQuery({
    queryKey: ['buyerProfile'],
    queryFn: () => buyerApi.getProfile().then(r => r.data.data),
  });

  const { data: crops } = useQuery({
    queryKey: ['allCrops'],
    queryFn: () => marketApi.getCrops().then(r => r.data.data),
  });

  const { data: offers, isLoading: offersLoading } = useQuery({
    queryKey: ['buyerOffers'],
    queryFn: () => buyerApi.getOffers().then(r => r.data.data),
  });

  const createOffer = useMutation({
    mutationFn: (data: any) => buyerApi.createOffer(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buyerOffers'] });
      toast.success('Offer published successfully!');
      setShowOfferForm(false);
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Failed to create offer'),
  });

  const toggleOffer = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      buyerApi.updateOffer(id, { isActive }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['buyerOffers'] });
      toast.success('Offer updated');
    },
  });

  const districts = ['Ahmedabad', 'Rajkot', 'Surendranagar', 'Bhavnagar', 'Junagadh', 'Anand', 'Surat', 'Vadodara'];

  const handleCreateOffer = (e: React.FormEvent) => {
    e.preventDefault();
    createOffer.mutate({
      ...form,
      offeredPrice: Number(form.offeredPrice),
      minQuantity: Number(form.minQuantity),
      maxQuantity: Number(form.maxQuantity),
    });
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile?.companyName || 'Buyer Dashboard'}</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
              profile?.verificationStatus === 'VERIFIED' ? 'badge-verified' : 'badge-pending'
            }`}>
              {profile?.verificationStatus || 'PENDING'}
            </span>
            {profile?.verificationStatus !== 'VERIFIED' && (
              <span className="text-xs text-amber-600">Verification pending — visible to farmers once verified</span>
            )}
          </div>
        </div>
        <button onClick={() => setShowOfferForm(!showOfferForm)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> Post Offer
        </button>
      </div>

      {showOfferForm && (
        <div className="card border-green-200 bg-green-50/30">
          <h2 className="font-semibold text-gray-800 mb-4">Post Purchase Offer</h2>
          <form onSubmit={handleCreateOffer} className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Crop *</label>
              <select className="input" value={form.cropId} onChange={e => setForm({ ...form, cropId: e.target.value })} required>
                <option value="">Select crop</option>
                {crops?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Offered Price (₹/qtl) *</label>
              <input type="number" className="input" placeholder="7500" min="1"
                value={form.offeredPrice} onChange={e => setForm({ ...form, offeredPrice: e.target.value })} required />
            </div>
            <div>
              <label className="label">Min Quantity (qtl) *</label>
              <input type="number" className="input" placeholder="50" min="1"
                value={form.minQuantity} onChange={e => setForm({ ...form, minQuantity: e.target.value })} required />
            </div>
            <div>
              <label className="label">Max Quantity (qtl) *</label>
              <input type="number" className="input" placeholder="200" min="1"
                value={form.maxQuantity} onChange={e => setForm({ ...form, maxQuantity: e.target.value })} required />
            </div>
            <div>
              <label className="label">Quality</label>
              <select className="input" value={form.quality} onChange={e => setForm({ ...form, quality: e.target.value })}>
                {['GRADE_A', 'GRADE_B', 'GRADE_C', 'UNGRADED'].map(q => <option key={q} value={q}>{q.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Your District *</label>
              <select className="input" value={form.district} onChange={e => setForm({ ...form, district: e.target.value })} required>
                <option value="">Select</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Offer Expiry</label>
              <input type="date" className="input" value={form.expiresAt}
                onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
            </div>
            <div>
              <label className="label">Notes</label>
              <input type="text" className="input" placeholder="Optional"
                value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="col-span-2 flex gap-3">
              <button type="submit" disabled={createOffer.isPending} className="btn-primary flex-1 disabled:opacity-50">
                {createOffer.isPending ? 'Publishing...' : 'Publish Offer'}
              </button>
              <button type="button" onClick={() => setShowOfferForm(false)} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* My offers */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-3">My Purchase Offers</h2>
        {offersLoading ? <CardSkeleton /> : offers?.length === 0 ? (
          <EmptyState title="No offers yet" description="Post your first purchase offer to connect with farmers." />
        ) : (
          <div className="space-y-4">
            {offers?.map((offer: any) => (
              <div key={offer.id} className="card hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-gray-900">{offer.crop?.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${offer.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {offer.isActive ? 'Active' : 'Paused'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">{offer.district}, {offer.state} • {offer.quality.replace('_', ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-green-700">{formatCurrency(offer.offeredPrice)}</p>
                    <p className="text-xs text-gray-400">{offer.minQuantity}–{offer.maxQuantity} qtl</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    Posted {formatDate(offer.createdAt)}
                    {offer.expiresAt && ` • Expires ${formatDate(offer.expiresAt)}`}
                  </span>
                  <button
                    onClick={() => toggleOffer.mutate({ id: offer.id, isActive: !offer.isActive })}
                    className={`text-xs px-3 py-1 rounded-lg ${offer.isActive ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                  >
                    {offer.isActive ? 'Pause' : 'Activate'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
