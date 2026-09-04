import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  LayoutDashboard, TrendingUp, Wheat, Users, Briefcase,
  Star, Wallet, Bot, LogOut, Menu, X,
  Globe, ChevronDown, Leaf,
} from 'lucide-react';
import type { RootState } from '../store';
import { logout } from '../store/authSlice';
import { setLanguage } from '../store/uiSlice';
import { authApi } from '../api';
import { useLanguage } from '../hooks/useLanguage';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector((s: RootState) => s.auth);
  const { language } = useSelector((s: RootState) => s.ui);
  const { t } = useLanguage();
  // Desktop: sidebar collapses to icon-rail. Mobile: sidebar is hidden by default.
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Close mobile drawer when resizing back to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const farmerNav = [
    { to: '/farmer/dashboard', icon: LayoutDashboard, key: 'dashboard' },
    { to: '/farmer/market', icon: TrendingUp, key: 'market_prices' },
    { to: '/farmer/crops', icon: Wheat, key: 'my_crops' },
    { to: '/farmer/buyers', icon: Users, key: 'buyers' },
    { to: '/farmer/storage-advisor', icon: Briefcase, key: 'storage_advisor' },
    { to: '/farmer/quality', icon: Star, key: 'quality_check' },
    { to: '/farmer/income', icon: Wallet, key: 'income' },
    { to: '/farmer/ai-assistant', icon: Bot, key: 'ai_assistant' },
  ];

  const adminNav = [
    { to: '/admin/dashboard', icon: LayoutDashboard, key: 'overview' },
    { to: '/admin/farmers', icon: Users, key: 'farmers' },
    { to: '/admin/buyers', icon: Briefcase, key: 'buyers' },
    { to: '/admin/market-data', icon: TrendingUp, key: 'market_data' },
  ];

  const navItems = user?.role === 'FARMER' ? farmerNav : adminNav;

  const handleLogout = async () => {
    try { await authApi.logout(); } catch {}
    dispatch(logout());
    navigate('/login');
  };

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'gu', label: 'ગુજરાતી' },
    { code: 'hi', label: 'हिंदी' },
  ];

  const SidebarContent = ({ expanded }: { expanded: boolean }) => (
    <>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-gray-100 gap-3">
        <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <Leaf className="w-5 h-5 text-white" />
        </div>
        {expanded && (
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
            {expanded && <span>{t(item.key)}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Language + Logout */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        {expanded && (
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
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-green-50 hover:text-green-700 ${
                      language === lang.code ? 'bg-green-50 text-green-700 font-medium' : ''
                    }`}
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
          {expanded && <span>{t('logout')}</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer — slides in from left */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col z-40 transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent expanded={true} />
      </aside>

      {/* Desktop sidebar — collapsible icon-rail */}
      <aside
        className={`hidden md:flex ${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-100 flex-col transition-all duration-300 flex-shrink-0`}
      >
        <SidebarContent expanded={sidebarOpen} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-3 flex-shrink-0">
          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          {/* Desktop collapse toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:block p-2 rounded-lg hover:bg-gray-100 text-gray-500"
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-sm font-medium text-gray-800">{user?.name}</div>
              <div className="text-xs text-gray-400">{user?.email}</div>
            </div>
            <div className="w-9 h-9 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-green-700 font-semibold text-sm">
                {user?.name?.charAt(0)?.toUpperCase()}
              </span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
