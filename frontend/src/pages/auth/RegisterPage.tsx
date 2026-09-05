import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Leaf, AlertCircle } from 'lucide-react';
import { setCredentials } from '../../store/authSlice';
import { authApi } from '../../api';
import { useLanguage } from '../../hooks/useLanguage';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    email: '', password: '', name: '', district: '', village: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const payload: any = {
        email: form.email, password: form.password,
        name: form.name, district: form.district, role: 'FARMER',
      };
      if (form.village) payload.village = form.village;

      const { data } = await authApi.register(payload);
      const { accessToken, refreshToken, user } = data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success('Registration successful! Welcome to KisanMitra AI');
      navigate('/farmer/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const districts = ['Ahmedabad', 'Rajkot', 'Surendranagar', 'Bhavnagar', 'Junagadh', 'Anand', 'Surat', 'Vadodara', 'Gandhinagar'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Navbar />
      <div className="flex items-center justify-center p-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('join_title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('tagline2')}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('create_account')}</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">{t('full_name')}</label>
              <input type="text" className="input" placeholder="Ramesh Patel"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>

            <div>
              <label className="label">{t('village')}</label>
              <input type="text" className="input" placeholder="Sanand"
                value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} />
            </div>

            <div>
              <label className="label">{t('district')}</label>
              <select className="input" value={form.district}
                onChange={e => setForm({ ...form, district: e.target.value })} required>
                <option value="">{t('select_district')}</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="label">{t('email')}</label>
              <input type="email" className="input" placeholder="your@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div>
              <label className="label">{t('password')}</label>
              <input type="password" className="input" placeholder={t('min_6_chars')}
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                minLength={6} required />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50">
              {loading ? t('creating_account') : t('create_account')}
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
