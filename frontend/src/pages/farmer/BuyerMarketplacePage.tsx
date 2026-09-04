import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { buyerApi, marketApi } from '../../api';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { EmptyState, ErrorState } from '../../components/common/StateComponents';
import { formatCurrency } from '../../utils';
import { MapPin, Package, Wheat, Filter, Star } from 'lucide-react';
import { useLanguage } from '../../hooks/useLanguage';

export default function BuyerMarketplacePage() {
  const { t } = useLanguage();
  const [filters, setFilters] = useState({
    cropId: '', district: '', verifiedOnly: false, minPrice: '', page: 1, limit: 20,
  });

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

  if (isLoading) return <div className="space-y-4">{[1, 2, 3].map(i => <CardSkeleton key={i} />)}</div>;
  if (error) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('buyer_marketplace')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{offersData?.total || 0} {t('active_offers')}</p>
      </div>

      {/* Filters */}
      <div className="card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="font-medium text-sm text-gray-700">{t('filter_buyers')}</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <select className="input text-sm" value={filters.cropId}
            onChange={e => setFilters({ ...filters, cropId: e.target.value, page: 1 })}>
            <option value="">{t('all_crops_filter')}</option>
            {crops?.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <input type="text" className="input text-sm" placeholder={t('district_placeholder')}
            value={filters.district} onChange={e => setFilters({ ...filters, district: e.target.value, page: 1 })} />
          <input type="number" className="input text-sm" placeholder={t('min_price_placeholder')}
            value={filters.minPrice} onChange={e => setFilters({ ...filters, minPrice: e.target.value })} />
          {/* <label className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-gray-200 rounded-xl hover:bg-gray-50">
            <input type="checkbox" checked={filters.verifiedOnly}
              onChange={e => setFilters({ ...filters, verifiedOnly: e.target.checked })} />
            <span className="text-sm text-gray-700">{t('verified_only')}</span>
          </label> */}
        </div>
      </div>

      {/* Offers */}
      {offersData?.offers?.length === 0 ? (
        <EmptyState title={t('no_buyers_match')} description={t('adjust_filters')} />
      ) : (
        <div className="grid gap-4">
          {offersData?.offers?.map((offer: any) => (
            <div key={offer.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-1 flex-wrap">
                    <h3 className="font-semibold text-gray-900 text-lg">{offer.buyerProfile?.companyName}</h3>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{offer.district}</span>
                    <span className="flex items-center gap-1"><Wheat className="w-3.5 h-3.5" />{offer.crop?.name}</span>
                    <span className="flex items-center gap-1"><Package className="w-3.5 h-3.5" />{offer.minQuantity}–{offer.maxQuantity} {t('qtl')}</span>
                    {offer.buyerProfile?.rating > 0 && (
                      <span className="flex items-center gap-1 text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-current" />{offer.buyerProfile.rating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right ml-4">
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(offer.offeredPrice)}</p>
                  <p className="text-xs text-gray-400">{t('per_quintal')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('grade')}: {offer.quality.replace('_', ' ')}</p>
                </div>
              </div>
              {offer.notes && (
                <p className="text-sm text-gray-500 mt-2 italic">"{offer.notes.replace('[SEED] ', '')}"</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {offersData?.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={filters.page === 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50">{t('previous')}</button>
          <span className="text-sm text-gray-500">{t('page_of').replace('{0}', String(filters.page)).replace('{1}', String(offersData.totalPages))}</span>
          <button disabled={filters.page === offersData.totalPages}
            onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
            className="btn-secondary px-3 py-1.5 text-sm disabled:opacity-50">{t('next')}</button>
        </div>
      )}
    </div>
  );
}
