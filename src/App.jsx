import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout/AdminLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Admin/Dashboard';
import Users from './pages/Admin/Users';
import Pets from './pages/Admin/Pets';
import PetTypes from './pages/Admin/PetTypes';
import PetTypeBreeds from './pages/Admin/PetTypeBreeds';
import Admins from './pages/Admin/Admins';

const AppSettings = lazy(() => import('./pages/Admin/AppSettings'));

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Dashboard Routes - Protected */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="pets" element={<Pets />} />
            <Route path="pet-types" element={<PetTypes />} />
            <Route path="pet-type-breeds" element={<PetTypeBreeds />} />
            <Route path="admins" element={<Admins />} />
            <Route path="app-settings" element={<Suspense fallback={null}><AppSettings /></Suspense>} />
            <Route path="account" element={<div>Account Settings</div>} />
            <Route path="settings" element={<div>Settings</div>} />
          </Route>
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
