import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';
import styles from './CreateAccount.module.scss';
import logoPawBuddy from '../../assets/images/login/Logo Paw Buddy.png';
import dogImage from '../../assets/images/login/dog.png';

const CreateAccount = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    gender: '',
    acceptTerms: false,
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
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

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^\+?[1-9]\d{1,14}$/.test(formData.phoneNumber.replace(/[\s-]/g, ''))) {
      newErrors.phoneNumber = 'Phone number is invalid (e.g., +1234567890)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.birthDate) {
      newErrors.birthDate = 'Birth date is required';
    }

    if (!formData.gender) {
      newErrors.gender = 'Please select a gender';
    }

    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
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
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        birthDate: formData.birthDate,
        gender: formData.gender,
      });
      navigate(ROUTES.DASHBOARD);
    } catch (error) {
      setErrors({
        form: error.message || 'Registration failed. Please try again.',
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
              <div className="text-center mb-3">
              <h2 className="fw-bold mb-2">Create account</h2>
              <p className="text-muted mb-0 small">
                Welcome! Please enter your information below and get started.
              </p>
            </div>

            {/* Error Alert */}
            {errors.form && (
              <div className="alert alert-danger py-2 small" role="alert">
                {errors.form}
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit}>
              {/* Name Row */}
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label htmlFor="firstName" className="form-label text-muted small mb-1">
                    First Name
                  </label>
                  <input
                    type="text"
                    className={`form-control rounded-3 ${errors.firstName ? 'is-invalid' : ''}`}
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {errors.firstName && (
                    <div className="invalid-feedback small">{errors.firstName}</div>
                  )}
                </div>
                <div className="col-6">
                  <label htmlFor="lastName" className="form-label text-muted small mb-1">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className={`form-control rounded-3 ${errors.lastName ? 'is-invalid' : ''}`}
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {errors.lastName && (
                    <div className="invalid-feedback small">{errors.lastName}</div>
                  )}
                </div>
              </div>

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
                  placeholder="john.doe@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.email && (
                  <div className="invalid-feedback small">{errors.email}</div>
                )}
              </div>

              {/* Phone Number */}
              <div className="mb-2">
                <label htmlFor="phoneNumber" className="form-label text-muted small mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  className={`form-control rounded-3 ${errors.phoneNumber ? 'is-invalid' : ''}`}
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+1234567890"
                  disabled={loading}
                />
                {errors.phoneNumber && (
                  <div className="invalid-feedback small">{errors.phoneNumber}</div>
                )}
              </div>

              {/* Birth Date and Gender Row */}
              <div className="row g-2 mb-2">
                <div className="col-6">
                  <label htmlFor="birthDate" className="form-label text-muted small mb-1">
                    Birth Date
                  </label>
                  <input
                    type="date"
                    className={`form-control rounded-3 ${errors.birthDate ? 'is-invalid' : ''}`}
                    id="birthDate"
                    name="birthDate"
                    placeholder="mm/dd/yyyy"
                    max={new Date().toISOString().split('T')[0]}
                    value={formData.birthDate}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  {errors.birthDate && (
                    <div className="invalid-feedback small">{errors.birthDate}</div>
                  )}
                </div>
                <div className="col-6">
                  <label htmlFor="gender" className="form-label text-muted small mb-1">
                    Gender
                  </label>
                  <select
                    className={`form-select rounded-3 ${errors.gender ? 'is-invalid' : ''}`}
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={loading}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.gender && (
                    <div className="invalid-feedback small">{errors.gender}</div>
                  )}
                </div>
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
                    placeholder="Enter password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={`btn btn-link position-absolute top-50 end-0 translate-middle-y text-muted ${styles.passwordToggle}`}
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex="-1"
                  >
                    <i className={`bi bi-eye${showPassword ? '-slash' : ''} small`}></i>
                  </button>
                </div>
                {errors.password && (
                  <div className="invalid-feedback d-block small">{errors.password}</div>
                )}
              </div>

              {/* Confirm Password */}
              <div className="mb-2">
                <label htmlFor="confirmPassword" className="form-label text-muted small mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  className={`form-control rounded-3 ${errors.confirmPassword ? 'is-invalid' : ''}`}
                  id="confirmPassword"
                  name="confirmPassword"
                  placeholder="Re-enter password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                />
                {errors.confirmPassword && (
                  <div className="invalid-feedback small">{errors.confirmPassword}</div>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="mb-3">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className={`form-check-input ${errors.acceptTerms ? 'is-invalid' : ''}`}
                    id="acceptTerms"
                    name="acceptTerms"
                    checked={formData.acceptTerms}
                    onChange={handleChange}
                    disabled={loading}
                  />
                  <label className="form-check-label small" htmlFor="acceptTerms">
                    Accept Terms and Conditions
                  </label>
                  {errors.acceptTerms && (
                    <div className="invalid-feedback small">{errors.acceptTerms}</div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary w-100 py-2 fw-semibold rounded-3 mb-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Creating account...
                  </>
                ) : (
                  'Create account'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="text-center mt-2">
              <p className="text-muted mb-0 small">
                Already have an account?{' '}
                <Link to={ROUTES.LOGIN} className="text-primary text-decoration-none fw-semibold">
                  Log in here
                </Link>
              </p>
            </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;
