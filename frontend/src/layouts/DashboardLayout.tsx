import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, TrendingUp, Wheat, Users, Briefcase,
  Star, Wallet, Bot, ArrowLeftRight, Bell, LogOut, Menu, X,
  Globe, ChevronDown, Leaf, Shield, Settings
} from 'lucide-react';
import type { RootState } from '../store';
import { logout } from '../store/authSlice';
import { setLanguage } from '../store/uiSlice';
import { authApi } from '../api';
import { t } from '../i18n';

const farmerNav = [
  { to: '/farmer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/farmer/market', icon: TrendingUp, label: 'Market Prices' },
  { to: '/farmer/crops', icon: Wheat, label: 'My Crops' },
  { to: '/farmer/buyers', icon: Users, label: 'Buyers' },
  { to: '/farmer/storage-advisor', icon: Briefcase, label: 'Storage Advisor' },
  { to: '/farmer/quality', icon: Star, label: 'Quality Check' },
  { to: '/farmer/income', icon: Wallet, label: 'Income' },
  { to: '/farmer/ai-assistant', icon: Bot, label: 'AI Assistant' },
  { to: '/farmer/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/farmer/notifications', icon: Bell, label: 'Notifications' },
];

const buyerNav = [
  { to: '/buyer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/buyer/offers', icon: Briefcase, label: 'My Offers' },
  { to: '/buyer/transactions', icon: ArrowLeftRight, label: 'Transactions' },
];

const adminNav = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/farmers', icon: Users, label: 'Farmers' },
  { to: '/admin/buyers', icon: Briefcase, label: 'Buyers' },
  { to: '/admin/transactions', icon: ArrowLeftRight, label: 'Transactions' },
  { to: '/admin/market-data', icon: TrendingUp, label: 'Market Data' },
  { to: '/admin/ai-monitoring', icon: Bot, label: 'AI Monitoring' },
  { to: '/admin/audit-logs', icon: Shield, label: 'Audit Logs' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((s: RootState) => s.auth);
  const { language } = useSelector((s: RootState) => s.ui);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [langOpen, setLangOpen] = useState(false);

  const navItems = user?.role === 'FARMER' ? farmerNav : user?.role === 'BUYER' ? buyerNav : adminNav;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    dispatch(logout());
    navigate('/login');
  };

  const languages = [{ code: 'en', label: 'English' }, { code: 'hi', label: 'हिंदी' }, { code: 'gu', label: 'ગુજરાતી' }];

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-100 flex flex-col transition-all duration-300 flex-shrink-0`}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-gray-100 gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-bold text-green-800 text-sm leading-tight">KisanMitra AI</div>
              <div className="text-xs text-gray-400 capitalize">{user?.role?.toLowerCase()}</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-green-50 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
                }`
              }
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span>{(item as any).label || t((item as any).key || '', language)}</span>}
            </NavLink>
          ))}
        </nav>

        {/* Language + Logout */}
        <div className="p-3 border-t border-gray-100 space-y-1">
          {sidebarOpen && (
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-xl"
              >
                <Globe className="w-4 h-4" />
                <span className="flex-1 text-left">{languages.find(l => l.code === language)?.label}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {langOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden z-10">
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { dispatch(setLanguage(lang.code as any)); setLangOpen(false); }}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-green-50 hover:text-green-700"
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {sidebarOpen && <span>{t('logout', language)}</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-6 gap-4">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-800">{user?.name}</div>
              <div className="text-xs text-gray-400">{user?.email}</div>
            </div>
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-green-700 font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
