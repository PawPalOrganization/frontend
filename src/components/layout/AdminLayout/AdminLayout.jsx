import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../AdminSidebar/AdminSidebar';
import styles from './AdminLayout.module.scss';

const AdminLayout = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar when screen becomes larger
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const closeSidebar = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className={styles.layout}>
      {/* Hamburger Button - Visible on mobile */}
      <button
        className={styles.hamburger}
        onClick={toggleSidebar}
        aria-label="Toggle sidebar"
      >
        <i className={`bi bi-${isSidebarOpen ? 'x' : 'list'}`}></i>
      </button>

      {/* Overlay - Visible when sidebar is open on mobile */}
      {isSidebarOpen && (
        <div
          className={styles.overlay}
          onClick={closeSidebar}
        />
      )}

      <AdminSidebar isOpen={isSidebarOpen} onClose={closeSidebar} />

      <main className={styles.mainContent}>
        <div className={styles.contentWrapper}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
