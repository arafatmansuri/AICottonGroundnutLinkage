import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Leaf, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { authApi } from '../../api';
import toast from 'react-hot-toast';

type Step = 'request' | 'reset';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('request');

  // Step 1 — request reset
  const [email, setEmail] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');

  // Step 2 — reset password
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);

  const inputCls = 'w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent';
  const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setRequestLoading(true);
    try {
      const { data } = await authApi.forgotPassword(email);
      // In dev mode the token is returned in the response; in production it would be emailed
      if (data.data?.resetToken) {
        setResetToken(data.data.resetToken);
        setToken(data.data.resetToken);
      }
      setStep('reset');
      toast.success('Reset instructions sent! Check your email.');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Request failed');
    } finally {
      setRequestLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setResetLoading(true);
    try {
      await authApi.resetPassword({ token, newPassword });
      toast.success('Password reset successfully! Please sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.response?.data?.error?.message || 'Reset failed. Token may have expired.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Leaf className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">KisanMitra AI</h1>
          <p className="text-gray-500 text-sm mt-1">AI-Powered Market Intelligence for Farmers</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          {/* Back link */}
          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Sign In
          </Link>

          {/* ── Step 1: Request reset ── */}
          {step === 'request' && (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Forgot Password?</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter the email address linked to your account and we'll send you a reset link.
              </p>

              <form onSubmit={handleRequestReset} className="space-y-4">
                <div>
                  <label className={labelCls}>Email Address</label>
                  <input
                    type="email"
                    className={inputCls}
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={requestLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  {requestLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          )}

          {/* ── Step 2: Enter reset token + new password ── */}
          {step === 'reset' && (
            <>
              <h2 className="text-xl font-semibold text-gray-800 mb-2">Reset Password</h2>
              <p className="text-sm text-gray-500 mb-6">
                Enter the reset token from your email and choose a new password.
              </p>

              {resetToken && (
                <div className="flex items-start gap-2 bg-blue-50 border border-blue-200 text-blue-700 rounded-xl px-4 py-3 mb-5 text-xs">
                  <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>
                    <span className="font-medium">Dev mode:</span> Your reset token is{' '}
                    <span className="font-mono break-all">{resetToken}</span>
                    <br />In production, this would be emailed to you.
                  </span>
                </div>
              )}

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className={labelCls}>Reset Token</label>
                  <input
                    type="text"
                    className={`${inputCls} font-mono text-xs`}
                    placeholder="Paste your reset token"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className={labelCls}>New Password</label>
                  <input
                    type="password"
                    className={inputCls}
                    placeholder="Min. 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <div>
                  <label className={labelCls}>Confirm New Password</label>
                  <input
                    type="password"
                    className={inputCls}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Passwords do not match
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={resetLoading}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl text-sm font-medium transition-colors"
                >
                  {resetLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <button
                onClick={() => setStep('request')}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 py-2"
              >
                Didn't receive a token? Try again
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
