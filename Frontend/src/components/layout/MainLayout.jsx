import { Outlet, useLocation } from 'react-router-dom';
import { Toaster } from 'sonner';
import Navbar from './Navbar';
import Footer from './Footer';

const MainLayout = () => {
  const location = useLocation();
  const hideFooter = location.pathname === '/grievances/new';

  return (
    <div className="min-h-screen flex flex-col bg-background selection:bg-primary/30">
      <Navbar />
      <main className="flex-1 w-full">
        <Outlet />
      </main>
      {!hideFooter && <Footer />}
      <Toaster position="top-right" richColors theme="system" closeButton />
    </div>
  );
};

export default MainLayout;
