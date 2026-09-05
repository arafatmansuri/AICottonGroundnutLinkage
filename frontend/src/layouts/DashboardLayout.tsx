import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, TrendingUp, Wheat, Users, Briefcase,
  Star, Wallet, Bot, LogOut, Menu, X,
  Globe, ChevronDown, Leaf, UserCircle, Bell,
  TrendingUp as PriceIcon, RefreshCw, DollarSign, Settings,
  AlertTriangle, CheckCheck, ArrowRight,
} from 'lucide-react';
import type { RootState } from '../store';
import { logout } from '../store/authSlice';
import { setLanguage } from '../store/uiSlice';
import { authApi, notificationApi } from '../api';
import { useLanguage } from '../hooks/useLanguage';
import { getRelativeTime } from '../utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

// ── notification type → icon + colour ────────────────────────────────────────
const N_META: Record<string, { dot: string; bg: string }> = {
  CROP_INTEREST:      { dot: 'bg-green-500',  bg: 'bg-green-100'  },
  PRICE_ALERT:        { dot: 'bg-emerald-500', bg: 'bg-emerald-100' },
  BUYER_MATCH:        { dot: 'bg-blue-500',   bg: 'bg-blue-100'   },
  MARKET_ALERT:       { dot: 'bg-amber-500',  bg: 'bg-amber-100'  },
  TRANSACTION_UPDATE: { dot: 'bg-purple-500', bg: 'bg-purple-100' },
  PAYMENT_RECEIVED:   { dot: 'bg-teal-500',   bg: 'bg-teal-100'   },
  AI_RECOMMENDATION:  { dot: 'bg-indigo-500', bg: 'bg-indigo-100' },
  SYSTEM:             { dot: 'bg-gray-400',   bg: 'bg-gray-100'   },
};
const N_DEFAULT = { dot: 'bg-gray-400', bg: 'bg-gray-100' };

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const { user } = useSelector((s: RootState) => s.auth);
  const { language } = useSelector((s: RootState) => s.ui);
  const { t } = useLanguage();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);

  // Poll notifications for FARMER
  const { data: notifData } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => notificationApi.getAll().then(r => r.data.data),
    enabled: user?.role === 'FARMER',
    refetchInterval: 60_000,
  });
  const allNotifs: any[] = (notifData as any[]) ?? [];
  const unreadCount = allNotifs.filter(n => !n.isRead).length;
  const previewNotifs = allNotifs.slice(0, 6); // show top 6 in dropdown

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  const markAllMutation = useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  // Close bell dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    }
    if (bellOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [bellOpen]);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
    setBellOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const farmerNav = [
    { to: '/farmer/dashboard',       icon: LayoutDashboard, key: 'dashboard' },
    { to: '/farmer/market',          icon: TrendingUp,      key: 'market_prices' },
    { to: '/farmer/crops',           icon: Wheat,           key: 'my_crops' },
    { to: '/farmer/buyers',          icon: Users,           key: 'buyers' },
    { to: '/farmer/storage-advisor', icon: Briefcase,       key: 'storage_advisor' },
    { to: '/farmer/quality',         icon: Star,            key: 'quality_check' },
    { to: '/farmer/income',          icon: Wallet,          key: 'income' },
    { to: '/farmer/ai-assistant',    icon: Bot,             key: 'ai_assistant' },
    { to: '/farmer/notifications',   icon: Bell,            key: 'notifications', badge: unreadCount },
    { to: '/farmer/profile',         icon: UserCircle,      key: 'my_profile' },
  ];

  const buyerNav = [
    { to: '/buyer/dashboard',  icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/buyer/crops',      icon: Wheat,           label: 'Browse Crops' },
    { to: '/buyer/interests',  icon: Bell,            label: 'My Interests' },
    { to: '/buyer/profile',    icon: UserCircle,      label: 'My Profile' },
  ];

  const adminNav = [
    { to: '/admin/dashboard',   icon: LayoutDashboard, label: 'Overview' },
    { to: '/admin/farmers',     icon: Users,           label: 'Farmers' },
    { to: '/admin/buyers',      icon: Briefcase,       label: 'Buyers' },
    { to: '/admin/crops',       icon: Wheat,           label: 'Crops' },
    { to: '/admin/market-data', icon: PriceIcon,       label: 'Market Data' },
  ];

  const navItems = user?.role === 'FARMER' ? farmerNav
    : user?.role === 'BUYER' ? buyerNav
    : adminNav;

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

  // ── Sidebar content ─────────────────────────────────────────────────────────
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
              `relative flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-green-50 text-green-700'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {expanded && (
              <span className="flex-1">{(item as any).label ?? t((item as any).key)}</span>
            )}
            {(item as any).badge > 0 && (
              <span className={`flex-shrink-0 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 ${!expanded ? 'absolute top-1 right-1' : ''}`}>
                {(item as any).badge > 99 ? '99+' : (item as any).badge}
              </span>
            )}
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

  // ── Bell dropdown ────────────────────────────────────────────────────────────
  const BellDropdown = () => (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl z-50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-gray-900">Notifications</span>
          {unreadCount > 0 && (
            <span className="min-w-[20px] h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="flex items-center gap-1 text-xs text-green-600 hover:text-green-700 font-medium disabled:opacity-50"
          >
            <CheckCheck className="w-3.5 h-3.5" /> Mark all read
          </button>
        )}
      </div>

      {/* List */}
      <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
        {previewNotifs.length === 0 ? (
          <div className="py-10 text-center">
            <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No notifications</p>
          </div>
        ) : (
          previewNotifs.map((n: any) => {
            const meta = N_META[n.type] ?? N_DEFAULT;
            return (
              <button
                key={n.id}
                onClick={() => {
                  if (!n.isRead) markReadMutation.mutate(n.id);
                  setBellOpen(false);
                  navigate('/farmer/notifications');
                }}
                className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-colors hover:bg-gray-50 ${
                  !n.isRead ? 'bg-green-50/50' : ''
                }`}
              >
                {/* Coloured dot */}
                <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${n.isRead ? 'bg-gray-200' : meta.dot}`} />
                <div className="flex-1 min-w-0">
                  <p className={`text-xs leading-snug truncate ${!n.isRead ? 'font-semibold text-gray-900' : 'font-medium text-gray-700'}`}>
                    {n.title}
                  </p>
                  <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2 leading-relaxed">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-1">{getRelativeTime(n.createdAt)}</p>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-100">
        <Link
          to="/farmer/notifications"
          onClick={() => setBellOpen(false)}
          className="flex items-center justify-center gap-1.5 py-3 text-xs font-semibold text-green-600 hover:text-green-700 hover:bg-green-50 transition-colors"
        >
          View all notifications <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
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

      {/* Mobile drawer */}
      <aside
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-100 flex flex-col z-40 transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent expanded={true} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden md:flex ${sidebarOpen ? 'w-64' : 'w-16'} bg-white border-r border-gray-100 flex-col transition-all duration-300 flex-shrink-0`}
      >
        <SidebarContent expanded={sidebarOpen} />
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-100 flex items-center px-4 gap-2 flex-shrink-0">
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

          {/* ── Bell icon (FARMER only) ── */}
          {user?.role === 'FARMER' && (
            <div ref={bellRef} className="relative">
              <button
                onClick={() => setBellOpen(o => !o)}
                aria-label="Notifications"
                className={`relative p-2 rounded-xl transition-colors ${
                  bellOpen ? 'bg-green-50 text-green-700' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-0.5 leading-none">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {bellOpen && <BellDropdown />}
            </div>
          )}

          {/* ── Profile avatar / link ── */}
          {(user?.role === 'FARMER' || user?.role === 'BUYER') ? (
            <Link
              to={user.role === 'FARMER' ? '/farmer/profile' : '/buyer/profile'}
              title="My Profile"
              className="flex items-center gap-3 rounded-xl px-2 py-1.5 hover:bg-gray-50 transition-colors group ml-1"
            >
              <div className="text-right hidden sm:block">
                <div className="text-sm font-medium text-gray-800 group-hover:text-green-700 transition-colors">{user?.name}</div>
                <div className="text-xs text-gray-400">{user?.email}</div>
              </div>
              <div className="w-9 h-9 bg-green-100 group-hover:bg-green-200 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ring-2 ring-transparent group-hover:ring-green-400">
                <span className="text-green-700 font-semibold text-sm">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </span>
              </div>
            </Link>
          ) : (
            <div className="flex items-center gap-3 ml-1">
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
          )}
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
