import { useState, useEffect, useMemo } from 'react';
import adminClinicStaffRolesService from '../../services/adminClinicStaffRolesService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './ClinicStaffRoles.module.scss';

const ClinicStaffRoles = () => {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchError, setFetchError] = useState('');

  const [allPermissions, setAllPermissions] = useState([]);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);

  const [formData, setFormData] = useState({ name: '', description: '', permissionIds: [] });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    setFetchError('');
    try {
      const [rolesRes, permsRes] = await Promise.all([
        adminClinicStaffRolesService.getAllClinicStaffRoles(),
        adminClinicStaffRolesService.getAllClinicStaffPermissions(),
      ]);
      setRoles(rolesRes.data || rolesRes || []);
      setAllPermissions(permsRes.data || permsRes || []);
    } catch (error) {
      setFetchError(error.response?.data?.message || 'Failed to load clinic staff roles.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) return roles;
    const lower = searchTerm.toLowerCase();
    return roles.filter(
      (r) =>
        r.name?.toLowerCase().includes(lower) ||
        r.description?.toLowerCase().includes(lower)
    );
  }, [roles, searchTerm]);

  const handleCreate = () => {
    setFormData({ name: '', description: '', permissionIds: [] });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleEdit = (role) => {
    setSelectedRole(role);
    setFormData({
      name: role.name || '',
      description: role.description || '',
      permissionIds: (role.permissions || []).map((p) => p.id),
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const validateCreate = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Role name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handlePermissionToggle = (id) => {
    setFormData((prev) => ({
      ...prev,
      permissionIds: prev.permissionIds.includes(id)
        ? prev.permissionIds.filter((x) => x !== id)
        : [...prev.permissionIds, id],
    }));
  };

  const handleSelectAll = () =>
    setFormData((prev) => ({ ...prev, permissionIds: allPermissions.map((p) => p.id) }));

  const handleDeselectAll = () =>
    setFormData((prev) => ({ ...prev, permissionIds: [] }));

  const getGroupedPermissions = () =>
    allPermissions.reduce((groups, permission) => {
      const groupKey = permission.token?.split('.')[0] || 'other';
      const label = groupKey.charAt(0).toUpperCase() + groupKey.slice(1).replace(/-/g, ' ');
      if (!groups[label]) groups[label] = [];
      groups[label].push(permission);
      return groups;
    }, {});

  const handleCreateSubmit = async () => {
    if (!validateCreate()) return;
    setSubmitLoading(true);
    try {
      await adminClinicStaffRolesService.createClinicStaffRole({
        name: formData.name,
        description: formData.description || undefined,
        permissionIds: formData.permissionIds,
      });
      setIsCreateModalOpen(false);
      fetchAll();
    } catch (error) {
      setFormErrors({ form: error.response?.data?.message || 'Failed to create role' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    setSubmitLoading(true);
    try {
      await adminClinicStaffRolesService.updateClinicStaffRolePermissions(
        selectedRole.id,
        formData.permissionIds
      );
      setIsEditModalOpen(false);
      fetchAll();
    } catch (error) {
      setFormErrors({ form: error.response?.data?.message || 'Failed to update permissions' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderPermissionPicker = () => (
    <div>
      <div className={styles.permissionsHeader}>
        <div className={styles.permissionsHeaderLeft}>
          <label className={styles.label}>Permissions</label>
          {formData.permissionIds.length > 0 && (
            <span className={styles.selectedCount}>{formData.permissionIds.length} selected</span>
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
                      {isSelected && <i className="bi bi-check2"></i>}
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
  );

  const columns = [
    { key: 'name', label: 'Name', width: '20%' },
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
        if (perms.length === 0)
          return <span className={styles.emptyPermissions}>No permissions</span>;
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
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clinic Staff Roles</h1>
          <p className={styles.subtitle}>Manage roles and permissions for clinic staff members</p>
        </div>
        <Button variant="primary" icon="bi-plus-lg" onClick={handleCreate}>
          Add Role
        </Button>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search roles..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            disabled={loading}
          />
        </div>
      </div>

      {fetchError && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          <i className="bi bi-exclamation-triangle" style={{ marginRight: '8px' }}></i>
          {fetchError}
        </div>
      )}

      {loading ? (
        <TablePageSkeleton columns={4} rows={6} />
      ) : (
        <DataTable
          columns={columns}
          data={filteredRoles}
          loading={loading}
          currentPage={1}
          totalPages={1}
          totalItems={filteredRoles.length}
          onPageChange={() => {}}
          onEdit={handleEdit}
          emptyMessage="No clinic staff roles found"
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Clinic Staff Role"
        size="medium"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={submitLoading}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateSubmit} loading={submitLoading}>Add Role</Button>
          </>
        }
      >
        <div className={styles.form}>
          {formErrors.form && <div className="alert alert-danger">{formErrors.form}</div>}
          <Input
            label="Role Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={formErrors.name}
            placeholder="e.g. Veterinarian"
            icon="bi-person-badge"
            required
          />
          <div>
            <label className={styles.label}>Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Optional description..."
              className={styles.textarea}
              rows={2}
            />
          </div>
          {renderPermissionPicker()}
        </div>
      </Modal>

      {/* Edit Modal — name is read-only, only permissions editable */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Role Permissions"
        size="medium"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={submitLoading}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSubmit} loading={submitLoading}>Save Permissions</Button>
          </>
        }
      >
        <div className={styles.form}>
          {formErrors.form && <div className="alert alert-danger">{formErrors.form}</div>}
          <div className={styles.readOnlyField}>
            <label className={styles.label}>Role Name</label>
            <div className={styles.readOnlyValue}>
              <i className="bi bi-person-badge"></i>
              {selectedRole?.name}
            </div>
            <p className={styles.readOnlyHint}>Role names cannot be changed after creation.</p>
          </div>
          {renderPermissionPicker()}
        </div>
      </Modal>
    </div>
  );
};

export default ClinicStaffRoles;
