import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Leaf, AlertCircle } from 'lucide-react';
import { setCredentials } from '../../store/authSlice';
import { authApi } from '../../api';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: '', password: '', name: '', district: '',
    role: 'FARMER' as 'FARMER' | 'BUYER',
    village: '', companyName: '',
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
        name: form.name, district: form.district, role: form.role,
      };
      if (form.role === 'FARMER' && form.village) payload.village = form.village;
      if (form.role === 'BUYER' && form.companyName) payload.companyName = form.companyName;

      const { data } = await authApi.register(payload);
      const { accessToken, refreshToken, user } = data.data;
      dispatch(setCredentials({ user, accessToken, refreshToken }));
      toast.success('Registration successful! Welcome to KisanMitra AI');
      if (user.role === 'FARMER') navigate('/farmer/dashboard');
      else navigate('/buyer/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const districts = ['Ahmedabad', 'Rajkot', 'Surendranagar', 'Bhavnagar', 'Junagadh', 'Anand', 'Surat', 'Vadodara', 'Gandhinagar'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Join KisanMitra AI</h1>
          <p className="text-gray-500 text-sm mt-1">Smart market intelligence for farmers</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Create Account</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Role */}
            <div>
              <label className="label">I am a</label>
              <div className="grid grid-cols-2 gap-3">
                {(['FARMER', 'BUYER'] as const).map(r => (
                  <button key={r} type="button"
                    onClick={() => setForm({ ...form, role: r })}
                    className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                      form.role === r ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 hover:border-green-300'
                    }`}>
                    {r === 'FARMER' ? '🌾 Farmer' : '🏢 Buyer'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Full Name</label>
              <input type="text" className="input" placeholder="Ramesh Patel"
                value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
            </div>

            {form.role === 'BUYER' && (
              <div>
                <label className="label">Company Name</label>
                <input type="text" className="input" placeholder="ABC Agro Pvt Ltd"
                  value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })} />
              </div>
            )}

            {form.role === 'FARMER' && (
              <div>
                <label className="label">Village</label>
                <input type="text" className="input" placeholder="Sanand"
                  value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} />
              </div>
            )}

            <div>
              <label className="label">District</label>
              <select className="input" value={form.district}
                onChange={e => setForm({ ...form, district: e.target.value })} required>
                <option value="">Select district</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>

            <div>
              <label className="label">Email</label>
              <input type="email" className="input" placeholder="your@email.com"
                value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
            </div>

            <div>
              <label className="label">Password</label>
              <input type="password" className="input" placeholder="Min. 6 characters"
                value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                minLength={6} required />
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3 disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account?{' '}
            <Link to="/login" className="text-green-600 hover:underline font-medium">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
