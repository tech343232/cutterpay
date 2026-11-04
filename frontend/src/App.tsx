import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '@/context/AuthContext'
import { ToastProvider } from '@/context/ToastContext'
import { AppShell } from '@/components/layout/AppShell'
import { AdminRoute, GuestRoute, UserRoute } from '@/components/layout/Guards'
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import DemoLogin from '@/pages/DemoLogin'
import Dashboard from '@/pages/Dashboard'
import Market from '@/pages/Market'
import Funds from '@/pages/Funds'
import Portfolio from '@/pages/Portfolio'
import History from '@/pages/History'
import Reports from '@/pages/Reports'
import WalletPage from '@/pages/WalletPage'
import AdminOverview from '@/pages/admin/AdminOverview'
import AdminUsers from '@/pages/admin/AdminUsers'
import AdminUserDetail from '@/pages/admin/AdminUserDetail'
import AdminReports from '@/pages/admin/AdminReports'
import '@/lib/chart'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/demo/:mode" element={<DemoLogin />} />
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/login/tester" element={<Login variant="tester" />} />
              <Route path="/login/admin" element={<Login variant="admin" />} />
              <Route path="/registro" element={<Register />} />
            </Route>

            <Route element={<UserRoute />}>
              <Route path="/app" element={<AppShell />}>
                <Route index element={<Dashboard />} />
                <Route path="fondos" element={<Funds />} />
                <Route path="mercado" element={<Market />} />
                <Route path="mercado/:symbol" element={<Market />} />
                <Route path="portafolio" element={<Portfolio />} />
                <Route path="historial" element={<History />} />
                <Route path="reportes" element={<Reports />} />
                <Route path="billetera" element={<WalletPage />} />
              </Route>
            </Route>

            <Route element={<AdminRoute />}>
              <Route path="/admin" element={<AppShell admin />}>
                <Route index element={<AdminOverview />} />
                <Route path="usuarios" element={<AdminUsers />} />
                <Route path="usuarios/:id" element={<AdminUserDetail />} />
                <Route path="reportes" element={<AdminReports />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
