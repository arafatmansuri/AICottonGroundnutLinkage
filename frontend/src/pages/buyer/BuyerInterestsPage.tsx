import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Wheat, MapPin, Phone, Mail, Calendar, Bell, User,
  MessageSquare, Filter, X, ArrowUpDown, CheckCircle2,
} from 'lucide-react';
import { buyerApi } from '../../api';
import type { CropInterestRecord } from '../../types';
import { formatCurrency } from '../../utils';
import { Link } from 'react-router-dom';

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

type SortKey = 'newest' | 'oldest' | 'crop_az' | 'price_high' | 'price_low';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function BuyerInterestsPage() {
  // ── Filter state ─────────────────────────────────────────────────────────
  const [cropFilter, setCropFilter]       = useState('');
  const [qualityFilter, setQualityFilter] = useState('');
  const [sortKey, setSortKey]             = useState<SortKey>('newest');
  const [filtersOpen, setFiltersOpen]     = useState(false);

  const { data: interests, isLoading } = useQuery({
    queryKey: ['buyerInterests'],
    queryFn: () => buyerApi.getInterests().then(r => r.data.data),
  });

  // ── Client-side filter + sort ─────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list: CropInterestRecord[] = (interests as CropInterestRecord[]) ?? [];

    if (cropFilter.trim()) {
      const q = cropFilter.trim().toLowerCase();
      list = list.filter(i =>
        i.farmerCrop.crop.name.toLowerCase().includes(q) ||
        i.farmerCrop.district.toLowerCase().includes(q) ||
        i.farmerCrop.farmerProfile.name.toLowerCase().includes(q),
      );
    }

    if (qualityFilter) {
      list = list.filter(i => i.farmerCrop.quality === qualityFilter);
    }

    switch (sortKey) {
      case 'oldest':     list = [...list].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()); break;
      case 'crop_az':    list = [...list].sort((a, b) => a.farmerCrop.crop.name.localeCompare(b.farmerCrop.crop.name));      break;
      case 'price_high': list = [...list].sort((a, b) => (b.farmerCrop.expectedPrice ?? 0) - (a.farmerCrop.expectedPrice ?? 0)); break;
      case 'price_low':  list = [...list].sort((a, b) => (a.farmerCrop.expectedPrice ?? 0) - (b.farmerCrop.expectedPrice ?? 0)); break;
      default:           list = [...list].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()); break;
    }

    return list;
  }, [interests, cropFilter, qualityFilter, sortKey]);

  const hasActiveFilters = cropFilter || qualityFilter || sortKey !== 'newest';

  const clearFilters = () => {
    setCropFilter('');
    setQualityFilter('');
    setSortKey('newest');
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';

  return (
    <div className="space-y-5 max-w-4xl">
      {/* ── Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Interests</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crops you have sent interest notifications to.
          </p>
        </div>
        <Link
          to="/buyer/crops"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0"
        >
          <Wheat className="w-4 h-4" /> Browse More Crops
        </Link>
      </div>

      {/* ── Summary strip ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bell className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xl font-bold text-gray-900">{(interests as any[])?.length ?? 0}</p>
            <p className="text-xs text-gray-500">Total sent</p>
          </div>
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setFiltersOpen(o => !o)}
          className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-colors ${
            filtersOpen || hasActiveFilters
              ? 'border-green-400 bg-green-50 text-green-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4" />
          Filter &amp; Sort
          {hasActiveFilters && (
            <span className="w-2 h-2 bg-green-500 rounded-full" />
          )}
        </button>
      </div>

      {/* ── Filter panel ── */}
      {filtersOpen && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Crop / farmer / district search */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Search crop, farmer, district</label>
              <div className="relative">
                <input
                  type="text"
                  className={inputCls}
                  placeholder="e.g. Cotton, Rajkot…"
                  value={cropFilter}
                  onChange={e => setCropFilter(e.target.value)}
                />
                {cropFilter && (
                  <button
                    onClick={() => setCropFilter('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Quality Grade</label>
              <select
                className={inputCls}
                value={qualityFilter}
                onChange={e => setQualityFilter(e.target.value)}
              >
                <option value="">All Grades</option>
                <option value="GRADE_A">Grade A</option>
                <option value="GRADE_B">Grade B</option>
                <option value="GRADE_C">Grade C</option>
                <option value="UNGRADED">Ungraded</option>
              </select>
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                <ArrowUpDown className="w-3 h-3" /> Sort by
              </label>
              <select
                className={inputCls}
                value={sortKey}
                onChange={e => setSortKey(e.target.value as SortKey)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="crop_az">Crop Name A–Z</option>
                <option value="price_high">Price: High → Low</option>
                <option value="price_low">Price: Low → High</option>
              </select>
            </div>
          </div>

          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-gray-400">
                Showing {filtered.length} of {(interests as any[])?.length ?? 0} interests
              </p>
              <button
                onClick={clearFilters}
                className="text-xs text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── List ── */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="w-12 h-12 bg-gray-200 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-3 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          {hasActiveFilters ? (
            <>
              <p className="text-gray-500 font-medium">No results match your filters</p>
              <button onClick={clearFilters} className="mt-3 text-sm text-green-600 hover:underline font-medium">
                Clear filters
              </button>
            </>
          ) : (
            <>
              <p className="text-gray-500 font-medium">No interests sent yet</p>
              <p className="text-gray-400 text-sm mt-1">Browse crops and send interest notifications to farmers.</p>
              <Link
                to="/buyer/crops"
                className="mt-4 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
              >
                <Wheat className="w-4 h-4" /> Browse Crops
              </Link>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((interest: CropInterestRecord) => {
            const fc = interest.farmerCrop;
            return (
              <div
                key={interest.id}
                className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Crop icon */}
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Wheat className="w-6 h-6 text-green-600" />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    {/* Title row */}
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-base">{fc.crop.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${QUALITY_COLORS[fc.quality] ?? 'bg-gray-100 text-gray-600'}`}>
                        {QUALITY_LABELS[fc.quality] ?? fc.quality}
                      </span>
                      {/* ── Notification sent badge ── */}
                      <span className="ml-auto flex-shrink-0 flex items-center gap-1 text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full font-medium">
                        <CheckCircle2 className="w-3 h-3" /> Notification Sent
                      </span>
                    </div>

                    {/* Crop detail grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-1.5 text-sm mb-3">
                      <div>
                        <span className="text-gray-400 text-xs">Quantity</span>
                        <p className="font-medium text-gray-800">{fc.quantity} {fc.unit}</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">Expected Price</span>
                        <p className="font-medium text-gray-800">
                          {fc.expectedPrice ? `${formatCurrency(fc.expectedPrice)}/qtl` : 'Negotiable'}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">Location</span>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-gray-400" /> {fc.district}
                        </p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-xs">Sent On</span>
                        <p className="font-medium text-gray-800 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-400" /> {formatDate(interest.createdAt)}
                        </p>
                      </div>
                    </div>

                    {/* Message */}
                    {interest.message && (
                      <div className="mb-3 flex items-start gap-2 p-2.5 bg-gray-50 rounded-xl">
                        <MessageSquare className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-gray-600 italic">"{interest.message}"</p>
                      </div>
                    )}

                    {/* Farmer contact */}
                    <div className="p-3 bg-green-50 rounded-xl border border-green-100">
                      <p className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                        <User className="w-3 h-3" /> Farmer Contact Details
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1.5 gap-x-4">
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <User className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <span className="font-medium">{fc.farmerProfile.name}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-700">
                          <Mail className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          <a href={`mailto:${fc.farmerProfile.user.email}`}
                            className="hover:text-green-700 hover:underline truncate">
                            {fc.farmerProfile.user.email}
                          </a>
                        </div>
                        {fc.farmerProfile.user.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-700">
                            <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <a href={`tel:${fc.farmerProfile.user.phone}`}
                              className="hover:text-green-700 hover:underline">
                              {fc.farmerProfile.user.phone}
                            </a>
                          </div>
                        )}
                        {fc.farmerProfile.village && (
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <MapPin className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            {fc.farmerProfile.village}, {fc.farmerProfile.district}, {fc.farmerProfile.state}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
