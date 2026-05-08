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
import Notifications from './pages/Admin/Notifications';
import UserRoles from './pages/Admin/UserRoles';
import Emails from './pages/Admin/Emails';
import Clinics from './pages/Admin/Clinics';
import ClinicServices from './pages/Admin/ClinicServices';
import ClinicStaff from './pages/Admin/ClinicStaff';
import ClinicStaffRoles from './pages/Admin/ClinicStaffRoles';

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
            <Route path="notifications" element={<Notifications />} />
            <Route path="user-roles" element={<UserRoles />} />
            <Route path="emails" element={<Emails />} />
            <Route path="clinics" element={<Clinics />} />
            <Route path="clinic-services" element={<ClinicServices />} />
            <Route path="clinic-staff" element={<ClinicStaff />} />
            <Route path="clinic-staff-roles" element={<ClinicStaffRoles />} />
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
