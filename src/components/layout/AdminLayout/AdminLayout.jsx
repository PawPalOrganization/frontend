import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import AdminSidebar from '../AdminSidebar/AdminSidebar';
import styles from './AdminLayout.module.scss';

const AdminLayout = () => {
  // Sidebar starts open on XL screens (>1200px), closed on smaller screens
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1200);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      // Auto-open on XL screens, auto-close on 1200px and below
      if (window.innerWidth > 1200) {
        setIsSidebarOpen(true);
      } else {
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
        className={`${styles.hamburger} ${isSidebarOpen ? styles.hamburgerOpen : ''}`}
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

      <main className={`${styles.mainContent} ${!isSidebarOpen ? styles.sidebarClosed : ''}`}>
        <div className={styles.contentWrapper}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
