import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdminAuthProvider } from './context/AdminAuthContext';
import AdminLayout from './components/layout/AdminLayout/AdminLayout';
import Login from './pages/Login/Login';
import Dashboard from './pages/Admin/Dashboard';

function App() {
  return (
    <AdminAuthProvider>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />

          {/* Admin Dashboard Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Navigate to="/admin/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="users" element={<div>Users Management</div>} />
            <Route path="pets" element={<div>Pets Management</div>} />
            <Route path="pet-types" element={<div>Pet Types Management</div>} />
            <Route path="admins" element={<div>Admins Management</div>} />
            <Route path="account" element={<div>Account Settings</div>} />
            <Route path="settings" element={<div>Settings</div>} />
          </Route>
        </Routes>
      </Router>
    </AdminAuthProvider>
  );
}

export default App;
