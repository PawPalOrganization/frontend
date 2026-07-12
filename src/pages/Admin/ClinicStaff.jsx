import { useState, useEffect, useRef } from 'react';
import adminClinicStaffService from '../../services/adminClinicStaffService';
import adminClinicStaffRolesService from '../../services/adminClinicStaffRolesService';
import adminClinicsService from '../../services/adminClinicsService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './ClinicStaff.module.scss';

const EMPTY_FORM = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  bio: '',
  gender: '',
  yearsOfExperience: '',
  roleId: '',
  selectedClinicId: '',
  clinicBranchIds: [],
};

const EMPTY_EDIT_FORM = {
  firstName: '',
  lastName: '',
  bio: '',
  yearsOfExperience: '',
  roleId: '',
};

const unwrapData = (response) => response?.data || response || {};

const unwrapList = (response) => {
  const data = unwrapData(response);
  return Array.isArray(data) ? data : [];
};

const getBranchId = (branch) => branch?.id ?? branch?.branchId ?? branch?.clinicBranchId;

const getBranchTitle = (branch) => branch?.title || branch?.name || `Branch #${getBranchId(branch)}`;

const getBranchAddress = (branch) => branch?.address || branch?.location || branch?.city || '';

const getMemberBranchIds = (member) => {
  const branchIds = Array.isArray(member?.branches)
    ? member.branches.map(getBranchId).filter(Boolean)
    : [];

  const directBranchId =
    member?.clinicBranchId ||
    member?.clinicBranch?.id ||
    member?.branch?.id ||
    member?.branchId;

  return [...new Set([...branchIds, directBranchId].filter(Boolean).map(String))];
};

const getMemberClinicId = (member) => {
  const firstBranch = Array.isArray(member?.branches) ? member.branches[0] : null;

  return (
    firstBranch?.clinicId ||
    firstBranch?.clinic?.id ||
    member?.clinicBranch?.clinicId ||
    member?.clinicBranch?.clinic?.id ||
    member?.branch?.clinicId ||
    member?.branch?.clinic?.id ||
    member?.clinicId ||
    member?.clinic?.id ||
    ''
  );
};

