import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../../context/AdminAuthContext';
import styles from './AdminSidebar.module.scss';
import logoPawBuddy from '../../../assets/images/login/Logo Paw Buddy.png';

const AdminSidebar = ({ isOpen = false, onClose = () => {} }) => {
  const { admin, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const navItems = [
    { path: '/admin/dashboard', icon: 'bi-grid', label: 'Dashboard' },
    { path: '/admin/users', icon: 'bi-people', label: 'Users' },
    { path: '/admin/pets', icon: 'bi-heart', label: 'Pets' },
    { path: '/admin/pet-types', icon: 'bi-tag', label: 'Pet Types' },
    { path: '/admin/pet-type-breeds', icon: 'bi-tags', label: 'Breeds' },
    { path: '/admin/admins', icon: 'bi-shield', label: 'Admins' },
    { path: '/admin/user-roles', icon: 'bi-shield-lock', label: 'User Roles' },
    { path: '/admin/notifications', icon: 'bi-bell', label: 'Notifications' },
    { path: '/admin/emails', icon: 'bi-envelope', label: 'Emails' },
    { path: '/admin/app-settings', icon: 'bi-sliders', label: 'App Settings' },
    { divider: true, label: 'Clinics' },
    { path: '/admin/clinics', icon: 'bi-hospital', label: 'Clinics' },
    { path: '/admin/clinic-services', icon: 'bi-scissors', label: 'Clinic Services' },
    { path: '/admin/clinic-staff', icon: 'bi-person-badge', label: 'Clinic Staff' },
    { path: '/admin/clinic-staff-roles', icon: 'bi-shield-plus', label: 'Staff Roles' },
  ];

  const handleNavClick = () => {
    if (window.innerWidth <= 768) onClose();
  };

  const handleProfileNavClick = () => {
    setIsProfileOpen(false);
    handleNavClick();
  };

  return (
    <div className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
      {/* Close Button */}
      <button className={styles.closeButton} onClick={onClose} aria-label="Close sidebar">
        <i className="bi bi-x"></i>
      </button>

      {/* Logo */}
      <div className={styles.logo}>
        <img src={logoPawBuddy} alt="Paw Buddy" className={styles.logoImage} />
      </div>

      {/* Main Navigation */}
      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.map((item) =>
            item.divider ? (
              <li key={`divider-${item.label}`} className={styles.navDivider}>
                <span>{item.label}</span>
              </li>
            ) : (
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
            )
          )}
        </ul>
      </nav>

      {/* Bottom Section */}
      <div className={styles.bottomSection}>
        {/* Expandable profile menu */}
        <div className={`${styles.profileMenu} ${isProfileOpen ? styles.profileMenuOpen : ''}`}>
          <NavLink
            to="/admin/account"
            className={({ isActive }) =>
              `${styles.profileMenuItem} ${isActive ? styles.profileMenuItemActive : ''}`
            }
            onClick={handleProfileNavClick}
          >
            <i className="bi bi-person"></i>
            <span>Account</span>
          </NavLink>
          <NavLink
            to="/admin/settings"
            className={({ isActive }) =>
              `${styles.profileMenuItem} ${isActive ? styles.profileMenuItemActive : ''}`
            }
            onClick={handleProfileNavClick}
          >
            <i className="bi bi-gear"></i>
            <span>Settings</span>
          </NavLink>
          <button className={styles.profileMenuLogout} onClick={handleLogout}>
            <i className="bi bi-box-arrow-right"></i>
            <span>Log out</span>
          </button>
        </div>

        {/* Profile Card — click to expand menu */}
        <button
          className={`${styles.profileCard} ${isProfileOpen ? styles.profileCardOpen : ''}`}
          onClick={() => setIsProfileOpen((prev) => !prev)}
          aria-expanded={isProfileOpen}
        >
          <div className={styles.profileInfo}>
            <div className={styles.avatar}>
              <i className="bi bi-person-circle"></i>
            </div>
            <div className={styles.profileText}>
              <div className={styles.greeting}>Hello</div>
              <div className={styles.adminName}>{admin?.name || 'Admin'}</div>
            </div>
          </div>
          <i
            className={`bi bi-chevron-up ${styles.profileChevron} ${
              isProfileOpen ? styles.profileChevronOpen : ''
            }`}
          ></i>
        </button>
      </div>
    </div>
  );
};

export default AdminSidebar;
