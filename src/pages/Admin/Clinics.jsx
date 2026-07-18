import { useState, useEffect, useRef } from 'react';
import adminClinicsService from '../../services/adminClinicsService';
import adminClinicServicesService from '../../services/adminClinicServicesService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './Clinics.module.scss';

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  className: styles.statusPending },
  approved: { label: 'Approved', className: styles.statusApproved },
  rejected: { label: 'Rejected', className: styles.statusRejected },
};

// API uses a 3-state boolean: null = pending, true = approved, false = rejected
const getStatus = (row) => {
  if (row.approved === true) return 'approved';
  if (row.approved === false) return 'rejected';
  return 'pending';
};

const EMPTY_CLINIC_FORM = {
  title: '',
  titleInArabic: '',
  description: '',
  email: '',
  website: '',
  logoUrl: '',
  license: '',
  reviewsEnabled: true,
};

const EMPTY_BRANCH_FORM = {
  title: '',
  description: '',
  address: '',
  phoneNumber: '',
  isMainBranch: false,
  serviceIds: [],
  reviewsEnabled: true,
};

const formatRating = (value) => (value == null ? '--' : Number(value).toFixed(1));

const Clinics = () => {
  // ── Clinics list ──────────────────────────────────────────────────────────
  const [clinics, setClinics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [fetchError, setFetchError] = useState('');
  const searchTimerRef = useRef(null);

  const [selectedClinic, setSelectedClinic] = useState(null);

  // ── Clinic CRUD modals ────────────────────────────────────────────────────
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [formData, setFormData] = useState(EMPTY_CLINIC_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // ── Approve / Reject modals ───────────────────────────────────────────────
  const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState('');

  // ── Branches modal ────────────────────────────────────────────────────────
  const [isBranchesModalOpen, setIsBranchesModalOpen] = useState(false);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [branchesError, setBranchesError] = useState('');

  // ── Services catalog (loaded once for branch form picker) ─────────────────
  const [allServices, setAllServices] = useState([]);

  // ── Branch CRUD modals ────────────────────────────────────────────────────
  const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
  const [isEditBranchModalOpen, setIsEditBranchModalOpen] = useState(false);
  const [isDeleteBranchModalOpen, setIsDeleteBranchModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [branchFormData, setBranchFormData] = useState(EMPTY_BRANCH_FORM);
  const [branchFormErrors, setBranchFormErrors] = useState({});
  const [branchSubmitLoading, setBranchSubmitLoading] = useState(false);
  const [branchDeleteError, setBranchDeleteError] = useState('');

  // ── Fetch clinics ─────────────────────────────────────────────────────────
  const fetchClinics = async (page = 1, search = '') => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await adminClinicsService.getAllClinics(page, 10, search);
      const items = response.data || [];
      setClinics(items);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      setFetchError(error.response?.data?.message || 'Failed to load clinics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinics(1, '');
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => fetchClinics(1, value), 600);
  };

  const handlePageChange = (page) => fetchClinics(page, searchTerm);

  // ── Clinic CRUD handlers ──────────────────────────────────────────────────
  const handleCreate = () => {
    setFormData(EMPTY_CLINIC_FORM);
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleEdit = (clinic) => {
    setSelectedClinic(clinic);
    setFormData({
      title: clinic.title || '',
      titleInArabic: clinic.titleInArabic || '',
      description: clinic.description || '',
      email: clinic.email || '',
      website: clinic.website || '',
      logoUrl: clinic.logoUrl || '',
      license: clinic.license || '',
      reviewsEnabled: clinic.reviewsEnabled ?? true,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (clinic) => {
    setSelectedClinic(clinic);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const validateClinicForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = 'Clinic name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCreateSubmit = async () => {
    if (!validateClinicForm()) return;
    setSubmitLoading(true);
    try {
      await adminClinicsService.createClinic({
        title: formData.title,
        titleInArabic: formData.titleInArabic || null,
        description: formData.description || null,
        email: formData.email || null,
        website: formData.website || null,
        logoUrl: formData.logoUrl || null,
        license: formData.license || null,
        reviewsEnabled: formData.reviewsEnabled,
        // Explicit tri-state default — a brand-new clinic is awaiting review,
        // not rejected. Without this, the backend's column default determines
        // the initial status, which may not be `null`.
        approved: null,
      });
      setIsCreateModalOpen(false);
      fetchClinics(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({ form: error.response?.data?.message || 'Failed to create clinic' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!validateClinicForm()) return;
    setSubmitLoading(true);
    try {
      await adminClinicsService.updateClinic(selectedClinic.id, {
        title: formData.title,
        titleInArabic: formData.titleInArabic || null,
        description: formData.description || null,
        email: formData.email || null,
        website: formData.website || null,
        logoUrl: formData.logoUrl || null,
        license: formData.license || null,
        reviewsEnabled: formData.reviewsEnabled,
      });
      setIsEditModalOpen(false);
      fetchClinics(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({ form: error.response?.data?.message || 'Failed to update clinic' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setSubmitLoading(true);
    setDeleteError('');
    try {
      await adminClinicsService.deleteClinic(selectedClinic.id);
      setIsDeleteModalOpen(false);
      fetchClinics(currentPage, searchTerm);
    } catch (error) {
      setDeleteError(error.response?.data?.message || 'Failed to delete clinic.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Approve / Reject handlers ─────────────────────────────────────────────
  const handleApproveClick = (clinic) => {
    setSelectedClinic(clinic);
    setStatusError('');
    setIsApproveModalOpen(true);
  };

  const handleRejectClick = (clinic) => {
    setSelectedClinic(clinic);
    setStatusError('');
    setIsRejectModalOpen(true);
  };

  const handleApproveSubmit = async () => {
    setStatusLoading(true);
    setStatusError('');
    try {
      await adminClinicsService.approveClinic(selectedClinic.id);
      setIsApproveModalOpen(false);
      fetchClinics(currentPage, searchTerm);
    } catch (error) {
      setStatusError(error.response?.data?.message || 'Failed to approve clinic.');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    setStatusLoading(true);
    setStatusError('');
    try {
      await adminClinicsService.rejectClinic(selectedClinic.id);
      setIsRejectModalOpen(false);
      fetchClinics(currentPage, searchTerm);
    } catch (error) {
      setStatusError(error.response?.data?.message || 'Failed to reject clinic.');
    } finally {
      setStatusLoading(false);
    }
  };

  // ── Branches handlers ─────────────────────────────────────────────────────
  const handleViewBranches = async (clinic) => {
    setSelectedClinic(clinic);
    setBranches([]);
    setBranchesError('');
    setIsBranchesModalOpen(true);
    setBranchesLoading(true);
    try {
      const [branchesRes, servicesRes] = await Promise.all([
        adminClinicsService.getBranches(clinic.id),
        allServices.length === 0
          ? adminClinicServicesService.getAllClinicServices(1, 100, '')
          : Promise.resolve({ data: allServices }),
      ]);
      setBranches(branchesRes.data || branchesRes || []);
      if (allServices.length === 0) setAllServices(servicesRes.data || []);
    } catch (error) {
      setBranchesError(error.response?.data?.message || 'Failed to load branches.');
    } finally {
      setBranchesLoading(false);
    }
  };

  const handleAddBranch = () => {
    setBranchFormData(EMPTY_BRANCH_FORM);
    setBranchFormErrors({});
    setIsAddBranchModalOpen(true);
  };

  const handleEditBranch = (branch) => {
    setSelectedBranch(branch);
    setBranchFormData({
      title: branch.title || '',
      description: branch.description || '',
      address: branch.address || '',
      phoneNumber: branch.phoneNumber || '',
      isMainBranch: branch.isMainBranch || false,
      serviceIds: (branch.services || []).map((s) => s.clinicServiceId),
      reviewsEnabled: branch.reviewsEnabled ?? true,
    });
    setBranchFormErrors({});
    setIsEditBranchModalOpen(true);
  };

  const handleServiceToggle = (serviceId) => {
    setBranchFormData((prev) => ({
      ...prev,
      serviceIds: prev.serviceIds.includes(serviceId)
        ? prev.serviceIds.filter((id) => id !== serviceId)
        : [...prev.serviceIds, serviceId],
    }));
  };

  const handleDeleteBranchClick = (branch) => {
    setSelectedBranch(branch);
    setBranchDeleteError('');
    setIsDeleteBranchModalOpen(true);
  };

  const validateBranchForm = () => {
    const errors = {};
    if (!branchFormData.title.trim()) errors.title = 'Branch name is required';
    setBranchFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleBranchInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setBranchFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (branchFormErrors[name]) setBranchFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const refreshBranches = async () => {
    if (!selectedClinic) return;
    setBranchesLoading(true);
    try {
      const response = await adminClinicsService.getBranches(selectedClinic.id);
      setBranches(response.data || response || []);
    } catch {
      // silently ignore
    } finally {
      setBranchesLoading(false);
    }
  };

  const handleAddBranchSubmit = async () => {
    if (!validateBranchForm()) return;
    setBranchSubmitLoading(true);
    try {
      await adminClinicsService.createBranch(selectedClinic.id, {
        title: branchFormData.title,
        description: branchFormData.description || null,
        address: branchFormData.address || null,
        phoneNumber: branchFormData.phoneNumber || null,
        isMainBranch: branchFormData.isMainBranch,
        isActive: true,
        reviewsEnabled: branchFormData.reviewsEnabled,
        services: branchFormData.serviceIds.map((id) => ({ clinicServiceId: id, cost: 0 })),
        tags: [],
        workingHours: [],
      });
      setIsAddBranchModalOpen(false);
      refreshBranches();
      fetchClinics(currentPage, searchTerm);
    } catch (error) {
      setBranchFormErrors({ form: error.response?.data?.message || 'Failed to create branch' });
    } finally {
      setBranchSubmitLoading(false);
    }
  };

  const handleEditBranchSubmit = async () => {
    if (!validateBranchForm()) return;
    setBranchSubmitLoading(true);
    try {
      await adminClinicsService.updateBranch(selectedClinic.id, selectedBranch.id, {
        title: branchFormData.title,
        description: branchFormData.description || null,
        address: branchFormData.address || null,
        phoneNumber: branchFormData.phoneNumber || null,
        isMainBranch: branchFormData.isMainBranch,
        isActive: true,
        reviewsEnabled: branchFormData.reviewsEnabled,
        services: branchFormData.serviceIds.map((id) => {
          const existing = (selectedBranch.services || []).find((s) => s.clinicServiceId === id);
          return { clinicServiceId: id, cost: existing?.cost ?? 0 };
        }),
        tags: [],
        workingHours: [],
      });
      setIsEditBranchModalOpen(false);
      refreshBranches();
    } catch (error) {
      setBranchFormErrors({ form: error.response?.data?.message || 'Failed to update branch' });
    } finally {
      setBranchSubmitLoading(false);
    }
  };

  const handleDeleteBranchSubmit = async () => {
    setBranchSubmitLoading(true);
    setBranchDeleteError('');
    try {
      await adminClinicsService.deleteBranch(selectedClinic.id, selectedBranch.id);
      setIsDeleteBranchModalOpen(false);
      refreshBranches();
      fetchClinics(currentPage, searchTerm);
    } catch (error) {
      setBranchDeleteError(error.response?.data?.message || 'Failed to delete branch.');
    } finally {
      setBranchSubmitLoading(false);
    }
  };

  // ── Form renderers ────────────────────────────────────────────────────────
  const renderClinicFormFields = (isCreate = false) => (
    <div className={styles.form}>
      {formErrors.form && <div className="alert alert-danger">{formErrors.form}</div>}
      {!isCreate && (
        <div className={styles.ratingInfo}>
          <div className={styles.ratingInfoItem}>
            <i className="bi bi-star-fill" />
            <span>{formatRating(selectedClinic?.avgRating)} avg rating</span>
          </div>
          <div className={styles.ratingInfoItem}>
            <i className="bi bi-chat-left-text" />
            <span>{selectedClinic?.reviewsCount ?? 0} reviews</span>
          </div>
        </div>
      )}
      <div className={styles.formRow}>
        <Input
          label="Clinic Name"
          name="title"
          value={formData.title}
          onChange={handleInputChange}
          error={formErrors.title}
          placeholder="e.g. Paw Care Clinic"
          icon="bi-hospital"
          required
        />
        <Input
          label="Name in Arabic"
          name="titleInArabic"
          value={formData.titleInArabic}
          onChange={handleInputChange}
          placeholder="اسم العيادة"
          icon="bi-translate"
        />
      </div>
      <div className={styles.formRow}>
        <Input
          label="Email"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="clinic@example.com"
          icon="bi-envelope"
        />
        <Input
          label="Website"
          name="website"
          value={formData.website}
          onChange={handleInputChange}
          placeholder="https://example.com"
          icon="bi-globe"
        />
      </div>
      <div className={styles.formRow}>
        <Input
          label="License"
          name="license"
          value={formData.license}
          onChange={handleInputChange}
          placeholder="LIC-XXXXX"
          icon="bi-award"
        />
        <Input
          label="Logo URL"
          name="logoUrl"
          value={formData.logoUrl}
          onChange={handleInputChange}
          placeholder="https://example.com/logo.png"
          icon="bi-image"
        />
      </div>
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

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="reviewsEnabled"
          checked={formData.reviewsEnabled}
          onChange={handleInputChange}
        />
        <span>Reviews enabled</span>
      </label>
      <p className={styles.reviewsHint}>
        Branches also need their own reviews toggle on — both the clinic and the branch must
        have reviews enabled for a user to submit one.
      </p>
    </div>
  );

  const renderBranchFormFields = (isCreate = false) => (
    <div className={styles.form}>
      {branchFormErrors.form && <div className="alert alert-danger">{branchFormErrors.form}</div>}
      {!isCreate && (
        <div className={styles.ratingInfo}>
          <div className={styles.ratingInfoItem}>
            <i className="bi bi-star-fill" />
            <span>{formatRating(selectedBranch?.avgRating)} avg rating</span>
          </div>
          <div className={styles.ratingInfoItem}>
            <i className="bi bi-chat-left-text" />
            <span>{selectedBranch?.reviewsCount ?? 0} reviews</span>
          </div>
        </div>
      )}
      <Input
        label="Branch Name"
        name="title"
        value={branchFormData.title}
        onChange={handleBranchInputChange}
        error={branchFormErrors.title}
        placeholder="e.g. Downtown Branch"
        icon="bi-building"
        required
      />
      <div className={styles.formRow}>
        <Input
          label="Phone Number"
          name="phoneNumber"
          value={branchFormData.phoneNumber}
          onChange={handleBranchInputChange}
          placeholder="+1 555 000 0000"
          icon="bi-telephone"
        />
        <Input
          label="Address"
          name="address"
          value={branchFormData.address}
          onChange={handleBranchInputChange}
          placeholder="123 Main St, City"
          icon="bi-geo-alt"
        />
      </div>
      <div>
        <label className={styles.label}>Description</label>
        <textarea
          name="description"
          value={branchFormData.description}
          onChange={handleBranchInputChange}
          placeholder="Optional branch description..."
          className={styles.textarea}
          rows={2}
        />
      </div>

      {/* Services picker */}
      <div>
        <div className={styles.servicesHeader}>
          <label className={styles.label}>Services Offered</label>
          {branchFormData.serviceIds.length > 0 && (
            <span className={styles.servicesCount}>
              {branchFormData.serviceIds.length} selected
            </span>
          )}
        </div>
        {allServices.length === 0 ? (
          <p className={styles.noServicesText}>No services in catalog yet. Add them via Clinic Services first.</p>
        ) : (
          <div className={styles.serviceChips}>
            {allServices.map((service) => {
              const selected = branchFormData.serviceIds.includes(service.id);
              return (
                <button
                  key={service.id}
                  type="button"
                  className={`${styles.serviceChip} ${selected ? styles.serviceChipActive : ''}`}
                  onClick={() => handleServiceToggle(service.id)}
                  title={service.description || service.name}
                >
                  {service.logoUrl && (
                    <img src={service.logoUrl} alt="" className={styles.serviceChipLogo} />
                  )}
                  {selected && <i className="bi bi-check2"></i>}
                  {service.name}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="isMainBranch"
          checked={branchFormData.isMainBranch}
          onChange={handleBranchInputChange}
        />
        <span>Main branch</span>
      </label>

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="reviewsEnabled"
          checked={branchFormData.reviewsEnabled}
          onChange={handleBranchInputChange}
        />
        <span>Reviews enabled</span>
      </label>
      {selectedClinic && !selectedClinic.reviewsEnabled ? (
        <div className={styles.statusNote}>
          <i className="bi bi-exclamation-triangle" />
          Reviews are currently disabled at the clinic level ({selectedClinic.title}) — turning
          this on alone won't let users submit reviews for this branch until the clinic-level
          toggle is enabled too.
        </div>
      ) : (
        <p className={styles.reviewsHint}>
          Both the clinic and this branch must have reviews enabled for a user to submit one.
        </p>
      )}
    </div>
  );

  // ── Table columns ─────────────────────────────────────────────────────────
  const columns = [
    { key: 'title', label: 'Name', width: '20%' },
    {
      key: 'email',
      label: 'Email',
      width: '18%',
      render: (row) => row.email || <span style={{ color: '#ADB5BD' }}>--</span>,
    },
    {
      key: 'website',
      label: 'Website',
      width: '14%',
      render: (row) =>
        row.website ? (
          <a
            href={row.website}
            target="_blank"
            rel="noreferrer"
            className={styles.websiteLink}
          >
            {row.website.replace(/^https?:\/\//, '')}
          </a>
        ) : (
          <span style={{ color: '#ADB5BD' }}>--</span>
        ),
    },
    {
      key: 'status',
      label: 'Status',
      width: '12%',
      render: (row) => {
        const status = getStatus(row);
        const cfg = STATUS_CONFIG[status] || { label: status, className: styles.statusPending };
        return <span className={`${styles.statusBadge} ${cfg.className}`}>{cfg.label}</span>;
      },
    },
    {
      key: 'reviews',
      label: 'Reviews',
      width: '14%',
      render: (row) => (
        <div className={styles.reviewsColumnCell}>
          <span className={styles.reviewsColumnRating}>
            <i className="bi bi-star-fill"></i> {formatRating(row.avgRating)} ({row.reviewsCount ?? 0})
          </span>
          {!row.reviewsEnabled && <span className={styles.reviewsOffBadge}>Off</span>}
        </div>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: '9%',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
    {
      key: '_actions',
      label: 'Actions',
      width: '15%',
      render: (row) => {
        const status = getStatus(row);
        return (
          <div className={styles.actionButtons}>
            <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => handleEdit(row)} title="Edit">
              <i className="bi bi-pencil"></i>
            </button>
            <button className={`${styles.actionBtn} ${styles.actionBranches}`} onClick={() => handleViewBranches(row)} title="Manage Branches">
              <i className="bi bi-diagram-3"></i>
            </button>

            {/* pending: show both approve + reject */}
            {status === 'pending' && (
              <>
                <button className={`${styles.actionBtn} ${styles.actionApprove}`} onClick={() => handleApproveClick(row)} title="Approve">
                  <i className="bi bi-check-lg"></i>
                </button>
                <button className={`${styles.actionBtn} ${styles.actionReject}`} onClick={() => handleRejectClick(row)} title="Reject">
                  <i className="bi bi-x-lg"></i>
                </button>
              </>
            )}

            {/* approved: only revert (reject) button */}
            {status === 'approved' && (
              <button className={`${styles.actionBtn} ${styles.actionRevert}`} onClick={() => handleRejectClick(row)} title="Revoke Approval">
                <i className="bi bi-arrow-counterclockwise"></i>
              </button>
            )}

            {/* rejected: only reinstate (approve) button */}
            {status === 'rejected' && (
              <button className={`${styles.actionBtn} ${styles.actionRevert}`} onClick={() => handleApproveClick(row)} title="Reinstate Clinic">
                <i className="bi bi-arrow-counterclockwise"></i>
              </button>
            )}

            <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => handleDeleteClick(row)} title="Delete">
              <i className="bi bi-trash"></i>
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clinics</h1>
          <p className={styles.subtitle}>Manage veterinary clinics and their branches</p>
        </div>
        <Button variant="primary" icon="bi-plus-lg" onClick={handleCreate}>
          Add Clinic
        </Button>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search clinics..."
            value={searchTerm}
            onChange={handleSearch}
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
        <TablePageSkeleton columns={6} rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={clinics}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          emptyMessage="No clinics found"
        />
      )}

      {/* ── Create Clinic Modal ── */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Add Clinic" size="medium"
        footer={<>
          <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={submitLoading}>Cancel</Button>
          <Button variant="primary" onClick={handleCreateSubmit} loading={submitLoading}>Add Clinic</Button>
        </>}>
        {renderClinicFormFields(true)}
      </Modal>

      {/* ── Edit Clinic Modal ── */}
      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title="Edit Clinic" size="medium"
        footer={<>
          <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={submitLoading}>Cancel</Button>
          <Button variant="primary" onClick={handleEditSubmit} loading={submitLoading}>Save Changes</Button>
        </>}>
        {renderClinicFormFields(false)}
      </Modal>

      {/* ── Delete Clinic Modal ── */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Delete Clinic" size="small"
        footer={<>
          <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={submitLoading}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteSubmit} loading={submitLoading}>Delete</Button>
        </>}>
        {deleteError && <div className="alert alert-danger">{deleteError}</div>}
        <p>Delete <strong>{selectedClinic?.title}</strong>? This will also remove all associated branches.</p>
      </Modal>

      {/* ── Approve Modal ── */}
      <Modal isOpen={isApproveModalOpen} onClose={() => setIsApproveModalOpen(false)} title="Approve Clinic" size="small"
        footer={<>
          <Button variant="outline" onClick={() => setIsApproveModalOpen(false)} disabled={statusLoading}>Cancel</Button>
          <Button variant="primary" onClick={handleApproveSubmit} loading={statusLoading}>Approve</Button>
        </>}>
        {statusError && <div className="alert alert-danger">{statusError}</div>}
        {getStatus(selectedClinic || {}) === 'rejected' && (
          <div className={styles.statusNote}>
            <i className="bi bi-info-circle"></i>
            This clinic was previously rejected. Approving will make it visible to users again.
          </div>
        )}
        <p>Approve <strong>{selectedClinic?.title}</strong>? The clinic will become visible to users.</p>
      </Modal>

      {/* ── Reject Modal ── */}
      <Modal isOpen={isRejectModalOpen} onClose={() => setIsRejectModalOpen(false)} title={getStatus(selectedClinic || {}) === 'approved' ? 'Revoke Approval' : 'Reject Clinic'} size="small"
        footer={<>
          <Button variant="outline" onClick={() => setIsRejectModalOpen(false)} disabled={statusLoading}>Cancel</Button>
          <Button variant="danger" onClick={handleRejectSubmit} loading={statusLoading}>{getStatus(selectedClinic || {}) === 'approved' ? 'Revoke' : 'Reject'}</Button>
        </>}>
        {statusError && <div className="alert alert-danger">{statusError}</div>}
        {getStatus(selectedClinic || {}) === 'approved' && (
          <div className={styles.statusNote}>
            <i className="bi bi-exclamation-triangle"></i>
            This clinic is currently approved and visible to users. Revoking will hide it immediately.
          </div>
        )}
        <p>
          {getStatus(selectedClinic || {}) === 'approved'
            ? <>Revoke approval for <strong>{selectedClinic?.title}</strong>?</>
            : <>Reject <strong>{selectedClinic?.title}</strong>? The clinic will be hidden from users.</>
          }
        </p>
      </Modal>

      {/* ── Branches List Modal ── */}
      <Modal isOpen={isBranchesModalOpen} onClose={() => setIsBranchesModalOpen(false)}
        title={`Branches — ${selectedClinic?.title || ''}`} size="large"
        footer={<Button variant="outline" onClick={() => setIsBranchesModalOpen(false)}>Close</Button>}>
        <div className={styles.branchesModalContent}>
          <div className={styles.branchesModalHeader}>
            <p className={styles.branchesModalSubtitle}>{branches.length} branch{branches.length !== 1 ? 'es' : ''}</p>
            <Button variant="primary" icon="bi-plus-lg" onClick={handleAddBranch}>Add Branch</Button>
          </div>
          {branchesError && <div className="alert alert-danger">{branchesError}</div>}
          {branchesLoading ? (
            <div className={styles.branchesLoading}><div className={styles.spinner}></div>Loading branches...</div>
          ) : branches.length === 0 ? (
            <div className={styles.branchesEmpty}>
              <i className="bi bi-diagram-3"></i>
              <p>No branches yet. Add one to get started.</p>
            </div>
          ) : (
            <div className={styles.branchesList}>
              {branches.map((branch) => (
                <div key={branch.id} className={styles.branchCard}>
                  <div className={styles.branchInfo}>
                    <div className={styles.branchName}>
                      <i className="bi bi-building"></i>
                      {branch.title}
                      {branch.isMainBranch && <span className={styles.mainBranchBadge}>Main</span>}
                      {!branch.reviewsEnabled && <span className={styles.reviewsOffBadge}>Reviews off</span>}
                    </div>
                    <div className={styles.branchDetail}>
                      <i className="bi bi-star-fill"></i>
                      {formatRating(branch.avgRating)} ({branch.reviewsCount ?? 0} reviews)
                    </div>
                    {branch.address && (
                      <div className={styles.branchDetail}><i className="bi bi-geo-alt"></i>{branch.address}</div>
                    )}
                    {branch.phoneNumber && (
                      <div className={styles.branchDetail}><i className="bi bi-telephone"></i>{branch.phoneNumber}</div>
                    )}
                    {branch.services?.length > 0 && (
                      <div className={styles.branchServiceTags}>
                        {branch.services.slice(0, 4).map((s) => (
                          <span key={s.id} className={styles.branchServiceTag}>{s.name}</span>
                        ))}
                        {branch.services.length > 4 && (
                          <span className={styles.branchServiceTagMore}>+{branch.services.length - 4}</span>
                        )}
                      </div>
                    )}
                  </div>
                  <div className={styles.branchActions}>
                    <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => handleEditBranch(branch)} title="Edit">
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => handleDeleteBranchClick(branch)} title="Delete">
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Add Branch Modal ── */}
      <Modal isOpen={isAddBranchModalOpen} onClose={() => setIsAddBranchModalOpen(false)} title="Add Branch" size="medium"
        footer={<>
          <Button variant="outline" onClick={() => setIsAddBranchModalOpen(false)} disabled={branchSubmitLoading}>Cancel</Button>
          <Button variant="primary" onClick={handleAddBranchSubmit} loading={branchSubmitLoading}>Add Branch</Button>
        </>}>
        {renderBranchFormFields(true)}
      </Modal>

      {/* ── Edit Branch Modal ── */}
      <Modal isOpen={isEditBranchModalOpen} onClose={() => setIsEditBranchModalOpen(false)} title="Edit Branch" size="medium"
        footer={<>
          <Button variant="outline" onClick={() => setIsEditBranchModalOpen(false)} disabled={branchSubmitLoading}>Cancel</Button>
          <Button variant="primary" onClick={handleEditBranchSubmit} loading={branchSubmitLoading}>Save Changes</Button>
        </>}>
        {renderBranchFormFields(false)}
      </Modal>

      {/* ── Delete Branch Modal ── */}
      <Modal isOpen={isDeleteBranchModalOpen} onClose={() => setIsDeleteBranchModalOpen(false)} title="Delete Branch" size="small"
        footer={<>
          <Button variant="outline" onClick={() => setIsDeleteBranchModalOpen(false)} disabled={branchSubmitLoading}>Cancel</Button>
          <Button variant="danger" onClick={handleDeleteBranchSubmit} loading={branchSubmitLoading}>Delete</Button>
        </>}>
        {branchDeleteError && <div className="alert alert-danger">{branchDeleteError}</div>}
        <p>Delete branch <strong>{selectedBranch?.title}</strong>? This cannot be undone.</p>
      </Modal>
    </div>
  );
};

export default Clinics;
