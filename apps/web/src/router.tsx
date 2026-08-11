import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Home } from './routes/home.js';
import { LoginPage } from './routes/login.js';
import { SignupPage } from './routes/signup.js';
import { BuyerDashboard } from './routes/buyer/dashboard.js';
import { NewRequestPage } from './routes/buyer/new-request.js';
import { RequirementDetailPage } from './routes/buyer/requirement-detail.js';
import { VendorDirectoryPage } from './routes/buyer/vendor-directory.js';
import { ApproverQueuePage } from './routes/buyer/approvals.js';
import { SlaSettingsPage } from './routes/buyer/sla-settings.js';
import { VendorDashboard } from './routes/vendor/dashboard.js';
import { AuthLayout } from './components/layout/auth-layout.js';
import { BuyerLayout } from './components/layout/buyer-layout.js';
import { VendorLayout } from './components/layout/vendor-layout.js';
import { RoleGuard } from './components/role-guard.js';

export const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  {
    element: <AuthLayout />,
    children: [
      { path: "/login", element: <LoginPage /> },
      { path: "/signup", element: <SignupPage /> },
    ],
  },
  {
    element: (
      <RoleGuard roles={["BUYER", "ADMIN"]}>
        <BuyerLayout />
      </RoleGuard>
    ),
    children: [
      { path: '/dashboard', element: <BuyerDashboard /> },
      { path: '/requests/new', element: <NewRequestPage /> },
      { path: '/requests/:id', element: <RequirementDetailPage /> },
      { path: '/directory', element: <VendorDirectoryPage /> },
      { path: '/approvals', element: <ApproverQueuePage /> },
      { path: '/sla-settings', element: <SlaSettingsPage /> },
    ],
  },
  {
    element: (
      <RoleGuard roles={["VENDOR"]}>
        <VendorLayout />
      </RoleGuard>
    ),
    children: [
      { path: "/vendor/dashboard", element: <VendorDashboard /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);
