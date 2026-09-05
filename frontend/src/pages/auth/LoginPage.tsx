import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Eye, EyeOff, Leaf, AlertCircle, Zap } from 'lucide-react';
import { setCredentials } from '../../store/authSlice';
import { authApi } from '../../api';
import { useLanguage } from '../../hooks/useLanguage';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar';

const DEMO_ACCOUNTS = [
  { label: '🌾 Farmer', sublabel: 'Ramesh Patel',   email: 'ramesh@farmer.com',   pass: 'farmer123' },
  { label: '🌾 Farmer', sublabel: 'Bhavesh Sharma', email: 'bhavesh@farmer.com',  pass: 'farmer123' },
  { label: '🛒 Buyer',  sublabel: 'Shreeji Cotton', email: 'shreeji@buyer.com',   pass: 'buyer123'  },
  { label: '🛒 Buyer',  sublabel: 'Bharat Groundnut', email: 'bharat@buyer.com',  pass: 'buyer123'  },
  { label: '⚙ Admin',  sublabel: 'Platform Admin', email: 'admin@kisanmitra.ai',  pass: 'admin123' },
];

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoadingEmail, setDemoLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState('');

  const redirectForRole = (role: string) => {
    if (role === 'FARMER') return '/farmer/dashboard';
    if (role === 'BUYER')  return '/buyer/dashboard';
    return '/admin/dashboard';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.login(form);
      const { accessToken, refreshToken, user } = data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success(`Welcome back, ${user.name}!`);
      navigate(redirectForRole(user.role));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  const demoLogin = async (email: string, password: string) => {
    setForm({ email, password });
    setDemoLoadingEmail(email);
    setError('');
    try {
      const { data } = await authApi.login({ email, password });
      const { accessToken, refreshToken, user } = data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success(`Welcome, ${user.name}!`);
      navigate(redirectForRole(user.role));
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setDemoLoadingEmail(null);
    }
  };

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
            <h1 className="text-2xl font-bold text-gray-900">KisanMitra AI</h1>
            <p className="text-gray-500 text-sm mt-1">{t('tagline')}</p>
          </div>

          {/* Sign-in card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6">{t('sign_in_title')}</h2>

            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">{t('email')}</label>
                <input
                  type="email" className="input" placeholder="your@email.com"
                  value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="label">{t('password')}</label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'} className="input pr-10"
                    placeholder="••••••••"
                    value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                    required
                  />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading || !!demoLoadingEmail}
                className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed">
                {loading ? t('signing_in') : t('sign_in')}
              </button>
            </form>

            <div className="text-right mt-2">
              <Link to="/forgot-password" className="text-xs text-green-600 hover:underline">
                Forgot password?
              </Link>
            </div>

            <p className="text-center text-sm text-gray-500 mt-4">
              {t('no_account')}{' '}
              <Link to="/register" className="text-green-600 hover:underline font-medium">{t('register')}</Link>
            </p>
          </div>

          {/* Demo quick login */}
          <div className="mt-5 bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{t('demo_login')}</p>
            </div>

            {/* Farmers */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Farmers</p>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {DEMO_ACCOUNTS.filter(d => d.label.includes('Farmer')).map(d => (
                <button
                  key={d.email}
                  onClick={() => demoLogin(d.email, d.pass)}
                  disabled={!!demoLoadingEmail || loading}
                  className="flex flex-col items-start text-left bg-green-50 hover:bg-green-100 disabled:opacity-60 disabled:cursor-not-allowed text-green-800 rounded-xl px-3 py-2.5 transition-colors"
                >
                  <span className="text-xs font-semibold leading-tight">{d.label}</span>
                  <span className="text-[11px] text-green-600 mt-0.5 leading-tight">
                    {demoLoadingEmail === d.email ? 'Signing in…' : d.sublabel}
                  </span>
                </button>
              ))}
            </div>

            {/* Buyers */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Buyers</p>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {DEMO_ACCOUNTS.filter(d => d.label.includes('Buyer')).map(d => (
                <button
                  key={d.email}
                  onClick={() => demoLogin(d.email, d.pass)}
                  disabled={!!demoLoadingEmail || loading}
                  className="flex flex-col items-start text-left bg-blue-50 hover:bg-blue-100 disabled:opacity-60 disabled:cursor-not-allowed text-blue-800 rounded-xl px-3 py-2.5 transition-colors"
                >
                  <span className="text-xs font-semibold leading-tight">{d.label}</span>
                  <span className="text-[11px] text-blue-600 mt-0.5 leading-tight">
                    {demoLoadingEmail === d.email ? 'Signing in…' : d.sublabel}
                  </span>
                </button>
              ))}
            </div>

            {/* Admin */}
            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">Admin</p>
            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.filter(d => d.label.includes('Admin')).map(d => (
                <button
                  key={d.email}
                  onClick={() => demoLogin(d.email, d.pass)}
                  disabled={!!demoLoadingEmail || loading}
                  className="flex items-center gap-3 bg-gray-50 hover:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed text-gray-700 rounded-xl px-3 py-2.5 transition-colors"
                >
                  <span className="text-xs font-semibold">{d.label}</span>
                  <span className="text-[11px] text-gray-400">
                    {demoLoadingEmail === d.email ? 'Signing in…' : d.sublabel}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
