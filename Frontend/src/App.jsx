import { useSelector } from 'react-redux';
import { createBrowserRouter, Navigate, Outlet, RouterProvider } from 'react-router-dom';
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ScrollToTop from './components/ScrollToTop';
import AdminGrievancesPage from './pages/AdminGrievancesPage';
import DashboardPage from './pages/DashboardPage';
import GrievanceDetailsPage from './pages/GrievanceDetailsPage';
import LoginPage from './pages/LoginPage';
import MyGrievancesPage from './pages/MyGrievancesPage';
import NewGrievancePage from './pages/NewGrievancePage';
import OfficerDashboardPage from './pages/OfficerDashboardPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ProfilePage from './pages/ProfilePage';
import RecentGrievancesPage from './pages/RecentGrievancesPage';
import RegisterPage from './pages/RegisterPage';

// Helper component for ScrollToTop in RouterProvider
const ScrollWrapper = () => (
  <>
    <ScrollToTop />
    <Outlet />
  </>
);

const PublicRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

// Role-aware Dashboard Selector
const DashboardRoute = () => {
  const { user } = useSelector((state) => state.auth);
  if (user?.role === 'OFFICER') {
    return <OfficerDashboardPage />;
  }
  return <DashboardPage />;
};

const App = () => {
  const { isAuthenticated, user } = useSelector((state) => state.auth);

  const router = createBrowserRouter([
    {
      element: <ScrollWrapper />,
      children: [
        {
          element: <PublicRoute />,
          children: [
            { path: "/login", element: <LoginPage /> },
            { path: "/register", element: <RegisterPage /> }
          ]
        },
        {
          element: (
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          ),
          children: [
            { path: "/dashboard", element: <DashboardRoute /> },
            { path: "/officer", element: user?.role === 'OFFICER' ? <OfficerDashboardPage /> : <Navigate to="/dashboard" replace /> },
            { path: "/officer-dashboard", element: user?.role === 'OFFICER' ? <OfficerDashboardPage /> : <Navigate to="/dashboard" replace /> },
            { path: "/admin", element: user?.role === 'ADMIN' ? <DashboardPage /> : <Navigate to="/dashboard" replace /> },
            { path: "/admin/grievances", element: <ProtectedRoute allowedRoles={['ADMIN']}><AdminGrievancesPage /></ProtectedRoute> },
            { path: "/grievances", element: <MyGrievancesPage /> },
            { path: "/recent-grievances", element: <RecentGrievancesPage /> },
            { path: "/grievances/new", element: <NewGrievancePage /> },
            { path: "/grievances/:id", element: <GrievanceDetailsPage /> },
            { path: "/profile", element: <ProfilePage /> },
            { path: "/privacy-policy", element: <PrivacyPolicyPage /> }
          ]
        },
        {
          path: "/",
          element: <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        },
        {
          path: "*",
          element: <Navigate to="/" replace />
        }
      ]
    }
  ]);

  return <RouterProvider router={router} />;
};

export default App;