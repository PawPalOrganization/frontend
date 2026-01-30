import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import styles from './AdminSidebar.module.scss';

const AdminSidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { path: '/admin/dashboard', icon: 'bi-grid', label: 'Dashboard' },
    { path: '/admin/users', icon: 'bi-people', label: 'Users' },
    { path: '/admin/pets', icon: 'bi-heart', label: 'Pets' },
    { path: '/admin/pet-types', icon: 'bi-tag', label: 'Pet Types' },
    { path: '/admin/admins', icon: 'bi-shield', label: 'Admins' },
  ];

  const bottomNavItems = [
    { path: '/admin/account', icon: 'bi-person', label: 'Account' },
    { path: '/admin/settings', icon: 'bi-gear', label: 'Settings' },
  ];

  const handleNavClick = () => {
    // Close sidebar on mobile when navigating
    if (window.innerWidth <= 768) {
      onClose();
    }
  };

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      {/* Logo */}
      <div className={styles.logo}>
        <img
          src="/src/assets/images/login/Logo Paw Buddy.png"
          alt="Paw Buddy"
          className={styles.logoImage}
        />
      </div>

      {/* Main Navigation */}
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `${styles.navLink} ${isActive ? styles.active : ''}`
                }
                onClick={handleNavClick}
              >
                <i className={`bi ${item.icon} ${styles.navIcon}`}></i>
                <span>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className={styles.bottomSection}>
        {/* Bottom Navigation */}
        <nav className={styles.bottomNav}>
          <ul className={styles.navList}>
            {bottomNavItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `${styles.navLink} ${isActive ? styles.active : ''}`
                  }
                  onClick={handleNavClick}
                >
                  <i className={`bi ${item.icon} ${styles.navIcon}`}></i>
                  <span>{item.label}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        {/* Admin Profile Card */}
        <div className={styles.profileCard}>
          <div className={styles.profileInfo}>
            <div className={styles.avatar}>
              <i className="bi bi-person-circle"></i>
            </div>
            <div className={styles.profileText}>
              <div className={styles.greeting}>Hello</div>
              <div className={styles.adminName}>{admin?.name || 'Admin'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={styles.logoutButton}
            title="Logout"
          >
            <i className="bi bi-box-arrow-right"></i>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminSidebar;
