import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import styles from './Login.module.scss';
import logoPawBuddy from '../../assets/images/login/Logo Paw Buddy.png';
import dogImage from '../../assets/images/login/dog.png';

const Login = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading: authLoading } = useAdminAuth();
  const isLoggingIn = useRef(false);

  // Redirect if already authenticated (but not during login attempt)
  useEffect(() => {
    if (isAuthenticated && !isLoggingIn.current && !authLoading) {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    isLoggingIn.current = true; // Mark login attempt in progress

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      // Success - let the useEffect handle navigation
      isLoggingIn.current = false;
    } catch (error) {
      // Failed login - stay on page with error
      isLoggingIn.current = false;
      setErrors({
        form: error.message || 'Login failed. Please check your credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`container-fluid p-0 ${styles.pageBackground}`}>
      <div className="row g-0 h-100">
        {/* Left Side - Image */}
        <div className="col-lg-6 d-none d-lg-flex">
        <div className="p-5 d-flex flex-column h-100">
            {/* Logo */}
            <div className={styles.logo}>
              <img
                src={logoPawBuddy}
                alt="Paw Buddy Logo"
                style={{ maxWidth: '150px' }}
                className="img-fluid"
              />
            </div>

            {/* Dog Image */}
            <div className="flex-grow-1 d-flex align-items-center justify-content-center">
              <div className={styles.dogImagePlaceholder}>
                <img
                  src={dogImage}
                  alt="Happy dog with toy"
                  className="img-fluid"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center">
          <div className="w-100 px-3 px-lg-5 form-slide-in">
            {/* Form Card with Icon */}
            <div className="position-relative my-5 mx-auto" style={{ maxWidth: '600px' }}>
              {/* User Icon - Positioned at top center */}
              <div className="d-flex justify-content-center" style={{ marginBottom: '-45px', zIndex: 10, position: 'relative' }}>
                <div className="rounded-circle bg-white d-flex align-items-center justify-content-center"
                     style={{ width: '90px', height: '90px', border: '2px solid #0D9AFF' }}>
                  <i className="bi bi-person fs-1 text-primary"></i>
                </div>
              </div>

              {/* Form Card */}
              <div className={`bg-white rounded-4 p-5 ${styles.formCard}`} style={{ paddingTop: '3.5rem !important' }}>
              {/* Form Header */}
              <div className="text-center mb-2">
              <h2 className="fw-bold mb-2">Admin Login</h2>
              <p className="text-muted mb-0">
                Sign in to access the admin dashboard.
              </p>
            </div>

            {/* Error Alert */}
            {errors.form && (
              <div className="alert alert-danger py-2" role="alert">
                {errors.form}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Email */}
              <div className="mb-2">
                <label htmlFor="email" className="form-label text-muted small mb-1">
                  Email
                </label>
                <input
                  type="email"
                  className={`form-control rounded-3 ${errors.email ? 'is-invalid' : ''}`}
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={loading}
                />
                {errors.email && (
                  <div className="invalid-feedback small">{errors.email}</div>
                )}
              </div>

              {/* Password */}
              <div className="mb-2">
                <label htmlFor="password" className="form-label text-muted small mb-1">
                  Password
                </label>
                <div className="position-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control rounded-3 ${errors.password ? 'is-invalid' : ''}`}
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={`btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted ${styles.passwordToggle}`}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    <i className={`bi bi-eye${showPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
                {errors.password && (
                  <div className="invalid-feedback d-block small">{errors.password}</div>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold rounded-3"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Logging in...
                  </>
                ) : (
                  'Log in'
                )}
              </button>
            </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
