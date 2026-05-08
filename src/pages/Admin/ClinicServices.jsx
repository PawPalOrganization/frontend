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
  const [fetchError, setFetchError] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  const [formData, setFormData] = useState({ name: '', description: '', logoUrl: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const searchTimerRef = useRef(null);

  const fetchServices = async (page = 1, search = '') => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await adminClinicServicesService.getAllClinicServices(page, 10, search);
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

  useEffect(() => {
    fetchServices(1, '');
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => fetchServices(1, value), 600);
  };

  const handlePageChange = (page) => fetchServices(page, searchTerm);

  const handleCreate = () => {
    setFormData({ name: '', description: '', logoUrl: '' });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name || '',
      description: service.description || '',
      logoUrl: service.logoUrl || '',
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
      await adminClinicServicesService.createClinicService({
        name: formData.name,
        description: formData.description || undefined,
        logoUrl: formData.logoUrl || undefined,
      });
      setIsCreateModalOpen(false);
      fetchServices(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({ form: error.response?.data?.message || 'Failed to create service' });
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
      fetchServices(currentPage, searchTerm);
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
      fetchServices(currentPage, searchTerm);
    } catch (error) {
      const msg = error.response?.data?.message;
      setDeleteError(msg || 'Failed to delete service.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const renderFormFields = () => (
    <div className={styles.form}>
      {formErrors.form && <div className="alert alert-danger">{formErrors.form}</div>}
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
      key: 'name',
      label: 'Name',
      width: '25%',
    },
    {
      key: 'description',
      label: 'Description',
      width: '45%',
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
      width: '15%',
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
      width: '15%',
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
      </div>

      {fetchError && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          <i className="bi bi-exclamation-triangle" style={{ marginRight: '8px' }}></i>
          {fetchError}
        </div>
      )}

      {loading ? (
        <TablePageSkeleton columns={4} rows={8} />
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
        {renderFormFields()}
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
        {renderFormFields()}
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
