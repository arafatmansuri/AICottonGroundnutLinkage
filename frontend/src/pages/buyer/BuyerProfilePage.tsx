import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { User, Lock, Save, Eye, EyeOff, CheckCircle, AlertCircle, Briefcase } from 'lucide-react';
import { buyerApi, authApi } from '../../api';
import { setCredentials } from '../../store/authSlice';
import type { RootState } from '../../store';
import toast from 'react-hot-toast';

type Tab = 'profile' | 'password';

interface ProfileForm {
  companyName: string;
  contactName: string;
  district: string;
  state: string;
  phone: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function BuyerProfilePage() {
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);
  const [tab, setTab] = useState<Tab>('profile');

  // ── Profile state ─────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<ProfileForm>({
    companyName: '', contactName: '', district: '', state: 'Gujarat', phone: '',
  });
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<string>('');

  // ── Password state ────────────────────────────────────────────────────────
  const [pwForm, setPwForm] = useState<PasswordForm>({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    buyerApi.getProfile().then(({ data }) => {
      const p = data.data as any;
      setProfile({
        companyName: p.companyName ?? '',
        contactName: p.contactName ?? '',
        district: p.district ?? '',
        state: p.state ?? 'Gujarat',
        phone: p.user?.phone ?? '',
      });
      setVerificationStatus(p.verificationStatus ?? '');
    }).catch(() => {
      toast.error('Could not load profile');
    }).finally(() => setProfileLoading(false));
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    try {
      await buyerApi.updateProfile(profile as any);
      toast.success('Profile updated successfully');
      // Update name in auth store if contactName changed
      if (user && profile.contactName && profile.contactName !== user.name) {
        dispatch(setCredentials({
          user: { ...user, name: profile.contactName },
          accessToken: localStorage.getItem('accessToken')!,
          refreshToken: localStorage.getItem('refreshToken')!,
        }));
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to update profile');
    } finally {
      setProfileSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters');
      return;
    }
    setPwSaving(true);
    try {
      await authApi.changePassword({
        currentPassword: pwForm.currentPassword,
        newPassword: pwForm.newPassword,
      });
      toast.success('Password changed successfully');
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  const statusColors: Record<string, string> = {
    VERIFIED: 'bg-green-100 text-green-700',
    PENDING: 'bg-amber-100 text-amber-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your account information and security settings</p>
      </div>

      {/* Avatar card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center gap-4">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
          <span className="text-blue-700 font-bold text-2xl">
            {(profile.contactName || user?.name || '?').charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <div className="text-lg font-semibold text-gray-900">{profile.contactName || user?.name}</div>
          {profile.companyName && (
            <div className="text-sm text-gray-500 flex items-center gap-1">
              <Briefcase className="w-3.5 h-3.5" /> {profile.companyName}
            </div>
          )}
          <div className="text-sm text-gray-400">{user?.email}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Buyer</span>
            {verificationStatus && (
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[verificationStatus] ?? 'bg-gray-100 text-gray-600'}`}>
                {verificationStatus.charAt(0) + verificationStatus.slice(1).toLowerCase()}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setTab('profile')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors ${
              tab === 'profile'
                ? 'text-green-700 border-b-2 border-green-600 bg-green-50/40'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <User className="w-4 h-4" />
            Update Profile
          </button>
          <button
            onClick={() => setTab('password')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3.5 text-sm font-medium transition-colors ${
              tab === 'password'
                ? 'text-green-700 border-b-2 border-green-600 bg-green-50/40'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Lock className="w-4 h-4" />
            Change Password
          </button>
        </div>

        {/* ── Profile Tab ── */}
        {tab === 'profile' && (
          <div className="p-6">
            {profileLoading ? (
              <div className="flex items-center justify-center py-12 text-gray-400 text-sm">
                Loading profile...
              </div>
            ) : (
              <form onSubmit={handleProfileSave} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={labelCls}>Company / Business Name *</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={profile.companyName}
                      onChange={e => setProfile({ ...profile, companyName: e.target.value })}
                      required
                      minLength={2}
                      placeholder="Your company or business name"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Contact Name *</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={profile.contactName}
                      onChange={e => setProfile({ ...profile, contactName: e.target.value })}
                      required
                      minLength={2}
                      placeholder="Your full name"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>Phone Number</label>
                    <input
                      type="tel"
                      className={inputCls}
                      value={profile.phone}
                      onChange={e => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="+91 XXXXX XXXXX"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>District *</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={profile.district}
                      onChange={e => setProfile({ ...profile, district: e.target.value })}
                      required
                      placeholder="e.g. Ahmedabad"
                    />
                  </div>

                  <div>
                    <label className={labelCls}>State</label>
                    <input
                      type="text"
                      className={inputCls}
                      value={profile.state}
                      onChange={e => setProfile({ ...profile, state: e.target.value })}
                      placeholder="e.g. Gujarat"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={profileSaving}
                    className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    {profileSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* ── Password Tab ── */}
        {tab === 'password' && (
          <div className="p-6">
            <form onSubmit={handlePasswordChange} className="space-y-5">
              <div>
                <label className={labelCls}>Current Password *</label>
                <div className="relative">
                  <input
                    type={showCurrent ? 'text' : 'password'}
                    className={`${inputCls} pr-10`}
                    value={pwForm.currentPassword}
                    onChange={e => setPwForm({ ...pwForm, currentPassword: e.target.value })}
                    required
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className={labelCls}>New Password *</label>
                <div className="relative">
                  <input
                    type={showNew ? 'text' : 'password'}
                    className={`${inputCls} pr-10`}
                    value={pwForm.newPassword}
                    onChange={e => setPwForm({ ...pwForm, newPassword: e.target.value })}
                    required
                    minLength={6}
                    placeholder="Min. 6 characters"
                  />
                  <button type="button" onClick={() => setShowNew(!showNew)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwForm.newPassword.length > 0 && pwForm.newPassword.length < 6 && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Must be at least 6 characters
                  </p>
                )}
                {pwForm.newPassword.length >= 6 && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Looks good
                  </p>
                )}
              </div>

              <div>
                <label className={labelCls}>Confirm New Password *</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={`${inputCls} pr-10`}
                    value={pwForm.confirmPassword}
                    onChange={e => setPwForm({ ...pwForm, confirmPassword: e.target.value })}
                    required
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {pwForm.confirmPassword.length > 0 && pwForm.newPassword !== pwForm.confirmPassword && (
                  <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> Passwords do not match
                  </p>
                )}
                {pwForm.confirmPassword.length > 0 && pwForm.newPassword === pwForm.confirmPassword && pwForm.newPassword.length >= 6 && (
                  <p className="mt-1 text-xs text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Passwords match
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={pwSaving}
                  className="flex items-center gap-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
                >
                  <Lock className="w-4 h-4" />
                  {pwSaving ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
