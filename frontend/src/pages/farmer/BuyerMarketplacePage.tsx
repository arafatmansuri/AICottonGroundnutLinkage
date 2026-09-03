import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyerApi, marketApi, farmerApi, transactionApi } from '../../api';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { EmptyState, ErrorState } from '../../components/common/StateComponents';
import { formatCurrency } from '../../utils';
import { ShieldCheck, MapPin, Package, Wheat, Filter, Star, ArrowRight, X, Truck, BadgeCheck } from 'lucide-react';
import toast from 'react-hot-toast';

function VerificationBadge({ status }: { status: string }) {
  if (status === 'VERIFIED') return (
    <span className="badge-verified flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> Verified</span>
  );
  if (status === 'PENDING') return <span className="badge-pending">Pending</span>;
  return <span className="badge-rejected">Rejected</span>;
}

// Simple per-district distance in km (fallback 200km)
const DISTANCE_MAP: Record<string, Record<string, number>> = {
  Ahmedabad: { Rajkot: 216, Surendranagar: 125, Bhavnagar: 170, Anand: 70 },
  Rajkot: { Ahmedabad: 216, Surendranagar: 100, Bhavnagar: 160 },
  Surendranagar: { Ahmedabad: 125, Rajkot: 100, Bhavnagar: 130 },
  Bhavnagar: { Ahmedabad: 170, Rajkot: 160 },
  Anand: { Ahmedabad: 70 },
};

function estimateTransport(fromDistrict: string, toDistrict: string, qty: number) {
  if (fromDistrict === toDistrict) return 0;
  const d = DISTANCE_MAP[fromDistrict]?.[toDistrict] ?? DISTANCE_MAP[toDistrict]?.[fromDistrict] ?? 200;
  return d * 2 * qty; // ₹2/km/qtl
}

