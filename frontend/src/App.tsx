import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Provider, useSelector } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { store } from './store';
import type { RootState } from './store';
import DashboardLayout from './layouts/DashboardLayout';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Farmer pages
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import FarmerCropsPage from './pages/farmer/FarmerCropsPage';
import MarketPricesPage from './pages/farmer/MarketPricesPage';
import BuyerMarketplacePage from './pages/farmer/BuyerMarketplacePage';
import AIAssistantPage from './pages/farmer/AIAssistantPage';
import IncomeDashboardPage from './pages/farmer/IncomeDashboardPage';
import StorageAdvisorPage from './pages/farmer/StorageAdvisorPage';
import QualityCheckPage from './pages/farmer/QualityCheckPage';
import TransactionsPage from './pages/farmer/TransactionsPage';
import NotificationsPage from './pages/farmer/NotificationsPage';

// Buyer pages
import BuyerDashboard from './pages/buyer/BuyerDashboard';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 60 * 1000, // 1 min
      refetchOnWindowFocus: false,
    },
  },
});

// Protected route component
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to user's own dashboard
    if (user.role === 'FARMER') return <Navigate to="/farmer/dashboard" replace />;
    if (user.role === 'BUYER') return <Navigate to="/buyer/dashboard" replace />;
    return <Navigate to="/admin/dashboard" replace />;
  }
  return <>{children}</>;
}

// Redirect root based on role
function RootRedirect() {
  const { isAuthenticated, user } = useSelector((s: RootState) => s.auth);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role === 'FARMER') return <Navigate to="/farmer/dashboard" replace />;
  if (user?.role === 'BUYER') return <Navigate to="/buyer/dashboard" replace />;
  if (user?.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
  return <Navigate to="/login" replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/" element={<RootRedirect />} />

      {/* Farmer routes */}
      <Route path="/farmer/*" element={
        <ProtectedRoute allowedRoles={['FARMER']}>
          <DashboardLayout>
            <Routes>
              <Route path="dashboard" element={<FarmerDashboard />} />
              <Route path="crops" element={<FarmerCropsPage />} />
              <Route path="market" element={<MarketPricesPage />} />
              <Route path="buyers" element={<BuyerMarketplacePage />} />
              <Route path="compare" element={<BuyerMarketplacePage />} />
              <Route path="storage-advisor" element={<StorageAdvisorPage />} />
              <Route path="quality" element={<QualityCheckPage />} />
              <Route path="income" element={<IncomeDashboardPage />} />
              <Route path="ai-assistant" element={<AIAssistantPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="notifications" element={<NotificationsPage />} />
              <Route path="*" element={<Navigate to="/farmer/dashboard" replace />} />
            </Routes>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Buyer routes */}
      <Route path="/buyer/*" element={
        <ProtectedRoute allowedRoles={['BUYER']}>
          <DashboardLayout>
            <Routes>
              <Route path="dashboard" element={<BuyerDashboard />} />
              <Route path="offers" element={<BuyerDashboard />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="*" element={<Navigate to="/buyer/dashboard" replace />} />
            </Routes>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Admin routes */}
      <Route path="/admin/*" element={
        <ProtectedRoute allowedRoles={['ADMIN']}>
          <DashboardLayout>
            <Routes>
              <Route path="dashboard" element={<AdminDashboard />} />
              <Route path="farmers" element={<AdminDashboard />} />
              <Route path="buyers" element={<AdminDashboard />} />
              <Route path="transactions" element={<AdminDashboard />} />
              <Route path="market-data" element={<AdminDashboard />} />
              <Route path="ai-monitoring" element={<AdminDashboard />} />
              <Route path="audit-logs" element={<AdminDashboard />} />
              <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
            </Routes>
          </DashboardLayout>
        </ProtectedRoute>
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#fff',
                color: '#1a2e22',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                fontSize: '14px',
              },
              success: { iconTheme: { primary: '#16a34a', secondary: '#fff' } },
              error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
            }}
          />
        </BrowserRouter>
      </QueryClientProvider>
    </Provider>
  );
}

export default App;
