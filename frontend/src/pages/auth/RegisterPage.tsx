import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Leaf, AlertCircle, Tractor, ShoppingBag } from 'lucide-react';
import { setCredentials } from '../../store/authSlice';
import { authApi } from '../../api';
import { useLanguage } from '../../hooks/useLanguage';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';

type Role = 'FARMER' | 'BUYER';

const DISTRICTS = [
  'Ahmedabad', 'Rajkot', 'Surendranagar', 'Bhavnagar', 'Junagadh',
  'Anand', 'Surat', 'Vadodara', 'Gandhinagar', 'Amreli', 'Jamnagar',
  'Porbandar', 'Kutch', 'Mehsana', 'Patan', 'Banaskantha', 'Sabarkantha',
];

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const [role, setRole] = useState<Role>('FARMER');
  const [form, setForm] = useState({
    email: '', password: '', name: '', district: '',
    // Farmer-only
    village: '', taluka: '',
    // Buyer-only
    companyName: '', phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        email: form.email,
        password: form.password,
        name: form.name,
        district: form.district,
        role,
      };
      if (role === 'FARMER') {
        if (form.village) payload.village = form.village;
        if (form.taluka)  payload.taluka  = form.taluka;
      } else {
        if (form.companyName) payload.companyName = form.companyName;
        if (form.phone)       payload.phone = form.phone;
      }

      const { data } = await authApi.register(payload);
      const { accessToken, refreshToken, user } = data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success('Registration successful! Welcome to KisanMitra AI');
      navigate(role === 'FARMER' ? '/farmer/dashboard' : '/buyer/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'input';
  const labelCls = 'label';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Navbar />
      <div className="flex items-center justify-center p-4 py-12">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
              <Leaf className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{t('join_title')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('tagline2')}</p>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-5">{t('create_account')}</h2>

            {/* ── Role toggle ── */}
            <div className="mb-6">
              <p className="text-xs font-medium text-gray-500 mb-2">I am registering as a…</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setRole('FARMER')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    role === 'FARMER'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Tractor className={`w-4 h-4 ${role === 'FARMER' ? 'text-green-600' : 'text-gray-400'}`} />
                  Farmer
                </button>
                <button
                  type="button"
                  onClick={() => setRole('BUYER')}
                  className={`flex items-center gap-2 px-4 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                    role === 'BUYER'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <ShoppingBag className={`w-4 h-4 ${role === 'BUYER' ? 'text-blue-600' : 'text-gray-400'}`} />
                  Buyer
                </button>
              </div>
              {/* Role description */}
              <p className="mt-2 text-xs text-gray-400">
                {role === 'FARMER'
                  ? '🌾 List your crops, get AI recommendations and connect with buyers.'
                  : '🛒 Browse crop listings, send interest notifications and contact farmers directly.'}
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Common fields */}
              <div>
                <label className={labelCls}>{t('full_name')} *</label>
                <input
                  type="text" className={inputCls}
                  placeholder={role === 'FARMER' ? 'Ramesh Patel' : 'Pranjal Mehta'}
                  value={form.name} onChange={set('name')}
                  required minLength={2}
                />
              </div>

              {/* Buyer: company name */}
              {role === 'BUYER' && (
                <div>
                  <label className={labelCls}>Company / Business Name</label>
                  <input
                    type="text" className={inputCls}
                    placeholder="Shreeji Cotton Pvt Ltd"
                    value={form.companyName} onChange={set('companyName')}
                  />
                </div>
              )}

              {/* Farmer: village */}
              {role === 'FARMER' && (
                <div>
                  <label className={labelCls}>{t('village')}</label>
                  <input
                    type="text" className={inputCls}
                    placeholder="Sanand"
                    value={form.village} onChange={set('village')}
                  />
                </div>
              )}

              {/* Farmer: taluka */}
              {role === 'FARMER' && (
                <div>
                  <label className={labelCls}>Taluka</label>
                  <input
                    type="text" className={inputCls}
                    placeholder="Sanand"
                    value={form.taluka} onChange={set('taluka')}
                  />
                </div>
              )}

              <div>
                <label className={labelCls}>{t('district')} *</label>
                <select className={inputCls} value={form.district} onChange={set('district')} required>
                  <option value="">{t('select_district')}</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className={labelCls}>{t('email')} *</label>
                <input
                  type="email" className={inputCls}
                  placeholder="your@email.com"
                  value={form.email} onChange={set('email')}
                  required
                />
              </div>

              {/* Buyer: phone */}
              {role === 'BUYER' && (
                <div>
                  <label className={labelCls}>Phone Number</label>
                  <input
                    type="tel" className={inputCls}
                    placeholder="+91 XXXXX XXXXX"
                    value={form.phone} onChange={set('phone')}
                  />
                </div>
              )}

              <div>
                <label className={labelCls}>{t('password')} *</label>
                <input
                  type="password" className={inputCls}
                  placeholder={t('min_6_chars')}
                  value={form.password} onChange={set('password')}
                  minLength={6} required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-xl font-semibold text-sm text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  role === 'FARMER'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading
                  ? t('creating_account')
                  : `Create ${role === 'FARMER' ? 'Farmer' : 'Buyer'} Account`}
              </button>
            </form>

            <p className="text-center text-sm text-gray-500 mt-4">
              {t('have_account')}{' '}
              <Link to="/login" className="text-green-600 hover:underline font-medium">{t('sign_in')}</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
