import { useState, useEffect, useRef } from 'react';
import adminUserRolesService from '../../services/adminUserRolesService';
import adminPermissionsService from '../../services/adminPermissionsService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './UserRoles.module.scss';

const UserRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchError, setFetchError] = useState('');

  // Full permissions catalog for checkbox picker
  const [allPermissions, setAllPermissions] = useState([]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissionIds: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const searchTimerRef = useRef(null);

  // Fetch roles
  const fetchRoles = async (page = 1, search = '') => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await adminUserRolesService.getAllUserRoles(page, 10, search);
      setRoles(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      setFetchError(error.response?.data?.message || 'Failed to load user roles. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch permissions catalog once
  const fetchPermissions = async () => {
    try {
      const response = await adminPermissionsService.getAllPermissions();
      // API may return { data: [...] } or just an array
      setAllPermissions(response.data || response || []);
    } catch {
      // Error fetching permissions
    }
  };

  useEffect(() => {
    fetchRoles(1, '');
    fetchPermissions();
  }, []);

  // Handle search with debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchRoles(1, value);
    }, 600);
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchRoles(page, searchTerm);
  };

  // Open create modal
  const handleCreate = () => {
    setFormData({ name: '', description: '', permissionIds: [] });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name || '',
      description: role.description || '',
      // API returns full permission objects on the role — extract IDs
      permissionIds: (role.permissions || []).map((p) => p.id),
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (role) => {
    setSelectedRole(role);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Role name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle text input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // Toggle a single permission chip
  const handlePermissionToggle = (permissionId) => {
    setFormData((prev) => {
      const ids = prev.permissionIds.includes(permissionId)
        ? prev.permissionIds.filter((id) => id !== permissionId)
        : [...prev.permissionIds, permissionId];
      return { ...prev, permissionIds: ids };
    });
  };

  // Select all permissions
  const handleSelectAll = () => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: allPermissions.map((p) => p.id),
    }));
  };

  // Deselect all permissions
  const handleDeselectAll = () => {
    setFormData((prev) => ({ ...prev, permissionIds: [] }));
  };

  // Group permissions by token prefix (e.g. "pets.read" → group "pets")
  const getGroupedPermissions = () => {
    return allPermissions.reduce((groups, permission) => {
      const groupKey = permission.token?.split('.')[0] || 'other';
      const groupLabel = groupKey.charAt(0).toUpperCase() + groupKey.slice(1).replace(/-/g, ' ');
      if (!groups[groupLabel]) groups[groupLabel] = [];
      groups[groupLabel].push(permission);
      return groups;
    }, {});
  };

  // Submit create
  const handleCreateSubmit = async () => {
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      await adminUserRolesService.createUserRole({
        name: formData.name,
        description: formData.description || undefined,
        permissionIds: formData.permissionIds,
      });
      setIsCreateModalOpen(false);
      fetchRoles(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to create role',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit edit
  const handleEditSubmit = async () => {
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      await adminUserRolesService.updateUserRole(selectedRole.id, {
        name: formData.name,
        description: formData.description || undefined,
        permissionIds: formData.permissionIds,
      });
      setIsEditModalOpen(false);
      fetchRoles(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to update role',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit delete
  const handleDeleteSubmit = async () => {
    setSubmitLoading(true);
    setDeleteError('');
    try {
      await adminUserRolesService.deleteUserRole(selectedRole.id);
      setIsDeleteModalOpen(false);
      fetchRoles(currentPage, searchTerm);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 409) {
        setDeleteError(message || 'Cannot delete this role because users are assigned to it.');
      } else {
        setDeleteError(message || 'Failed to delete role.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Reusable form fields (shared between Create and Edit modals)
  const renderFormFields = () => (
    <div className={styles.form}>
      {formErrors.form && (
        <div className="alert alert-danger">{formErrors.form}</div>
      )}

      <Input
        label="Role Name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        error={formErrors.name}
        placeholder="e.g. Premium Member"
        icon="bi-shield-lock"
        required
      />

      <div>
        <label className={styles.label}>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Optional description for this role..."
          className={styles.textarea}
          rows={2}
        />
      </div>

      <div>
        {/* Permissions header */}
        <div className={styles.permissionsHeader}>
          <div className={styles.permissionsHeaderLeft}>
            <label className={styles.label}>Permissions</label>
            {formData.permissionIds.length > 0 && (
              <span className={styles.selectedCount}>
                {formData.permissionIds.length} selected
              </span>
            )}
          </div>
          {allPermissions.length > 0 && (
            <div className={styles.selectAllActions}>
              <button
                type="button"
                className={styles.selectAllBtn}
                onClick={handleSelectAll}
                disabled={formData.permissionIds.length === allPermissions.length}
              >
                Select All
              </button>
              <span className={styles.actionDivider}>·</span>
              <button
                type="button"
                className={styles.selectAllBtn}
                onClick={handleDeselectAll}
                disabled={formData.permissionIds.length === 0}
              >
                Deselect All
              </button>
            </div>
          )}
        </div>

        {/* Grouped permission chips */}
        {allPermissions.length === 0 ? (
          <div className={styles.noPermissions}>No permissions available</div>
        ) : (
          <div className={styles.permissionsContainer}>
            {Object.entries(getGroupedPermissions()).map(([groupLabel, permissions]) => (
              <div key={groupLabel} className={styles.permissionGroup}>
                <div className={styles.permissionGroupLabel}>
                  <i className="bi bi-shield"></i>
                  {groupLabel}
                </div>
                <div className={styles.permissionChips}>
                  {permissions.map((permission) => {
                    const isSelected = formData.permissionIds.includes(permission.id);
                    return (
                      <button
                        key={permission.id}
                        type="button"
                        className={`${styles.permissionChip} ${isSelected ? styles.permissionChipActive : ''}`}
                        onClick={() => handlePermissionToggle(permission.id)}
                        title={permission.description || permission.name}
                      >
                        {isSelected && (
                          <i className="bi bi-check2"></i>
                        )}
                        {permission.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  // Table columns
  const columns = [
    {
      key: 'name',
      label: 'Name',
      width: '20%',
    },
    {
      key: 'description',
      label: 'Description',
      width: '25%',
      render: (row) =>
        row.description ? (
          <span className={styles.descriptionCell}>{row.description}</span>
        ) : (
          <span style={{ color: '#ADB5BD' }}>--</span>
        ),
    },
    {
      key: 'permissions',
      label: 'Permissions',
      width: '40%',
      render: (row) => {
        const perms = row.permissions || [];
        if (perms.length === 0) {
          return <span className={styles.emptyPermissions}>No permissions</span>;
        }
        const visible = perms.slice(0, 3);
        const remaining = perms.length - 3;
        return (
          <div className={styles.permissionsCell}>
            {visible.map((p) => (
              <span key={p.id} className={styles.permissionBadge}>
                {p.name}
              </span>
            ))}
            {remaining > 0 && (
              <span className={styles.badgeMore}>+{remaining} more</span>
            )}
          </div>
        );
      },
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: '15%',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className={styles.userRolesPage}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>User Roles</h1>
          <p className={styles.subtitle}>Manage roles and their permissions</p>
        </div>
        <Button
          variant="primary"
          icon="bi-plus-lg"
          onClick={handleCreate}
        >
          Add Role
        </Button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search roles by name..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
            disabled={loading}
          />
        </div>
      </div>

      {/* Error Banner */}
      {fetchError && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          <i className="bi bi-exclamation-triangle" style={{ marginRight: '8px' }}></i>
          {fetchError}
        </div>
      )}

      {/* Data Table */}
      {loading ? (
        <TablePageSkeleton columns={4} rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={roles}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          emptyMessage="No user roles found"
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Role"
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
              Add Role
            </Button>
          </>
        }
      >
        {renderFormFields()}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Role"
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
        {renderFormFields()}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Role"
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
        {deleteError && (
          <div className="alert alert-danger">{deleteError}</div>
        )}
        <p>
          Are you sure you want to delete{' '}
          <strong>{selectedRole?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default UserRoles;
