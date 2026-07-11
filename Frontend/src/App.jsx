import React from 'react'
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import NewGrievancePage from './pages/NewGrievancePage';
import ProfilePage from './pages/ProfilePage';
import MyGrievancesPage from './pages/MyGrievancesPage';
import RecentGrievancesPage from './pages/RecentGrievancesPage';
import GrievanceDetailsPage from './pages/GrievanceDetailsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import ScrollToTop from './components/ScrollToTop';

// Helper component for ScrollToTop in RouterProvider
const ScrollWrapper = () => {
  return (
    <>
      <ScrollToTop />
      <Outlet />
    </>
  );
};

const PublicRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

const App = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

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
            { path: "/dashboard", element: <DashboardPage /> },
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