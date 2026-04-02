import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NewGrievancePage from './pages/NewGrievancePage';
import ProfilePage from './pages/ProfilePage';
import MyGrievancesPage from './pages/MyGrievancesPage';
import RecentGrievancesPage from './pages/RecentGrievancesPage';
import GrievanceDetailsPage from './pages/GrievanceDetailsPage';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './components/layout/MainLayout';
import ScrollToTop from './components/ScrollToTop';

const App = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);

  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
        
        {/* Protected Routes with MainLayout */}
        <Route element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/grievances" element={<MyGrievancesPage />} />
          <Route path="/recent-grievances" element={<RecentGrievancesPage />} />
          <Route path="/grievances/new" element={<NewGrievancePage />} />
          <Route path="/grievances/:id" element={<GrievanceDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Route>

        <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
};

export default App;