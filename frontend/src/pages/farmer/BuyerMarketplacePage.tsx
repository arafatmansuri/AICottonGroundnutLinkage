import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buyerApi, marketApi } from '../../api';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { EmptyState, ErrorState } from '../../components/common/StateComponents';
import { formatCurrency, getRelativeTime } from '../../utils';
import {
  MapPin, Package, Wheat, Filter, Star, ShieldCheck, Phone,
  Mail, X, ChevronRight, Building2, BadgeCheck, Clock, Hash,
} from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

const QUALITY_LABEL: Record<string, string> = {
  GRADE_A: 'Grade A', GRADE_B: 'Grade B', GRADE_C: 'Grade C', UNGRADED: 'Ungraded',
};
const QUALITY_COLOR: Record<string, string> = {
  GRADE_A: 'bg-green-100 text-green-700',
  GRADE_B: 'bg-blue-100 text-blue-700',
  GRADE_C: 'bg-amber-100 text-amber-700',
  UNGRADED: 'bg-gray-100 text-gray-600',
};

export default function BuyerMarketplacePage() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState({
    cropId: '', district: '', quality: '', verifiedOnly: false, minPrice: '', page: 1, limit: 20,
  });
  const [selected, setSelected] = useState<any>(null);

  const { data: crops } = useQuery({
    queryKey: ['allCrops'],
    queryFn: () => marketApi.getCrops().then(r => r.data.data),
  });

  const { data: offersData, isLoading, error, refetch } = useQuery({
    queryKey: ['buyerMarketplace', filters],
    queryFn: () => buyerApi.getMarketplace({
      cropId: filters.cropId || undefined,
      district: filters.district || undefined,
      verifiedOnly: filters.verifiedOnly || undefined,
      minPrice: filters.minPrice || undefined,
      page: filters.page,
      limit: filters.limit,
    }).then(r => r.data.data),
  });

  if (error) return <ErrorState onRetry={refetch} />;

  const offers: any[] = (offersData as any)?.offers ?? (offersData as any)?.data ?? [];
  const total: number = (offersData as any)?.total ?? 0;
  const totalPages: number = (offersData as any)?.totalPages ?? 1;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900">{t('buyer_marketplace')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{total} {t('active_offers')}</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="font-medium text-sm text-gray-700">{t('filter_buyers')}</span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <select
            className="input text-sm"
            value={filters.cropId}
            onChange={e => setFilters({ ...filters, cropId: e.target.value, page: 1 })}
          >
            <option value="">{t('all_crops_filter')}</option>
            {crops?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input
            type="text" className="input text-sm" placeholder={t('district_placeholder')}
            value={filters.district}
            onChange={e => setFilters({ ...filters, district: e.target.value, page: 1 })}
          />
          <select
            className="input text-sm"
            value={filters.quality}
            onChange={e => setFilters({ ...filters, quality: e.target.value, page: 1 })}
          >
            <option value="">All Grades</option>
            <option value="GRADE_A">Grade A</option>
            <option value="GRADE_B">Grade B</option>
            <option value="GRADE_C">Grade C</option>
          </select>
          <input
            type="number" className="input text-sm" placeholder={t('min_price_placeholder')}
            value={filters.minPrice}
            onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
          />
        </div>
        <label className="flex items-center gap-2 mt-3 cursor-pointer w-fit">
          <input
            type="checkbox"
            checked={filters.verifiedOnly}
            onChange={e => setFilters({ ...filters, verifiedOnly: e.target.checked, page: 1 })}
            className="rounded"
          />
          <span className="text-sm text-gray-600 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-green-600" /> {t('verified_only')}
          </span>
        </label>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => <CardSkeleton key={i} lines={3} />)}
        </div>
      ) : offers.length === 0 ? (
        <EmptyState title={t('no_buyers_match')} description={t('adjust_filters')} />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map((offer: any) => {
              const bp = offer.buyerProfile;
              const isVerified = bp?.verificationStatus === 'VERIFIED';
              return (
                <div
                  key={offer.id}
                  className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-md transition-shadow flex flex-col"
                >
                  {/* Header row */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-semibold text-gray-900 text-sm leading-tight truncate">
                          {bp?.companyName}
                        </h3>
                        {isVerified && (
                          <BadgeCheck className="w-4 h-4 text-green-500 flex-shrink-0" title="Verified Buyer" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{bp?.contactName}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${QUALITY_COLOR[offer.quality] ?? 'bg-gray-100 text-gray-600'}`}>
                      {QUALITY_LABEL[offer.quality] ?? offer.quality}
                    </span>
                  </div>

                  {/* Crop + location */}
                  <div className="space-y-1.5 text-xs text-gray-500 mb-3">
                    <div className="flex items-center gap-1.5">
                      <Wheat className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                      <span className="font-medium text-gray-700">{offer.crop?.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {offer.district}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      {offer.minQuantity}–{offer.maxQuantity} {t('qtl')}
                    </div>
                  </div>

                  {/* Price + rating */}
                  <div className="flex items-end justify-between mb-4 flex-1">
                    <div>
                      <p className="text-xl font-bold text-green-700">{formatCurrency(offer.offeredPrice)}</p>
                      <p className="text-[11px] text-gray-400">{t('per_quintal')}</p>
                    </div>
                    <div className="text-right">
                      {bp?.rating > 0 && (
                        <div className="flex items-center gap-0.5 justify-end text-amber-500">
                          <Star className="w-3.5 h-3.5 fill-current" />
                          <span className="text-sm font-semibold text-gray-700">{Number(bp.rating).toFixed(1)}</span>
                        </div>
                      )}
                      {bp?.totalTransactions > 0 && (
                        <p className="text-[11px] text-gray-400">{bp.totalTransactions} deals</p>
                      )}
                    </div>
                  </div>

                  {/* View details button */}
                  <button
                    onClick={() => setSelected(offer)}
                    className="w-full flex items-center justify-center gap-1.5 border border-green-200 hover:border-green-500 hover:bg-green-50 text-green-700 rounded-xl py-2 text-xs font-semibold transition-colors"
                  >
                    View Details & Contact <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                disabled={filters.page === 1}
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {t('previous')}
              </button>
              <span className="text-sm text-gray-500">
                {t('page_of').replace('{0}', String(filters.page)).replace('{1}', String(totalPages))}
              </span>
              <button
                disabled={filters.page === totalPages}
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {t('next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Detail Modal ── */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40" onClick={() => setSelected(null)}>
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-gray-900 text-lg">{selected.buyerProfile?.companyName}</h2>
                  {selected.buyerProfile?.verificationStatus === 'VERIFIED' && (
                    <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                      <ShieldCheck className="w-3 h-3" /> Verified
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mt-0.5">{selected.buyerProfile?.contactName}</p>
              </div>
              <button onClick={() => setSelected(null)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Offer summary */}
              <div className="bg-green-50 rounded-2xl p-4">
                <p className="text-xs font-semibold text-green-700 uppercase tracking-wide mb-3">Purchase Offer</p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm">
                  <div>
                    <p className="text-xs text-gray-500">Crop</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <Wheat className="w-3.5 h-3.5 text-green-600" /> {selected.crop?.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Offered Price</p>
                    <p className="font-bold text-green-700 text-lg">{formatCurrency(selected.offeredPrice)}<span className="text-xs font-normal text-gray-400">/qtl</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Quality Required</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${QUALITY_COLOR[selected.quality] ?? 'bg-gray-100 text-gray-600'}`}>
                      {QUALITY_LABEL[selected.quality] ?? selected.quality}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Quantity Range</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-gray-400" />
                      {selected.minQuantity}–{selected.maxQuantity} qtl
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="font-medium text-gray-800 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-gray-400" /> {selected.district}
                      {selected.buyerProfile?.state ? `, ${selected.buyerProfile.state}` : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Offer Expires</p>
                    <p className="font-medium text-gray-800 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      {selected.expiresAt ? new Date(selected.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No expiry'}
                    </p>
                  </div>
                </div>
                {selected.notes && !selected.notes.includes('[SEED]') && (
                  <p className="mt-3 text-sm text-gray-600 italic border-t border-green-200 pt-3">"{selected.notes}"</p>
                )}
              </div>

              {/* Buyer profile */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Buyer Profile</p>
                <div className="grid grid-cols-2 gap-y-3 gap-x-4 text-sm mb-4">
                  <div>
                    <p className="text-xs text-gray-500">Company</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" /> {selected.buyerProfile?.companyName}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Rating</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-current" />
                      {selected.buyerProfile?.rating > 0 ? Number(selected.buyerProfile.rating).toFixed(1) : 'No rating'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Total Deals</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-gray-400" />
                      {selected.buyerProfile?.totalTransactions ?? 0} transactions
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Status</p>
                    {selected.buyerProfile?.verificationStatus === 'VERIFIED' ? (
                      <span className="flex items-center gap-1 text-xs text-green-700 font-semibold">
                        <BadgeCheck className="w-3.5 h-3.5" /> Verified Buyer
                      </span>
                    ) : (
                      <span className="text-xs text-amber-600 font-medium">Pending Verification</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact details */}
              <div className="bg-blue-50 rounded-2xl p-4 border border-blue-100">
                <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Contact Details</p>
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 font-bold text-sm">
                        {selected.buyerProfile?.contactName?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{selected.buyerProfile?.contactName}</p>
                      <p className="text-xs text-gray-500">{selected.buyerProfile?.companyName}</p>
                    </div>
                  </div>
                  {selected.buyerProfile?.user?.email && (
                    <a
                      href={`mailto:${selected.buyerProfile.user.email}`}
                      className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-700 transition-colors group"
                    >
                      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-gray-200 group-hover:border-blue-300 transition-colors flex-shrink-0">
                        <Mail className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                      </div>
                      <span className="truncate">{selected.buyerProfile.user.email}</span>
                    </a>
                  )}
                  {selected.buyerProfile?.user?.phone && (
                    <a
                      href={`tel:${selected.buyerProfile.user.phone}`}
                      className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-700 transition-colors group"
                    >
                      <div className="w-7 h-7 bg-white rounded-lg flex items-center justify-center border border-gray-200 group-hover:border-blue-300 transition-colors flex-shrink-0">
                        <Phone className="w-3.5 h-3.5 text-gray-400 group-hover:text-blue-600" />
                      </div>
                      <span>{selected.buyerProfile.user.phone}</span>
                    </a>
                  )}
                  {!selected.buyerProfile?.user?.phone && !selected.buyerProfile?.user?.email && (
                    <p className="text-xs text-gray-400 italic">No contact details available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
