import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Search, Wheat, MapPin, Phone, Mail, Star,
  Send, ChevronLeft, ChevronRight, X, User,
} from 'lucide-react';
import { buyerApi } from '../../api';
import type { FarmerCropListing } from '../../types';
import { formatCurrency } from '../../utils';
import toast from 'react-hot-toast';

const QUALITY_LABELS: Record<string, string> = {
  GRADE_A: 'Grade A',
  GRADE_B: 'Grade B',
  GRADE_C: 'Grade C',
  UNGRADED: 'Ungraded',
};

const QUALITY_COLORS: Record<string, string> = {
  GRADE_A: 'bg-green-100 text-green-700',
  GRADE_B: 'bg-blue-100 text-blue-700',
  GRADE_C: 'bg-amber-100 text-amber-700',
  UNGRADED: 'bg-gray-100 text-gray-600',
};

export default function BuyerCropSearchPage() {
  const qc = useQueryClient();

  // Search filters
  const [cropName, setCropName] = useState('');
  const [district, setDistrict] = useState('');
  const [quality, setQuality] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [page, setPage] = useState(1);

  // Applied search state (triggered on submit)
  const [applied, setApplied] = useState({
    cropName: '', district: '', quality: '', minPrice: '', maxPrice: '',
  });

  // Selected crop for detail / interest modal
  const [selected, setSelected] = useState<FarmerCropListing | null>(null);
  const [interestMsg, setInterestMsg] = useState('');
  const [showContactFor, setShowContactFor] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['buyerCropSearch', applied, page],
    queryFn: () =>
      buyerApi.searchCrops({
        cropName: applied.cropName || undefined,
        district: applied.district || undefined,
        quality: applied.quality || undefined,
        minPrice: applied.minPrice ? Number(applied.minPrice) : undefined,
        maxPrice: applied.maxPrice ? Number(applied.maxPrice) : undefined,
        page,
        limit: 12,
      }).then(r => r.data.data),
  });

  const sendInterestMutation = useMutation({
    mutationFn: ({ id, message }: { id: string; message?: string }) =>
      buyerApi.sendInterest(id, message),
    onSuccess: () => {
      toast.success('Interest notification sent to farmer!');
      qc.invalidateQueries({ queryKey: ['buyerInterests'] });
      setSelected(null);
      setInterestMsg('');
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || 'Failed to send interest';
      toast.error(msg);
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setApplied({ cropName, district, quality, minPrice, maxPrice });
    setPage(1);
  };

  const clearFilters = () => {
    setCropName(''); setDistrict(''); setQuality('');
    setMinPrice(''); setMaxPrice('');
    setApplied({ cropName: '', district: '', quality: '', minPrice: '', maxPrice: '' });
    setPage(1);
  };

  const crops = data?.crops ?? [];
  const totalPages = data?.totalPages ?? 1;
  const total = data?.total ?? 0;

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Browse Crops</h1>
        <p className="text-sm text-gray-500 mt-1">Search available crops from farmers and send interest notifications.</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Crop Name</label>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Cotton, Groundnut…"
              value={cropName}
              onChange={e => setCropName(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>District</label>
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Ahmedabad"
              value={district}
              onChange={e => setDistrict(e.target.value)}
            />
          </div>
          <div>
            <label className={labelCls}>Quality Grade</label>
            <select
              className={inputCls}
              value={quality}
              onChange={e => setQuality(e.target.value)}
            >
              <option value="">All Grades</option>
              <option value="GRADE_A">Grade A</option>
              <option value="GRADE_B">Grade B</option>
              <option value="GRADE_C">Grade C</option>
              <option value="UNGRADED">Ungraded</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Min Price (₹/qtl)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="0"
              value={minPrice}
              onChange={e => setMinPrice(e.target.value)}
              min={0}
            />
          </div>
          <div>
            <label className={labelCls}>Max Price (₹/qtl)</label>
            <input
              type="number"
              className={inputCls}
              placeholder="No limit"
              value={maxPrice}
              onChange={e => setMaxPrice(e.target.value)}
              min={0}
            />
          </div>
          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
            >
              <Search className="w-4 h-4" /> Search
            </button>
            <button
              type="button"
              onClick={clearFilters}
              className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-500"
              title="Clear filters"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Results */}
      <div>
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-100 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : crops.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
            <Wheat className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No crops found</p>
            <p className="text-gray-400 text-sm mt-1">Try adjusting your search filters.</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-500 mb-3">
              Showing {crops.length} of {total} results
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {crops.map((crop: FarmerCropListing) => (
                <div
                  key={crop.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Crop header */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{crop.crop.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {crop.district}
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${QUALITY_COLORS[crop.quality] ?? 'bg-gray-100 text-gray-600'}`}>
                      {QUALITY_LABELS[crop.quality] ?? crop.quality}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5 text-sm text-gray-600 flex-1">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Quantity</span>
                      <span className="font-medium text-gray-800">{crop.quantity} {crop.unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Expected Price</span>
                      <span className="font-medium text-gray-800">
                        {crop.expectedPrice ? `${formatCurrency(crop.expectedPrice)}/qtl` : 'Negotiable'}
                      </span>
                    </div>
                    {crop.qualityAssessments?.[0] && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">AI Grade</span>
                        <span className="font-medium text-green-700 flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {QUALITY_LABELS[crop.qualityAssessments[0].estimatedGrade] ?? crop.qualityAssessments[0].estimatedGrade}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Farmer</span>
                      <span className="font-medium text-gray-800">{crop.farmerProfile.name}</span>
                    </div>
                  </div>

                  {/* Farmer contact */}
                  {showContactFor === crop.id ? (
                    <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-100 space-y-1">
                      <p className="text-xs font-semibold text-green-700 mb-1.5 flex items-center gap-1">
                        <User className="w-3 h-3" /> Farmer Contact
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-700">
                        <Mail className="w-3 h-3 text-gray-400" />
                        {crop.farmerProfile.user.email}
                      </div>
                      {crop.farmerProfile.user.phone && (
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <Phone className="w-3 h-3 text-gray-400" />
                          {crop.farmerProfile.user.phone}
                        </div>
                      )}
                      {crop.farmerProfile.village && (
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <MapPin className="w-3 h-3 text-gray-400" />
                          {crop.farmerProfile.village}, {crop.farmerProfile.district}
                        </div>
                      )}
                      <button
                        onClick={() => setShowContactFor(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 mt-1"
                      >
                        Hide contact
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowContactFor(crop.id)}
                      className="mt-3 w-full flex items-center justify-center gap-2 border border-gray-200 hover:border-green-400 hover:text-green-700 text-gray-600 px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                    >
                      <Phone className="w-3.5 h-3.5" /> Show Farmer Contact
                    </button>
                  )}

                  {/* Send interest */}
                  <button
                    onClick={() => { setSelected(crop); setInterestMsg(''); }}
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-xl text-xs font-medium transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" /> Send Interest
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-xl border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Interest Modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900">Send Interest Notification</h3>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-xl">
              <p className="text-sm font-medium text-gray-800">{selected.crop.name}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {selected.quantity} {selected.unit} · {selected.district} · Farmer: {selected.farmerProfile.name}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Message to Farmer (optional)
              </label>
              <textarea
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="e.g. I'm interested in purchasing your cotton crop. Can we discuss pricing?"
                value={interestMsg}
                onChange={e => setInterestMsg(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-gray-400 mt-0.5 text-right">{interestMsg.length}/500</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setSelected(null)}
                className="flex-1 border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => sendInterestMutation.mutate({ id: selected.id, message: interestMsg || undefined })}
                disabled={sendInterestMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                <Send className="w-4 h-4" />
                {sendInterestMutation.isPending ? 'Sending…' : 'Send Notification'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
