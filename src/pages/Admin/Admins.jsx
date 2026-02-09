import { useState, useEffect, useRef } from 'react';
import adminAdminsService from '../../services/adminAdminsService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './Admins.module.scss';

const Admins = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const searchTimerRef = useRef(null);

  // Fetch admins
  const fetchAdmins = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await adminAdminsService.getAllAdmins(page, 10, search);
      setAdmins(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      // Error fetching admins
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins(1, searchTerm);
  }, []);

  // Handle search with debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchAdmins(1, value);
    }, 600);
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchAdmins(page, searchTerm);
  };

  // Open create modal
  const handleCreate = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (admin) => {
    setSelectedAdmin(admin);
    setFormData({
      name: admin.name || '',
      email: admin.email || '',
      password: '', // Don't pre-fill password
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (admin) => {
    setSelectedAdmin(admin);
    setIsDeleteModalOpen(true);
  };

  // Validate form
  const validateForm = (isEdit = false) => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Admin name is required';
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
      await adminAdminsService.createAdmin(formData);
      setIsCreateModalOpen(false);
      fetchAdmins(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to create admin',
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
      }

      await adminAdminsService.updateAdmin(selectedAdmin.id, updateData);
      setIsEditModalOpen(false);
      fetchAdmins(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to update admin',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit delete
  const handleDeleteSubmit = async () => {
    setSubmitLoading(true);
    try {
      await adminAdminsService.deleteAdmin(selectedAdmin.id);
      setIsDeleteModalOpen(false);
      fetchAdmins(currentPage, searchTerm);
    } catch (error) {
      alert('Failed to delete admin');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      label: 'Name',
      width: '30%',
    },
    {
      key: 'email',
      label: 'Email',
      width: '40%',
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: '30%',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  // Show skeleton while loading
  if (loading) {
    return <TablePageSkeleton columns={3} rows={8} />;
  }

  return (
    <div className={styles.adminsPage}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Admins Management</h1>
          <p className={styles.subtitle}>Manage admin accounts</p>
        </div>
        <Button
          variant="primary"
          icon="bi-plus-lg"
          onClick={handleCreate}
        >
          Add Admin
        </Button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search admins..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
            disabled={loading}
          />
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={admins}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        emptyMessage="No admins found"
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Admin"
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
              Create Admin
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          {formErrors.form && (
            <div className="alert alert-danger">{formErrors.form}</div>
          )}

          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={formErrors.name}
            placeholder="Admin name"
            icon="bi-person"
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            error={formErrors.email}
            placeholder="admin@example.com"
            icon="bi-envelope"
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
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Admin"
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

          <Input
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={formErrors.name}
            placeholder="Admin name"
            icon="bi-person"
            required
          />

          <Input
            label="Email"
            type="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            error={formErrors.email}
            placeholder="admin@example.com"
            icon="bi-envelope"
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
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Admin"
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
          <strong>{selectedAdmin?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Admins;
