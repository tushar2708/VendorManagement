import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Home } from './routes/home.js';
import { LoginPage } from './routes/login.js';
import { SignupPage } from './routes/signup.js';
import { InviteLandingPage } from './routes/invite.js';
import { BuyerDashboard } from './routes/buyer/dashboard.js';
import { NewRequestPage } from './routes/buyer/new-request.js';
import { RequirementDetailPage } from './routes/buyer/requirement-detail.js';
import { VendorDirectoryPage } from './routes/buyer/vendor-directory.js';
import { VendorDetailPage } from './routes/buyer/vendor-detail.js';
import { ApproverQueuePage } from './routes/buyer/approvals.js';
import { SlaSettingsPage } from './routes/buyer/sla-settings.js';
import { ScoreAwardPage } from './routes/buyer/score-award.js';
import { ActivityPage } from "./routes/buyer/activity.js";
import { TeamPage } from "./routes/buyer/team.js";
import { VendorDashboard } from './routes/vendor/dashboard.js';
import { PrequalPage } from './routes/vendor/prequal.js';
import { VendorCompletePage } from './routes/vendor/complete.js';
import { FullPackPage } from './routes/vendor/full-pack.js';
import { VendorContractPage } from './routes/vendor/contract.js';
import { VendorProfilePage } from './routes/vendor/profile.js';
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
      { path: '/directory/:id', element: <VendorDetailPage /> },
      { path: '/approvals', element: <ApproverQueuePage /> },
      { path: '/sla-settings', element: <SlaSettingsPage /> },
      { path: '/requests/:id/award', element: <ScoreAwardPage /> },
      { path: "activity", element: <ActivityPage /> },
      { path: "team", element: <TeamPage /> },
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
      { path: '/vendor/prequal', element: <PrequalPage /> },
      { path: "/vendor/complete", element: <VendorCompletePage /> },
      { path: '/vendor/full-pack', element: <FullPackPage /> },
      { path: '/vendor/contract', element: <VendorContractPage /> },
      { path: '/vendor/profile', element: <VendorProfilePage /> },
    ],
  },
  { path: '/invite/:token', element: <InviteLandingPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
