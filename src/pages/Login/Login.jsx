import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import styles from './Login.module.scss';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

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

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      setErrors({
        form: error.message || 'Login failed. Please check your credentials.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid vh-100 p-0">
      <div className="row g-0 h-100">
        {/* Left Side - Image */}
        <div className={`col-lg-6 d-none d-lg-flex ${styles.leftSide}`}>
          <div className="p-5 d-flex flex-column h-100">
            {/* Logo */}
            <div className={styles.logo}>
              <h2 className="fw-bold text-primary">
                <span className={styles.pawIcon}>🐾</span> PAW<br />BUDDY
              </h2>
            </div>

            {/* Dog Image - Placeholder */}
            <div className="flex-grow-1 d-flex align-items-center justify-content-center">
              <div className={styles.dogImagePlaceholder}>
                {/* Add your dog image here */}
                <img
                  src="/images/dog-with-toy.png"
                  alt="Happy dog"
                  className="img-fluid"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = '<div class="text-muted fs-1">🐕</div>';
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="col-lg-6 d-flex align-items-center justify-content-center bg-light">
          <div className={`${styles.formCard} bg-white rounded-4 shadow-sm p-5`}>
            {/* User Icon */}
            <div className="text-center mb-4">
              <div className={`${styles.userIcon} rounded-circle bg-light d-inline-flex align-items-center justify-content-center`}>
                <i className="bi bi-person fs-3 text-primary"></i>
              </div>
            </div>

            {/* Form Header */}
            <div className="text-center mb-4">
              <h2 className="fw-bold mb-2">Welcome back</h2>
              <p className="text-muted mb-0">
                Please enter your credentials to log in.
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
              <div className="mb-3">
                <label htmlFor="email" className="form-label text-muted small">
                  Email
                </label>
                <input
                  type="email"
                  className={`form-control py-2 ${errors.email ? 'is-invalid' : ''}`}
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  disabled={loading}
                />
                {errors.email && (
                  <div className="invalid-feedback">{errors.email}</div>
                )}
              </div>

              {/* Password */}
              <div className="mb-4">
                <label htmlFor="password" className="form-label text-muted small">
                  Password
                </label>
                <div className="position-relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`form-control py-2 ${errors.password ? 'is-invalid' : ''}`}
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
                  <div className="invalid-feedback d-block">{errors.password}</div>
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

            {/* Footer */}
            <div className="text-center mt-4">
              <p className="text-muted mb-0 small">
                Don't have an account?{' '}
                <Link to={ROUTES.CREATE_ACCOUNT} className="text-primary text-decoration-none fw-semibold">
                  Create account here
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
