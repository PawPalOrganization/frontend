import { createContext, useContext, useState, useEffect } from 'react';
import adminAuthService from '../services/adminAuthService';

const AdminAuthContext = createContext(null);

export const AdminAuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if admin is already logged in on mount
  useEffect(() => {
    const checkAuth = () => {
      try {
        const currentAdmin = adminAuthService.getCurrentAdmin();
        const token = adminAuthService.getToken();

        if (currentAdmin && token) {
          setAdmin(currentAdmin);
          setIsAuthenticated(true);
        }
      } catch (error) {
        // Auth check failed - silently continue
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  // Admin login
  const login = async (credentials) => {
    try {
      const data = await adminAuthService.login(credentials);
      setAdmin(data.admin);
      setIsAuthenticated(true);
      return data;
    } catch (error) {
      // Ensure auth state is cleared on failure
      setAdmin(null);
      setIsAuthenticated(false);
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  };

  // Admin logout
  const logout = () => {
    adminAuthService.logout();
    setAdmin(null);
    setIsAuthenticated(false);
  };

  const value = {
    admin,
    loading,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
};

// Custom hook to use admin auth context
export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
};

export default AdminAuthContext;
