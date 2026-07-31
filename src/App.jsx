import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout/AdminLayout';
import PawLoader from './components/common/PawLoader/PawLoader';

// Static imports — needed immediately, before any route-based code splitting matters
import Login from './pages/Login/Login';

// Lazy page chunks — each becomes its own JS file, loaded only when navigated to
// Dashboard now pulls in recharts (clinic approval pie chart), so it moved out of the
// static-import group above — otherwise every page would ship that weight upfront.
const Dashboard = lazy(() => import('./pages/Admin/Dashboard'));
const Users = lazy(() => import('./pages/Admin/Users'));
const Pets = lazy(() => import('./pages/Admin/Pets'));
const PetTypes = lazy(() => import('./pages/Admin/PetTypes'));
const PetTypeBreeds = lazy(() => import('./pages/Admin/PetTypeBreeds'));
const Admins = lazy(() => import('./pages/Admin/Admins'));
const Notifications = lazy(() => import('./pages/Admin/Notifications'));
const UserRoles = lazy(() => import('./pages/Admin/UserRoles'));
const Emails = lazy(() => import('./pages/Admin/Emails'));
const Clinics = lazy(() => import('./pages/Admin/Clinics'));
const ClinicServices = lazy(() => import('./pages/Admin/ClinicServices'));
const ClinicStaff = lazy(() => import('./pages/Admin/ClinicStaff'));
const ClinicStaffRoles = lazy(() => import('./pages/Admin/ClinicStaffRoles'));
const Reviews = lazy(() => import('./pages/Admin/Reviews'));
const DataShareTester = lazy(() => import('./pages/Admin/DataShareTester'));
const ReviewTester = lazy(() => import('./pages/Admin/ReviewTester'));
const AppSettings = lazy(() => import('./pages/Admin/AppSettings'));

function RouteLoadingFallback() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <PawLoader size="large" />
    </div>
  );
}

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
            {/* Suspense wrapper — shows a loader while any lazy page chunk loads */}
            <Route element={<Suspense fallback={<RouteLoadingFallback />}><Outlet /></Suspense>}>
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
              <Route path="reviews" element={<Reviews />} />
              <Route path="data-share-tester" element={<DataShareTester />} />
              <Route path="review-tester" element={<ReviewTester />} />
              <Route path="app-settings" element={<AppSettings />} />
              <Route path="account" element={<div>Account Settings</div>} />
              <Route path="settings" element={<div>Settings</div>} />
            </Route>
          </Route>
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
