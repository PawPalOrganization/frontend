import { useState, useEffect, useRef } from 'react';
import adminClinicServicesService from '../../services/adminClinicServicesService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './ClinicServices.module.scss';

const ClinicServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [fetchError, setFetchError] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // form state
  const [formData, setFormData] = useState({
    name: '', description: '', logoUrl: '', clinicId: '', isPlatformService: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const searchTimerRef = useRef(null);

  const fetchServices = async (page = 1, search = '', scope = scopeFilter) => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await adminClinicServicesService.getAllClinicServices(page, 10, search, scope);
      setServices(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      setFetchError(error.response?.data?.message || 'Failed to load clinic services.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchServices(1, '', scopeFilter); }, [scopeFilter]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => fetchServices(1, value, scopeFilter), 600);
  };

  const handlePageChange = (page) => fetchServices(page, searchTerm, scopeFilter);

  const handleCreate = () => {
    setFormData({ name: '', description: '', logoUrl: '', clinicId: '', isPlatformService: true });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      logoUrl: service.logoUrl || '',
      clinicId: service.clinicId ? String(service.clinicId) : '',
      isPlatformService: service.isPlatform,
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (service) => {
    setSelectedService(service);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Service name is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCreateSubmit = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description || undefined,
        logoUrl: formData.logoUrl || undefined,
        clinicId: formData.isPlatformService ? null : (parseInt(formData.clinicId, 10) || null),
      };
      await adminClinicServicesService.createClinicService(payload);
      setIsCreateModalOpen(false);
      fetchServices(currentPage, searchTerm, scopeFilter);
    } catch (error) {
      const msg = error.response?.data?.message || 'Failed to create service';
      if (msg.toLowerCase().includes('already exists')) {
        setFormErrors({ name: 'A service with this name already exists in this catalog.' });
      } else {
        setFormErrors({ form: msg });
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      await adminClinicServicesService.updateClinicService(selectedService.id, {
        name: formData.name,
        description: formData.description || undefined,
        logoUrl: formData.logoUrl || undefined,
      });
      setIsEditModalOpen(false);
      fetchServices(currentPage, searchTerm, scopeFilter);
    } catch (error) {
      setFormErrors({ form: error.response?.data?.message || 'Failed to update service' });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setSubmitLoading(true);
    setDeleteError('');
    try {
      await adminClinicServicesService.deleteClinicService(selectedService.id);
      setIsDeleteModalOpen(false);
      fetchServices(currentPage, searchTerm, scopeFilter);
    } catch (error) {
      const msg = error.response?.data?.message;
      setDeleteError(msg || 'Failed to delete service.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderFormFields = (isCreate = false) => (
    <div className={styles.form}>
      {formErrors.form && <div className="alert alert-danger">{formErrors.form}</div>}

      {isCreate && (
        <div className={styles.typeToggle}>
          <button
            type="button"
            className={`${styles.typeBtn} ${formData.isPlatformService ? styles.typeBtnActive : ''}`}
            onClick={() => setFormData((p) => ({ ...p, isPlatformService: true, clinicId: '' }))}
          >
            <i className="bi bi-shield-check" /> Platform Service
          </button>
          <button
            type="button"
            className={`${styles.typeBtn} ${!formData.isPlatformService ? styles.typeBtnActive : ''}`}
            onClick={() => setFormData((p) => ({ ...p, isPlatformService: false }))}
          >
            <i className="bi bi-building" /> Clinic-Specific
          </button>
        </div>
      )}

      {isCreate && !formData.isPlatformService && (
        <Input
          label="Clinic ID"
          name="clinicId"
          value={formData.clinicId}
          onChange={handleInputChange}
          placeholder="Enter clinic ID (e.g. 5)"
          icon="bi-building"
          required
        />
      )}

      <Input
        label="Service Name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        error={formErrors.name}
        placeholder="e.g. Grooming"
        icon="bi-scissors"
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
      <Input
        label="Logo URL"
        name="logoUrl"
        value={formData.logoUrl}
        onChange={handleInputChange}
        placeholder="https://example.com/logo.png"
        icon="bi-image"
      />
    </div>
  );

  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '7%',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0D9AFF' }}>
          #{row.id}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      width: '20%',
      render: (row) => (
        <div>
          <span>{row.name}</span>
          {row.isPlatform && (
            <span className={styles.platformBadge}>
              <i className="bi bi-shield-check" /> Platform
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'clinicId',
      label: 'Owner',
      width: '12%',
      render: (row) =>
        row.isPlatform
          ? <span className={styles.ownerPlatform}>Platform</span>
          : <span className={styles.ownerClinic}>Clinic #{row.clinicId}</span>,
    },
    {
      key: 'description',
      label: 'Description',
      width: '33%',
      render: (row) =>
        row.description ? (
          <span className={styles.descriptionCell}>{row.description}</span>
        ) : (
          <span style={{ color: '#ADB5BD' }}>--</span>
        ),
    },
    {
      key: 'logoUrl',
      label: 'Logo',
      width: '10%',
      render: (row) =>
        row.logoUrl ? (
          <img src={row.logoUrl} alt={row.name} className={styles.logoThumb} />
        ) : (
          <span style={{ color: '#ADB5BD' }}>--</span>
        ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: '12%',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Clinic Services</h1>
          <p className={styles.subtitle}>Manage the catalog of services offered by clinics</p>
        </div>
        <Button variant="primary" icon="bi-plus-lg" onClick={handleCreate}>
          Add Service
        </Button>
      </div>

      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search services..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
            disabled={loading}
          />
        </div>

        <select
          className={styles.scopeSelect}
          value={scopeFilter}
          onChange={(e) => { setScopeFilter(e.target.value); setCurrentPage(1); }}
          disabled={loading}
        >
          <option value="all">All services</option>
          <option value="platform">Platform only</option>
          <option value="clinic">Clinic-specific</option>
        </select>
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
          data={services}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          emptyMessage="No clinic services found"
        />
      )}

      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add Clinic Service"
        size="medium"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={submitLoading}>Cancel</Button>
            <Button variant="primary" onClick={handleCreateSubmit} loading={submitLoading}>Add Service</Button>
          </>
        }
      >
        {renderFormFields(true)}
      </Modal>

      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Clinic Service"
        size="medium"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={submitLoading}>Cancel</Button>
            <Button variant="primary" onClick={handleEditSubmit} loading={submitLoading}>Save Changes</Button>
          </>
        }
      >
        {renderFormFields(false)}
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Clinic Service"
        size="small"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={submitLoading}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteSubmit} loading={submitLoading}>Delete</Button>
          </>
        }
      >
        {deleteError && <div className="alert alert-danger">{deleteError}</div>}
        <p>
          Are you sure you want to delete <strong>{selectedService?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default ClinicServices;
