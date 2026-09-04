import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api';
import { Settings, Save, RefreshCw, Database, Globe, Mail, Bell } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminSettingsPage() {
  const qc = useQueryClient();
  const [activeSection, setActiveSection] = useState<'general' | 'ai' | 'notifications' | 'system'>('general');

  const { data: settings } = useQuery({
    queryKey: ['adminSettings'],
    queryFn: () => adminApi.getSettings().then(r => r.data.data),
  });

  const { data: healthData } = useQuery({
    queryKey: ['systemHealth'],
    queryFn: () => adminApi.getSystemHealth().then(r => r.data),
    refetchInterval: 10_000,
  });

  const saveMutation = useMutation({
    mutationFn: (data: any) => adminApi.updateSettings(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminSettings'] });
      toast.success('Settings saved');
    },
    onError: () => toast.error('Failed to save'),
  });

  const [generalForm, setGeneralForm] = useState({
    platformName: 'KisanMitra AI',
    supportEmail: 'support@kisanmitra.in',
    maxUploadMb: '10',
    sessionHours: '24',
  });

  const [aiForm, setAiForm] = useState({
    aiProvider: settings?.aiProvider || 'MOCK',
    storageCostPerUnit: '50',
    storageDurationDays: '30',
    buyerMatchingWeightPrice: '50',
    buyerMatchingWeightDistance: '30',
    buyerMatchingWeightRating: '20',
  });

  const sections = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'ai', label: 'AI & Agents', icon: Database },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'system', label: 'System Health', icon: RefreshCw },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
          <Settings className="w-5 h-5 text-gray-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500">Configure platform behaviour and integrations</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
        {/* Sidebar nav — horizontal on mobile */}
        <div className="flex md:flex-col gap-1 flex-wrap md:flex-nowrap">
          {sections.map(s => (
            <button key={s.id} onClick={() => setActiveSection(s.id as any)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors ${
                activeSection === s.id ? 'bg-green-50 text-green-700' : 'text-gray-600 hover:bg-gray-50'
              }`}>
              <s.icon className="w-4 h-4" />{s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="md:col-span-3 space-y-4">
          {activeSection === 'general' && (
            <div className="card space-y-4">
              <h2 className="font-semibold text-gray-900">General Settings</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Platform Name</label>
                  <input className="input" value={generalForm.platformName}
                    onChange={e => setGeneralForm({ ...generalForm, platformName: e.target.value })} />
                </div>
                <div>
                  <label className="label">Support Email</label>
                  <input type="email" className="input" value={generalForm.supportEmail}
                    onChange={e => setGeneralForm({ ...generalForm, supportEmail: e.target.value })} />
                </div>
                <div>
                  <label className="label">Max Upload Size (MB)</label>
                  <input type="number" className="input" min="1" max="50" value={generalForm.maxUploadMb}
                    onChange={e => setGeneralForm({ ...generalForm, maxUploadMb: e.target.value })} />
                </div>
                <div>
                  <label className="label">Session Timeout (hours)</label>
                  <input type="number" className="input" min="1" max="168" value={generalForm.sessionHours}
                    onChange={e => setGeneralForm({ ...generalForm, sessionHours: e.target.value })} />
                </div>
              </div>
              <button
                onClick={() => saveMutation.mutate({ section: 'general', ...generalForm })}
                disabled={saveMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving…' : 'Save Settings'}
              </button>
            </div>
          )}

          {activeSection === 'ai' && (
            <div className="card space-y-4">
              <h2 className="font-semibold text-gray-900">AI & Agent Configuration</h2>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                <p className="text-xs text-amber-800">
                  <strong>AI Provider:</strong> Currently using <span className="font-mono bg-amber-100 px-1 rounded">MOCK</span> mode.
                  Set <span className="font-mono bg-amber-100 px-1 rounded">AI_PROVIDER=GRANITE</span> in <span className="font-mono bg-amber-100 px-1 rounded">.env</span> for real IBM watsonx inference.
                </p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Storage Cost per Unit (₹)</label>
                  <input type="number" className="input" min="1" value={aiForm.storageCostPerUnit}
                    onChange={e => setAiForm({ ...aiForm, storageCostPerUnit: e.target.value })} />
                  <p className="text-xs text-gray-400 mt-1">Used by Storage Advisor agent</p>
                </div>
                <div>
                  <label className="label">Default Storage Duration (days)</label>
                  <input type="number" className="input" min="1" max="365" value={aiForm.storageDurationDays}
                    onChange={e => setAiForm({ ...aiForm, storageDurationDays: e.target.value })} />
                </div>
              </div>
              <div>
                <p className="label mb-2">Buyer Matching Score Weights (must sum to 100)</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500">Price Weight (%)</label>
                    <input type="number" className="input" min="0" max="100" value={aiForm.buyerMatchingWeightPrice}
                      onChange={e => setAiForm({ ...aiForm, buyerMatchingWeightPrice: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Distance Weight (%)</label>
                    <input type="number" className="input" min="0" max="100" value={aiForm.buyerMatchingWeightDistance}
                      onChange={e => setAiForm({ ...aiForm, buyerMatchingWeightDistance: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Rating Weight (%)</label>
                    <input type="number" className="input" min="0" max="100" value={aiForm.buyerMatchingWeightRating}
                      onChange={e => setAiForm({ ...aiForm, buyerMatchingWeightRating: e.target.value })} />
                  </div>
                </div>
                {Number(aiForm.buyerMatchingWeightPrice) + Number(aiForm.buyerMatchingWeightDistance) + Number(aiForm.buyerMatchingWeightRating) !== 100 && (
                  <p className="text-xs text-red-500 mt-1">⚠ Weights must sum to exactly 100</p>
                )}
              </div>
              <button
                onClick={() => saveMutation.mutate({ section: 'ai', ...aiForm })}
                disabled={saveMutation.isPending}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" /> {saveMutation.isPending ? 'Saving…' : 'Save AI Config'}
              </button>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div className="card space-y-4">
              <h2 className="font-semibold text-gray-900">Notification Settings</h2>
              <div className="space-y-3">
                {[
                  { label: 'Transaction Created', desc: 'Notify farmer + buyer when new transaction starts', enabled: true },
                  { label: 'Transaction Status Changed', desc: 'Notify parties on every state transition', enabled: true },
                  { label: 'Transaction Completed', desc: 'Send completion summary to both parties', enabled: true },
                  { label: 'Buyer Verified', desc: 'Notify buyer when admin approves/rejects', enabled: true },
                  { label: 'AI Recommendation', desc: 'Notify farmer when AI generates new advice', enabled: false },
                ].map(n => (
                  <div key={n.label} className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{n.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{n.desc}</p>
                    </div>
                    <div className={`w-10 h-5 rounded-full flex items-center transition-colors cursor-pointer ${n.enabled ? 'bg-green-500 justify-end' : 'bg-gray-300 justify-start'}`}>
                      <div className="w-4 h-4 bg-white rounded-full mx-0.5 shadow-sm" />
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-blue-800">Email Integration</span>
                </div>
                <p className="text-xs text-blue-700">Email notifications require SMTP configuration. Set <span className="font-mono bg-blue-100 px-1 rounded">SMTP_HOST</span>, <span className="font-mono bg-blue-100 px-1 rounded">SMTP_USER</span>, and <span className="font-mono bg-blue-100 px-1 rounded">SMTP_PASS</span> in environment.</p>
              </div>
            </div>
          )}

          {activeSection === 'system' && (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-900">System Health</h2>
                <span className="text-xs text-gray-400 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Auto-refresh 10s
                </span>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'API Server', status: 'Operational', detail: 'Express 4.x · Port 5000', ok: true },
                  { label: 'Database', status: healthData?.database === 'ok' ? 'Connected' : 'Disconnected', detail: 'PostgreSQL · Prisma ORM', ok: healthData?.database === 'ok' },
                  { label: 'AI Provider', status: (healthData?.aiProvider || 'MOCK') + ' Mode', detail: healthData?.aiProvider === 'GRANITE' ? 'IBM watsonx connected' : 'Mock responses active', ok: true },
                  { label: 'File Storage', status: 'Local Disk', detail: 'uploads/ directory', ok: true },
                  { label: 'Rate Limiting', status: 'Active', detail: '300 req/15min general, 20 auth', ok: true },
                  { label: 'JWT Auth', status: 'Active', detail: 'Access 15m · Refresh 7d', ok: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="text-sm font-medium text-gray-700">{item.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{item.detail}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${item.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {item.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