export default function BuyerMarketplacePage() {
  const qc = useQueryClient();
  const [filters, setFilters] = useState({
    cropId: '', district: '', verifiedOnly: false, minPrice: '', maxPrice: '', page: 1, limit: 20,
  });
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [txForm, setTxForm] = useState({ farmerCropId: '', quantity: '' });

  const { data: crops } = useQuery({
    queryKey: ['allCrops'],
    queryFn: () => marketApi.getCrops().then(r => r.data.data),
  });

  const { data: myCrops } = useQuery({
    queryKey: ['farmerCrops'],
    queryFn: () => farmerApi.getCrops().then(r => r.data.data),
  });

  const { data: offersData, isLoading, error, refetch } = useQuery({
    queryKey: ['buyerMarketplace', filters],
    queryFn: () => buyerApi.getMarketplace({
      cropId: filters.cropId || undefined,
      district: filters.district || undefined,
      verifiedOnly: filters.verifiedOnly || undefined,
      minPrice: filters.minPrice || undefined,
      maxPrice: filters.maxPrice || undefined,
      page: filters.page,
      limit: filters.limit,
    }).then(r => r.data.data),
  });

  const createTxMutation = useMutation({
    mutationFn: (data: any) => transactionApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['farmerCrops'] });
      qc.invalidateQueries({ queryKey: ['farmerTransactions'] });
      toast.success('Offer sent to buyer! Track it in Transactions.');
      setSelectedOffer(null);
      setTxForm({ farmerCropId: '', quantity: '' });
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Failed to send offer'),
  });

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!txForm.farmerCropId || !txForm.quantity) return;
    createTxMutation.mutate({
      buyerOfferId: selectedOffer.id,
      farmerCropId: txForm.farmerCropId,
      quantity: Number(txForm.quantity),
    });
  };

  // Active crops that match selected offer's crop
  const matchingCrops = selectedOffer
    ? (myCrops || []).filter((c: any) => c.cropId === selectedOffer.cropId && c.isActive && c.availableQuantity > 0)
    : [];

  const qty = Number(txForm.quantity) || 0;
  const farmerCrop = myCrops?.find((c: any) => c.id === txForm.farmerCropId);
  const farmerDistrict = farmerCrop?.district || '';
  const transport = selectedOffer ? estimateTransport(farmerDistrict, selectedOffer.district, qty) : 0;
  const netRealization = selectedOffer ? selectedOffer.offeredPrice - (qty > 0 ? transport / qty : 0) : 0;

  if (isLoading) return <div className="space-y-4">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Buyer Marketplace</h1>
          <p className="text-sm text-gray-500">{offersData?.total || 0} active purchase offers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm text-gray-700">Filter Buyers</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select className="input text-sm" value={filters.cropId}
            onChange={e => setFilters({ ...filters, cropId: e.target.value, page: 1 })}>
            <option value="">All Crops</option>
            {crops?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="text" className="input text-sm" placeholder="District"
            value={filters.district} onChange={e => setFilters({ ...filters, district: e.target.value, page: 1 })} />
          <input type="number" className="input text-sm" placeholder="Min Price (₹/qtl)"
            value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} />
          <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
            <input type="checkbox" checked={filters.verifiedOnly}
              onChange={e => setFilters({ ...filters, verifiedOnly: e.target.checked })} />
            <span className="text-sm text-gray-700">Verified only</span>
          </label>
        </div>
      </div>

      {/* Offers */}
      {offersData?.offers?.length === 0 ? (
        <EmptyState title="No buyers match your filters" description="Try adjusting your filters or check back later for new offers." />
      ) : (
        <div className="grid gap-4">
          {offersData?.offers?.map((offer: any) => (
            <div key={offer.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-lg">{offer.buyerProfile?.companyName}</h3>
                    <VerificationBadge status={offer.buyerProfile?.verificationStatus} />
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{offer.district}</span>
                    <span className="flex items-center gap-1"><Wheat className="w-3.5 h-3.5" />{offer.crop?.name}</span>
                    <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />{offer.minQuantity}–{offer.maxQuantity} qtl</span>
                    {offer.buyerProfile?.rating > 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-current" />{offer.buyerProfile.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(offer.offeredPrice)}</p>
                  <p className="text-xs text-gray-400">per quintal</p>
                  <p className="text-xs text-gray-500 mt-1">Grade: {offer.quality.replace('_', ' ')}</p>
                </div>
              </div>

              {offer.notes && (
                <p className="text-sm text-gray-500 mt-2 italic">"{offer.notes.replace('[SEED] ', '')}"</p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-50 flex gap-3">
                <button
                  onClick={() => { setSelectedOffer(offer); setTxForm({ farmerCropId: '', quantity: '' }); }}
                  className="btn-primary text-sm flex-1 flex items-center justify-center gap-2"
                  disabled={offer.buyerProfile?.verificationStatus !== 'VERIFIED'}
                >
                  <ArrowRight className="w-4 h-4" />
                  {offer.buyerProfile?.verificationStatus === 'VERIFIED' ? 'Send Offer' : 'Buyer Not Verified'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {offersData?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50">Previous</button>
          <span className="text-sm text-gray-500">Page {filters.page} of {offersData.totalPages}</span>
          <button disabled={filters.page === offersData.totalPages}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50">Next</button>
        </div>
      )}

      {/* Send Offer Modal */}
      {selectedOffer && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4" onClick={() => setSelectedOffer(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold text-gray-900">Send Offer to Buyer</h2>
                <p className="text-sm text-gray-500">{selectedOffer.buyerProfile?.companyName}</p>
              </div>
              <button onClick={() => setSelectedOffer(null)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Offer details */}
            <div className="bg-green-50 rounded-xl p-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Buyer's Price</span>
                <span className="font-bold text-green-700 text-lg">{formatCurrency(selectedOffer.offeredPrice)}/qtl</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Accepts</span>
                <span>{selectedOffer.minQuantity}–{selectedOffer.maxQuantity} qtl · {selectedOffer.quality.replace('_',' ')}</span>
              </div>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="label">Select Your Crop *</label>
                {matchingCrops.length === 0 ? (
                  <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-700">
                    No matching active crops found for <strong>{selectedOffer.crop?.name}</strong>.
                    Add a crop first from the My Crops page.
                  </div>
                ) : (
                  <select className="input" required value={txForm.farmerCropId}
                    onChange={e => setTxForm({ ...txForm, farmerCropId: e.target.value })}>
                    <option value="">Select crop batch</option>
                    {matchingCrops.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.crop?.name} · {c.quality?.replace('_',' ')} · {c.availableQuantity} qtl available (₹{c.expectedPrice}/qtl expected)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {txForm.farmerCropId && (
                <div>
                  <label className="label">Quantity to Sell (qtl) *</label>
                  <input type="number" className="input" required
                    min={selectedOffer.minQuantity} max={Math.min(selectedOffer.maxQuantity, farmerCrop?.availableQuantity || 9999)}
                    placeholder={`${selectedOffer.minQuantity}–${selectedOffer.maxQuantity} qtl`}
                    value={txForm.quantity} onChange={e => setTxForm({ ...txForm, quantity: e.target.value })} />
                  <p className="text-xs text-gray-400 mt-1">Available: {farmerCrop?.availableQuantity} qtl</p>
                </div>
              )}

              {/* Price breakdown */}
              {qty > 0 && txForm.farmerCropId && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                  <p className="font-medium text-gray-700 mb-1 flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-green-600" /> Price Breakdown
                  </p>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Agreed Price</span>
                    <span className="font-medium">{formatCurrency(selectedOffer.offeredPrice)}/qtl</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500 flex items-center gap-1"><Truck className="w-3.5 h-3.5" /> Est. Transport ({qty} qtl)</span>
                    <span className="text-red-600">−{formatCurrency(Math.round(transport / qty))}/qtl</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-100 pt-2">
                    <span className="font-semibold text-gray-800">Net Realization</span>
                    <span className="font-bold text-green-700 text-base">{formatCurrency(Math.round(netRealization))}/qtl</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Total ({qty} qtl)</span>
                    <span className="font-bold text-green-700">{formatCurrency(Math.round(netRealization * qty))}</span>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <button type="submit"
                  disabled={createTxMutation.isPending || matchingCrops.length === 0 || !txForm.farmerCropId || !txForm.quantity}
                  className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2">
                  {createTxMutation.isPending ? 'Sending…' : <>Send Offer <ArrowRight className="w-4 h-4" /></>}
                </button>
                <button type="button" onClick={() => setSelectedOffer(null)} className="btn-secondary flex-1">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