const ClinicStaff = () => {
  // ── Staff list ────────────────────────────────────────────────────────────
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClinicId, setFilterClinicId] = useState('');
  const [fetchError, setFetchError] = useState('');
  const searchTimerRef = useRef(null);

  // ── Lookup data ───────────────────────────────────────────────────────────
  const [allRoles, setAllRoles] = useState([]);
  const [allClinics, setAllClinics] = useState([]);
  const [clinicBranches, setClinicBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [editClinicBranches, setEditClinicBranches] = useState([]);
  const [editBranchesLoading, setEditBranchesLoading] = useState(false);
  const [selectedEditClinicId, setSelectedEditClinicId] = useState('');
  const [selectedEditBranchIds, setSelectedEditBranchIds] = useState([]);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);

  // ── Form state ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [editFormData, setEditFormData] = useState(EMPTY_EDIT_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Fetch staff ───────────────────────────────────────────────────────────
  // The backend's `/clinic-staff` list endpoint doesn't filter by clinicId (staff are
  // only related to a clinic indirectly through their branch), so when a clinic filter
  // is active we fetch a large batch and filter/paginate client-side using the same
  // branches -> clinic derivation already used for the edit modal (getMemberClinicId).
  const fetchStaff = async (page = 1, clinicId = '', search = '') => {
    setLoading(true);
    setFetchError('');
    try {
      if (clinicId) {
        const response = await adminClinicStaffService.getAllClinicStaff(1, 1000, search, '');
        const matching = (response.data || []).filter(
          (member) => String(getMemberClinicId(member)) === String(clinicId)
        );
        const limit = 10;
        const total = matching.length;
        const totalPagesCalc = Math.max(1, Math.ceil(total / limit));
        const safePage = Math.min(page, totalPagesCalc);
        const startIdx = (safePage - 1) * limit;
        setStaff(matching.slice(startIdx, startIdx + limit));
        setTotalPages(totalPagesCalc);
        setTotalItems(total);
        setCurrentPage(safePage);
      } else {
        const response = await adminClinicStaffService.getAllClinicStaff(page, 10, search, '');
        setStaff(response.data || []);
        setTotalPages(response.meta?.totalPages || 1);
        setTotalItems(response.meta?.total || 0);
        setCurrentPage(page);
      }
    } catch (error) {
      setFetchError(error.response?.data?.message || 'Failed to load clinic staff.');
    } finally {
      setLoading(false);
    }
  };

  const fetchLookupData = async () => {
    try {
      const [rolesRes, clinicsRes] = await Promise.all([
        adminClinicStaffRolesService.getAllClinicStaffRoles(),
        adminClinicsService.getAllClinics(1, 100, ''),
      ]);
      setAllRoles(rolesRes.data || rolesRes || []);
      setAllClinics(clinicsRes.data || []);
    } catch {
      // non-critical
    }
  };

  useEffect(() => {
    fetchStaff(1, '', '');
    fetchLookupData();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => fetchStaff(1, filterClinicId, value), 600);
  };

  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterClinicId(value);
    fetchStaff(1, value, searchTerm);
  };

  const handlePageChange = (page) => fetchStaff(page, filterClinicId, searchTerm);

  // ── Cascading clinic → branches ───────────────────────────────────────────
  const handleClinicChange = async (clinicId) => {
    setFormData((prev) => ({ ...prev, selectedClinicId: clinicId, clinicBranchIds: [] }));
    if (formErrors.clinicBranchIds) setFormErrors((prev) => ({ ...prev, clinicBranchIds: '' }));
    setClinicBranches([]);
    if (!clinicId) return;
    setBranchesLoading(true);
    try {
      const response = await adminClinicsService.getBranches(parseInt(clinicId, 10));
      setClinicBranches(unwrapList(response));
    } catch {
      setClinicBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  const loadEditBranches = async (clinicId) => {
    setEditClinicBranches([]);
    if (!clinicId) return;
    setEditBranchesLoading(true);
    try {
      const response = await adminClinicsService.getBranches(parseInt(clinicId, 10));
      setEditClinicBranches(unwrapList(response));
    } catch {
      setEditClinicBranches([]);
    } finally {
      setEditBranchesLoading(false);
    }
  };

  const loadEditBranchesForMember = async (member, branchIds) => {
    const clinicId = getMemberClinicId(member);
    if (clinicId) {
      setSelectedEditClinicId(String(clinicId));
      await loadEditBranches(clinicId);
      return;
    }

    if (branchIds.length === 0) {
      setSelectedEditClinicId('');
      setEditClinicBranches([]);
      return;
    }

    setSelectedEditClinicId('');
    setEditClinicBranches([]);
    setEditBranchesLoading(true);
    try {
      const currentBranchId = branchIds[0];
      for (const clinic of allClinics) {
        const response = await adminClinicsService.getBranches(clinic.id);
        const branches = unwrapList(response);
        if (branches.some((branch) => String(getBranchId(branch)) === currentBranchId)) {
          setSelectedEditClinicId(String(clinic.id));
          setEditClinicBranches(branches);
          return;
        }
      }
    } catch {
      setEditClinicBranches([]);
    } finally {
      setEditBranchesLoading(false);
    }
  };

  const toggleCreateBranch = (branchId) => {
    const id = String(branchId);
    setFormData((prev) => {
      const isSelected = prev.clinicBranchIds.includes(id);
      return {
        ...prev,
        clinicBranchIds: isSelected
          ? prev.clinicBranchIds.filter((selectedId) => selectedId !== id)
          : [...prev.clinicBranchIds, id],
      };
    });
    if (formErrors.clinicBranchIds) setFormErrors((prev) => ({ ...prev, clinicBranchIds: '' }));
  };

  const toggleEditBranch = (branchId) => {
    const id = String(branchId);
    setSelectedEditBranchIds((prev) =>
      prev.includes(id) ? prev.filter((selectedId) => selectedId !== id) : [...prev, id]
    );
    if (formErrors.clinicBranchIds) setFormErrors((prev) => ({ ...prev, clinicBranchIds: '' }));
  };

  // ── Modal handlers ────────────────────────────────────────────────────────
  const handleCreate = () => {
    setFormData(EMPTY_FORM);
    setFormErrors({});
    setClinicBranches([]);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (member) => {
    const clinicId = getMemberClinicId(member);
    const branchIds = getMemberBranchIds(member);

    setSelectedStaff(member);
    setEditFormData({
      firstName: member.firstName || '',
      lastName: member.lastName || '',
      bio: member.bio || '',
      yearsOfExperience: member.yearsOfExperience ?? '',
      roleId: member.role?.id || member.roleId || '',
    });
    setSelectedEditClinicId(clinicId ? String(clinicId) : '');
    setSelectedEditBranchIds(branchIds);
    loadEditBranchesForMember(member, branchIds);
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (member) => {
    setSelectedStaff(member);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  // ── Validation ────────────────────────────────────────────────────────────
  const validateCreateForm = () => {
    const errors = {};
    if (!formData.firstName.trim()) errors.firstName = 'First name is required';
    if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
    if (!formData.email.trim()) errors.email = 'Email is required';
    if (!formData.password.trim()) errors.password = 'Password is required';
    if (formData.clinicBranchIds.length === 0) {
      errors.clinicBranchIds = 'Select at least one branch';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEditForm = () => {
    const errors = {};
    if (!editFormData.firstName.trim()) errors.firstName = 'First name is required';
    if (!editFormData.lastName.trim()) errors.lastName = 'Last name is required';
    if (selectedEditBranchIds.length === 0) {
      errors.clinicBranchIds = 'Select at least one branch';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleCreateSubmit = async () => {
    if (!validateCreateForm()) return;
    setSubmitLoading(true);
    try {
      const clinicBranchIds = formData.clinicBranchIds.map((branchId) => parseInt(branchId, 10));
      const response = await adminClinicStaffService.createClinicStaff({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        bio: formData.bio || null,
        gender: formData.gender || null,
        yearsOfExperience: formData.yearsOfExperience ? parseInt(formData.yearsOfExperience, 10) : null,
        roleId: formData.roleId ? parseInt(formData.roleId, 10) : undefined,
        clinicBranchId: clinicBranchIds[0],
      });

      const createdStaff = unwrapData(response);
      const createdStaffId =
        createdStaff.id ||
        createdStaff.staff?.id ||
        response?.id ||
        response?.data?.id ||
        response?.data?.staff?.id;

      if (clinicBranchIds.length > 1 && !createdStaffId) {
        throw new Error('Staff was created, but the response did not include an id for branch assignments.');
      }

      if (clinicBranchIds.length > 1) {
        await adminClinicStaffService.updateClinicStaffAssignments(createdStaffId, clinicBranchIds);
      }

      setIsCreateModalOpen(false);
      fetchStaff(currentPage, filterClinicId, searchTerm);
    } catch (error) {
      setFormErrors({ form: error.response?.data?.message || error.message || 'Failed to create staff member' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!validateEditForm()) return;
    setSubmitLoading(true);
    try {
      const clinicBranchIds = selectedEditBranchIds.map((branchId) => parseInt(branchId, 10));
      await adminClinicStaffService.updateClinicStaff(selectedStaff.id, {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        bio: editFormData.bio || null,
        yearsOfExperience: editFormData.yearsOfExperience
          ? parseInt(editFormData.yearsOfExperience, 10)
          : null,
        roleId: editFormData.roleId ? parseInt(editFormData.roleId, 10) : undefined,
      });
      await adminClinicStaffService.updateClinicStaffAssignments(selectedStaff.id, clinicBranchIds);
      setIsEditModalOpen(false);
      fetchStaff(currentPage, filterClinicId, searchTerm);
    } catch (error) {
      setFormErrors({ form: error.response?.data?.message || error.message || 'Failed to update staff member' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setSubmitLoading(true);
    setDeleteError('');
    try {
      await adminClinicStaffService.deleteClinicStaff(selectedStaff.id);
      setIsDeleteModalOpen(false);
      fetchStaff(currentPage, filterClinicId, searchTerm);
    } catch (error) {
      setDeleteError(error.response?.data?.message || 'Failed to delete staff member.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Create form ───────────────────────────────────────────────────────────
  const renderCreateForm = () => (
    <div className={styles.form}>
      {formErrors.form && <div className="alert alert-danger">{formErrors.form}</div>}
      <div className={styles.formRow}>
        <Input label="First Name" name="firstName" value={formData.firstName} onChange={handleInputChange}
          error={formErrors.firstName} placeholder="Jane" icon="bi-person" required />
        <Input label="Last Name" name="lastName" value={formData.lastName} onChange={handleInputChange}
          error={formErrors.lastName} placeholder="Vet" icon="bi-person" required />
      </div>
      <div className={styles.formRow}>
        <Input label="Email" name="email" value={formData.email} onChange={handleInputChange}
          error={formErrors.email} placeholder="jane@clinic.com" icon="bi-envelope" required />
        <Input label="Password" name="password" type="password" value={formData.password}
          onChange={handleInputChange} error={formErrors.password} placeholder="Temporary password"
          icon="bi-lock" required />
      </div>
      <div className={styles.formRow}>
        <div>
          <label className={styles.label}>Gender</label>
          <select name="gender" value={formData.gender} onChange={handleInputChange} className={styles.select}>
            <option value="">-- Select Gender --</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </div>
        <Input label="Years of Experience" name="yearsOfExperience" type="number"
          value={formData.yearsOfExperience} onChange={handleInputChange}
          placeholder="e.g. 5" icon="bi-briefcase" />
      </div>
      <div>
        <label className={styles.label}>Role</label>
        <select name="roleId" value={formData.roleId} onChange={handleInputChange} className={styles.select}>
          <option value="">-- Select Role --</option>
          {allRoles.map((role) => (
            <option key={role.id} value={role.id}>{role.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className={styles.label}>Bio</label>
        <textarea name="bio" value={formData.bio} onChange={handleInputChange}
          placeholder="Short bio..." className={styles.textarea} rows={2} />
      </div>

      {/* Cascading clinic → branches */}
      <div className={styles.branchSection}>
        <label className={styles.label}>Assign to Clinics</label>
        <select
          value={formData.selectedClinicId}
          onChange={(e) => handleClinicChange(e.target.value)}
          className={styles.select}
        >
          <option value="">-- Select Clinic --</option>
          {allClinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>{clinic.title}</option>
          ))}
        </select>
        {formData.selectedClinicId && (
          <>
            {branchesLoading ? (
              <div className={styles.branchLoadingText}><div className={styles.spinner}></div>Loading branches...</div>
            ) : clinicBranches.length === 0 ? (
              <p className={styles.noBranchesText}>No branches found for this clinic.</p>
            ) : (
              <>
                <div className={styles.branchCheckboxes}>
                {clinicBranches.map((branch) => (
                    <label key={getBranchId(branch)} className={styles.branchCheckbox}>
                      <input
                        type="checkbox"
                        checked={formData.clinicBranchIds.includes(String(getBranchId(branch)))}
                        onChange={() => toggleCreateBranch(getBranchId(branch))}
                      />
                      <span>{getBranchTitle(branch)}</span>
                      {getBranchAddress(branch) && (
                        <span className={styles.branchAddressHint}>{getBranchAddress(branch)}</span>
                      )}
                    </label>
                ))}
                </div>
                <div className={styles.selectedBranchCount}>
                  <i className="bi bi-check2-circle"></i>
                  {formData.clinicBranchIds.length} selected
                </div>
              </>
            )}
          </>
        )}
        {formErrors.clinicBranchIds && (
          <div className="invalid-feedback d-block">{formErrors.clinicBranchIds}</div>
        )}
      </div>
    </div>
  );

  // ── Edit form ─────────────────────────────────────────────────────────────
  const renderEditForm = () => (
    <div className={styles.form}>
      {formErrors.form && <div className="alert alert-danger">{formErrors.form}</div>}
      <div className={styles.formRow}>
        <Input label="First Name" name="firstName" value={editFormData.firstName}
          onChange={handleEditInputChange} error={formErrors.firstName}
          placeholder="Jane" icon="bi-person" required />
        <Input label="Last Name" name="lastName" value={editFormData.lastName}
          onChange={handleEditInputChange} error={formErrors.lastName}
          placeholder="Vet" icon="bi-person" required />
      </div>
      <div className={styles.formRow}>
        <div>
          <label className={styles.label}>Role</label>
          <select name="roleId" value={editFormData.roleId} onChange={handleEditInputChange} className={styles.select}>
            <option value="">-- Select Role --</option>
            {allRoles.map((role) => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>
        <Input label="Years of Experience" name="yearsOfExperience" type="number"
          value={editFormData.yearsOfExperience} onChange={handleEditInputChange}
          placeholder="e.g. 5" icon="bi-briefcase" />
      </div>
      <div>
        <label className={styles.label}>Bio</label>
        <textarea name="bio" value={editFormData.bio} onChange={handleEditInputChange}
          placeholder="Short bio..." className={styles.textarea} rows={2} />
      </div>
      <div className={styles.branchSection}>
        <label className={styles.label}>Assigned Branches</label>
        {editBranchesLoading ? (
          <div className={styles.branchLoadingText}><div className={styles.spinner}></div>Loading branches...</div>
        ) : !selectedEditClinicId ? (
          <p className={styles.noBranchesText}>No clinic found for this staff member.</p>
        ) : editClinicBranches.length === 0 ? (
          <p className={styles.noBranchesText}>No branches found for this clinic.</p>
        ) : (
          <>
            <div className={styles.branchCheckboxes}>
              {editClinicBranches.map((branch) => (
                <label key={getBranchId(branch)} className={styles.branchCheckbox}>
                  <input
                    type="checkbox"
                    checked={selectedEditBranchIds.includes(String(getBranchId(branch)))}
                    onChange={() => toggleEditBranch(getBranchId(branch))}
                  />
                  <span>{getBranchTitle(branch)}</span>
                  {getBranchAddress(branch) && (
                    <span className={styles.branchAddressHint}>{getBranchAddress(branch)}</span>
                  )}
                </label>
              ))}
            </div>
            <div className={styles.selectedBranchCount}>
              <i className="bi bi-check2-circle"></i>
              {selectedEditBranchIds.length} selected
            </div>
          </>
        )}
        {formErrors.clinicBranchIds && (
          <div className="invalid-feedback d-block">{formErrors.clinicBranchIds}</div>
        )}
      </div>
    </div>
  );

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    {
      key: 'fullName',
      label: 'Name',
      width: '25%',
      render: (row) => (
        <div className={styles.nameCell}>
          <div className={styles.nameAvatar}>
            {(row.firstName?.[0] || '').toUpperCase()}{(row.lastName?.[0] || '').toUpperCase()}
          </div>
          <div className={styles.namePrimary}>{row.firstName} {row.lastName}</div>
        </div>
      ),
    },
    {
      key: 'email',
      label: 'Email',
      width: '30%',
      render: (row) => row.email || <span style={{ color: '#ADB5BD' }}>--</span>,
    },
    {
      key: 'role',
      label: 'Role',
      width: '20%',
      render: (row) => {
        const roleName = row.role?.name || row.roleName;
        return roleName
          ? <span className={styles.roleBadge}>{roleName}</span>
          : <span style={{ color: '#ADB5BD' }}>--</span>;
      },
    },
    {
      key: 'yearsOfExperience',
      label: 'Experience',
      width: '12%',
      render: (row) =>
        row.yearsOfExperience != null
          ? `${row.yearsOfExperience} yr${row.yearsOfExperience !== 1 ? 's' : ''}`
          : <span style={{ color: '#ADB5BD' }}>--</span>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: '13%',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clinic Staff</h1>
          <p className={styles.subtitle}>Manage staff members across all clinic branches</p>
        </div>
        <Button variant="primary" icon="bi-plus-lg" onClick={handleCreate}>Add Staff</Button>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.filterRow}>
          <div className={styles.searchWrapper}>
            <i className="bi bi-search"></i>
            <input type="text" placeholder="Search staff..." value={searchTerm}
              onChange={handleSearch} className={styles.searchInput} disabled={loading} />
          </div>
          <select
            value={filterClinicId}
            onChange={handleFilterChange}
            className={styles.filterSelect}
            disabled={loading}
          >
            <option value="">All Clinics</option>
            {allClinics.map((clinic) => (
              <option key={clinic.id} value={clinic.id}>{clinic.title}</option>
            ))}
          </select>
        </div>
      </div>

      {fetchError && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          <i className="bi bi-exclamation-triangle" style={{ marginRight: '8px' }}></i>
          {fetchError}
        </div>
      )}

      {loading ? (
        <TablePageSkeleton columns={5} rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={staff}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          emptyMessage="No clinic staff found"
        />
      )}

      {/* ── Create Modal ── */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}
        title="Add Clinic Staff" size="medium"
        footer={<>
          <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={submitLoading}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateSubmit} loading={submitLoading}>Add Staff</Button>
        </>}>
        {renderCreateForm()}
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
        title="Edit Staff Member" size="medium"
        footer={<>
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={submitLoading}>Cancel</Button>
          <Button variant="primary" onClick={handleEditSubmit} loading={submitLoading}>Save Changes</Button>
        </>}>
        {renderEditForm()}
      </Modal>

      {/* ── Delete Modal ── */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Staff Member" size="small"
        footer={<>
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={submitLoading}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteSubmit} loading={submitLoading}>Delete</Button>
        </>}>
        {deleteError && <div className="alert alert-danger">{deleteError}</div>}
        <p>
          Delete <strong>{selectedStaff?.firstName} {selectedStaff?.lastName}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default ClinicStaff;
