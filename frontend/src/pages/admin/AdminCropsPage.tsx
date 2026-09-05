import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi, marketApi } from '../../api';
import { formatDate, formatNumber } from '../../utils';
import { CardSkeleton } from '../../components/common/LoadingSpinner';
import { Wheat, Search, Filter } from 'lucide-react';

const QUALITY_COLORS: Record<string, string> = {
  GRADE_A: 'bg-green-100 text-green-700',
  GRADE_B: 'bg-blue-100 text-blue-700',
  GRADE_C: 'bg-amber-100 text-amber-700',
  UNGRADED: 'bg-gray-100 text-gray-600',
};

const STORAGE_COLORS: Record<string, string> = {
  NOT_STORED: 'bg-gray-100 text-gray-600',
  IN_STORAGE: 'bg-teal-100 text-teal-700',
  PARTIALLY_STORED: 'bg-blue-100 text-blue-700',
};

export default function AdminCropsPage() {
  const [search, setSearch] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [qualityFilter, setQualityFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['adminCrops', page, cropFilter, qualityFilter, activeFilter],
    queryFn: () =>
      adminApi.getCrops({
        page,
        limit: 20,
        ...(cropFilter && { cropId: cropFilter }),
        ...(qualityFilter && { quality: qualityFilter }),
        ...(activeFilter !== '' && { isActive: activeFilter === 'true' }),
      }).then(r => r.data.data),
  });

  const { data: allCrops } = useQuery({
    queryKey: ['allCrops'],
    queryFn: () => marketApi.getCrops().then(r => r.data.data),
  });

  const crops = (data?.data || []).filter((c: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      c.crop?.name?.toLowerCase().includes(q) ||
      c.farmerProfile?.name?.toLowerCase().includes(q) ||
      c.district?.toLowerCase().includes(q) ||
      c.location?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <Wheat className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Crop Listings</h1>
            <p className="text-sm text-gray-500">{data?.total ?? 0} total crop listings</p>
          </div>
        </div>
      </div>

      {/* Summary chips */}
      <div className="grid grid-cols-3 gap-2 sm:gap-4">
        {[
          {
            label: 'Total Listings',
            value: data?.total ?? 0,
            color: 'bg-amber-50 text-amber-700',
          },
          {
            label: 'Active Listings',
            value: (data?.data || []).filter((c: any) => c.isActive).length,
            color: 'bg-green-50 text-green-700',
          },
          {
            label: 'In Storage',
            value: (data?.data || []).filter((c: any) => c.storageStatus !== 'NOT_STORED').length,
            color: 'bg-teal-50 text-teal-700',
          },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs font-medium mt-0.5 opacity-80">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card flex flex-col sm:flex-row flex-wrap gap-3">
        <div className="relative flex-1 min-w-0 sm:min-w-[200px]">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9 w-full"
            placeholder="Search crop, farmer, district…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            className="input sm:w-40"
            value={cropFilter}
            onChange={e => { setCropFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Crops</option>
            {(allCrops || []).map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <select
          className="input sm:w-36"
          value={qualityFilter}
          onChange={e => { setQualityFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Qualities</option>
          <option value="GRADE_A">Grade A</option>
          <option value="GRADE_B">Grade B</option>
          <option value="GRADE_C">Grade C</option>
          <option value="UNGRADED">Ungraded</option>
        </select>
        <select
          className="input sm:w-36"
          value={activeFilter}
          onChange={e => { setActiveFilter(e.target.value); setPage(1); }}
        >
          <option value="">All Status</option>
          <option value="true">Active</option>
          <option value="false">Inactive</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <CardSkeleton key={i} lines={2} />)}</div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="border-b border-gray-100">
                {['Crop', 'Farmer', 'District', 'Quantity', 'Expected Price', 'Quality', 'Storage', 'Status', 'Listed'].map(h => (
                  <th key={h} className="text-left py-3 px-4 text-gray-500 font-medium text-xs uppercase tracking-wide whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {crops.map((c: any) => (
                <tr key={c.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <Wheat className="w-3.5 h-3.5 text-amber-600" />
                      </div>
                      <span className="font-medium text-gray-800">{c.crop?.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-700">{c.farmerProfile?.name || '—'}</td>
                  <td className="py-3 px-4 text-gray-500">{c.district}</td>
                  <td className="py-3 px-4 text-gray-700">
                    {formatNumber(c.quantity)} {c.unit}
                    {c.soldQuantity > 0 && (
                      <span className="text-xs text-gray-400 block">Sold: {formatNumber(c.soldQuantity)}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-gray-700">
                    {c.expectedPrice ? `₹${formatNumber(c.expectedPrice)}/qtl` : '—'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${QUALITY_COLORS[c.quality] ?? 'bg-gray-100 text-gray-600'}`}>
                      {c.quality?.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STORAGE_COLORS[c.storageStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                      {c.storageStatus?.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-gray-400 text-xs">{formatDate(c.createdAt)}</td>
                </tr>
              ))}
              {crops.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-gray-400">No crop listings found</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Pagination */}
          {(data?.totalPages ?? 0) > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-gray-50">
              <p className="text-xs text-gray-500">Page {page} of {data!.totalPages}</p>
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage(p => p - 1)}
                  className="btn-secondary text-xs disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page >= data!.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="btn-secondary text-xs disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
