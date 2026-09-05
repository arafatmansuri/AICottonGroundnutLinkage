import { useQuery } from '@tanstack/react-query';
import { Wheat, MapPin, Phone, Mail, Calendar, Bell, User, MessageSquare } from 'lucide-react';
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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function BuyerInterestsPage() {
  const { data: interests, isLoading } = useQuery({
    queryKey: ['buyerInterests'],
    queryFn: () => buyerApi.getInterests().then(r => r.data.data),
  });

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Interests</h1>
          <p className="text-sm text-gray-500 mt-1">Crops you have sent interest notifications to.</p>
        </div>
        <Link
          to="/buyer/crops"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors flex-shrink-0"
        >
          <Wheat className="w-4 h-4" /> Browse More Crops
        </Link>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
        <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Bell className="w-6 h-6 text-amber-500" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{interests?.length ?? 0}</p>
          <p className="text-sm text-gray-500">Total interest notifications sent</p>
        </div>
      </div>

      {/* List */}
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
      ) : !interests?.length ? (
        <div className="bg-white rounded-2xl border border-gray-100 py-16 text-center">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No interests sent yet</p>
          <p className="text-gray-400 text-sm mt-1">Browse crops and send interest notifications to farmers.</p>
          <Link
            to="/buyer/crops"
            className="mt-4 inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Wheat className="w-4 h-4" /> Browse Crops
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {interests.map((interest: CropInterestRecord) => {
            const fc = interest.farmerCrop;
            return (
              <div key={interest.id} className="bg-white rounded-2xl border border-gray-100 p-5 hover:shadow-sm transition-shadow">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Crop icon */}
                  <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center flex-shrink-0">
                    <Wheat className="w-6 h-6 text-green-600" />
                  </div>

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start gap-2 mb-2">
                      <h3 className="font-semibold text-gray-900 text-lg">{fc.crop.name}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${QUALITY_COLORS[fc.quality] ?? 'bg-gray-100 text-gray-600'}`}>
                        {QUALITY_LABELS[fc.quality] ?? fc.quality}
                      </span>
                    </div>

                    {/* Crop details */}
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

                    {/* Message sent */}
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
                          <a href={`mailto:${fc.farmerProfile.user.email}`} className="hover:text-green-700 hover:underline truncate">
                            {fc.farmerProfile.user.email}
                          </a>
                        </div>
                        {fc.farmerProfile.user.phone && (
                          <div className="flex items-center gap-2 text-xs text-gray-700">
                            <Phone className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            <a href={`tel:${fc.farmerProfile.user.phone}`} className="hover:text-green-700 hover:underline">
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
