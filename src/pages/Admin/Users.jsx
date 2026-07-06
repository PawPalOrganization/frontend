import { useState, useEffect, useRef } from 'react';
import adminUsersService from '../../services/adminUsersService';
import adminUserRolesService from '../../services/adminUserRolesService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './Users.module.scss';

// Accepts a plain local number (exactly 11 digits, e.g. 01012345678) or an
// international number with a country code (e.g. +201012345678).
const isValidPhoneNumber = (value) => {
  const trimmed = value.trim();
  if (trimmed.startsWith('+')) {
    return /^\+\d{10,15}$/.test(trimmed);
  }
  return /^\d{11}$/.test(trimmed);
};

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // User roles for dropdown
  const [userRoles, setUserRoles] = useState([]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    birthDate: '',
    gender: 'male',
    userRoleId: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const searchTimerRef = useRef(null);

  // Fetch users
  const fetchUsers = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await adminUsersService.getAllUsers(page, 10, search);
      setUsers(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      // Error fetching users
    } finally {
      setLoading(false);
    }
  };

  // Fetch user roles for dropdown
  const fetchUserRoles = async () => {
    try {
      const response = await adminUserRolesService.getAllUserRoles(1, 100);
      setUserRoles(response.data || []);
    } catch (error) {
      // Error fetching user roles
    }
  };

  useEffect(() => {
    fetchUsers(1, searchTerm);
    fetchUserRoles();
  }, []);

  // Handle search with debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchUsers(1, value);
    }, 600);
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchUsers(page, searchTerm);
  };

  // Open create modal
  const handleCreate = () => {
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
      password: '',
      confirmPassword: '',
      birthDate: '',
      gender: 'male',
      userRoleId: '',
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phoneNumber: user.phoneNumber || '',
      password: '', // Don't pre-fill password
      confirmPassword: '',
      birthDate: user.birthDate ? user.birthDate.split('T')[0] : '',
      gender: user.gender || 'male',
      userRoleId: user.userRoleId || user.userRole?.id || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  // Validate form
  const validateForm = (isEdit = false) => {
    const errors = {};

    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }

    if (!isEdit && !formData.password) {
      errors.password = 'Password is required';
    } else if (!isEdit && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    } else if (isEdit && formData.password && formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    // Confirm password is required whenever a password is being set — always on
    // create, and on edit only if the admin is actually changing the password.
    const isSettingPassword = !isEdit || !!formData.password;
    if (isSettingPassword) {
      if (!formData.confirmPassword) {
        errors.confirmPassword = 'Confirm password is required';
      } else if (formData.confirmPassword !== formData.password) {
        errors.confirmPassword = 'Passwords do not match';
      }
    }

    if (!formData.phoneNumber.trim()) {
      errors.phoneNumber = 'Phone number is required';
    } else if (!isValidPhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = 'Enter an 11-digit phone number, or include a country code (e.g. +20xxxxxxxxxx)';
    }

    if (!formData.birthDate) {
      errors.birthDate = 'Birth date is required';
    }

    if (!isEdit && !formData.userRoleId) {
      errors.userRoleId = 'Role is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Submit create
  const handleCreateSubmit = async () => {
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const createData = {
        ...formData,
        userRoleId: parseInt(formData.userRoleId, 10),
      };
      await adminUsersService.createUser(createData);
      setIsCreateModalOpen(false);
      fetchUsers(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to create user',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit edit
  const handleEditSubmit = async () => {
    if (!validateForm(true)) return;

    setSubmitLoading(true);
    try {
      const updateData = { ...formData };
      // Remove password if empty (don't update password)
      if (!updateData.password) {
        delete updateData.password;
        delete updateData.confirmPassword;
      }
      // Include userRoleId as integer if set
      if (updateData.userRoleId) {
        updateData.userRoleId = parseInt(updateData.userRoleId, 10);
      }

      await adminUsersService.updateUser(selectedUser.id, updateData);
      setIsEditModalOpen(false);
      fetchUsers(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to update user',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit delete
  const handleDeleteSubmit = async () => {
    setSubmitLoading(true);
    try {
      await adminUsersService.deleteUser(selectedUser.id);
      setIsDeleteModalOpen(false);
      fetchUsers(currentPage, searchTerm);
    } catch (error) {
      alert('Failed to delete user');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      key: 'firstName',
      label: 'First Name',
      width: '13%',
    },
    {
      key: 'lastName',
      label: 'Last Name',
      width: '13%',
    },
    {
      key: 'email',
      label: 'Email',
      width: '20%',
    },
    {
      key: 'phoneNumber',
      label: 'Phone',
      width: '13%',
    },
    {
      key: 'userHash',
      label: 'User Hash',
      width: '13%',
      render: (row) =>
        row.userHash ? (
          <span className={styles.hashBadge}>{row.userHash}</span>
        ) : (
          <span className={styles.noData}>—</span>
        ),
    },
    {
      key: 'gender',
      label: 'Gender',
      width: '10%',
      render: (row) => (
        <span
          className={`${styles.badge} ${
            row.gender?.toLowerCase() === 'female' ? styles.badgeFemale : ''
          }`}
        >
          {row.gender || 'N/A'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Joined',
      width: '13%',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className={styles.usersPage}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Users Management</h1>
          <p className={styles.subtitle}>Manage all registered users</p>
        </div>
        <Button
          variant="primary"
          icon="bi-plus-lg"
          onClick={handleCreate}
        >
          Add User
        </Button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
            disabled={loading}
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <TablePageSkeleton columns={7} rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={users}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          emptyMessage="No users found"
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New User"
        size="medium"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsCreateModalOpen(false)}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateSubmit}
              loading={submitLoading}
            >
              Create User
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          {formErrors.form && (
            <div className="alert alert-danger">{formErrors.form}</div>
          )}

          <div className={styles.formRow}>
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              error={formErrors.firstName}
              placeholder="John"
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              error={formErrors.lastName}
              placeholder="Doe"
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            error={formErrors.email}
            placeholder="john.doe@example.com"
            icon="bi-envelope"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            error={formErrors.phoneNumber}
            placeholder="01012345678 or +201012345678"
            icon="bi-telephone"
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            error={formErrors.password}
            placeholder="Min 6 characters"
            icon="bi-lock"
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleInputChange}
            error={formErrors.confirmPassword}
            placeholder="Re-enter password"
            icon="bi-lock"
            required
          />

          <div className={styles.formRow}>
            <Input
              label="Birth Date"
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              error={formErrors.birthDate}
              required
            />

            <div>
              <label className={styles.label}>
                Gender <span style={{ color: '#E74C3C' }}>*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className={styles.label}>
              Role <span style={{ color: '#E74C3C' }}>*</span>
            </label>
            <select
              name="userRoleId"
              value={formData.userRoleId}
              onChange={handleInputChange}
              className={`${styles.select} ${formErrors.userRoleId ? styles.selectError : ''}`}
            >
              <option value="">Select Role</option>
              {userRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
            {formErrors.userRoleId && (
              <span className={styles.errorText}>{formErrors.userRoleId}</span>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit User"
        size="medium"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(false)}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleEditSubmit}
              loading={submitLoading}
            >
              Save Changes
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          {formErrors.form && (
            <div className="alert alert-danger">{formErrors.form}</div>
          )}

          <div className={styles.formRow}>
            <Input
              label="First Name"
              name="firstName"
              value={formData.firstName}
              onChange={handleInputChange}
              error={formErrors.firstName}
              placeholder="John"
              required
            />
            <Input
              label="Last Name"
              name="lastName"
              value={formData.lastName}
              onChange={handleInputChange}
              error={formErrors.lastName}
              placeholder="Doe"
              required
            />
          </div>

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            error={formErrors.email}
            placeholder="john.doe@example.com"
            icon="bi-envelope"
            required
          />

          <Input
            label="Phone Number"
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleInputChange}
            error={formErrors.phoneNumber}
            placeholder="01012345678 or +201012345678"
            icon="bi-telephone"
            required
          />

          <Input
            label="Password"
            type="password"
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            error={formErrors.password}
            placeholder="Leave empty to keep current password"
            icon="bi-lock"
          />

          {formData.password && (
            <Input
              label="Confirm Password"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              error={formErrors.confirmPassword}
              placeholder="Re-enter new password"
              icon="bi-lock"
              required
            />
          )}

          <div className={styles.formRow}>
            <Input
              label="Birth Date"
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              error={formErrors.birthDate}
              required
            />

            <div>
              <label className={styles.label}>
                Gender <span style={{ color: '#E74C3C' }}>*</span>
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className={styles.select}
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div>
            <label className={styles.label}>Role</label>
            <select
              name="userRoleId"
              value={formData.userRoleId}
              onChange={handleInputChange}
              className={styles.select}
            >
              <option value="">Select Role</option>
              {userRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete User"
        size="small"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsDeleteModalOpen(false)}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteSubmit}
              loading={submitLoading}
            >
              Delete
            </Button>
          </>
        }
      >
        <p>
          Are you sure you want to delete{' '}
          <strong>
            {selectedUser?.firstName} {selectedUser?.lastName}
          </strong>
          ? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Users;
