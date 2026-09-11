import { useState, useEffect, useRef } from 'react';
import adminVaccinationTypesService from '../../services/adminVaccinationTypesService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './VaccinationTypes.module.scss';

const VaccinationTypes = () => {
  const [vaccinationTypes, setVaccinationTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState(null);

  // Form state
  const [formData, setFormData] = useState({ name: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const searchTimerRef = useRef(null);

  const fetchVaccinationTypes = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await adminVaccinationTypesService.getAllVaccinationTypes(page, 10, search);
      setVaccinationTypes(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVaccinationTypes(1, '');
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchVaccinationTypes(1, value);
    }, 600);
  };

  const handlePageChange = (page) => {
    fetchVaccinationTypes(page, searchTerm);
  };

  const handleCreate = () => {
    setFormData({ name: '' });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleEdit = (type) => {
    setSelectedType(type);
    setFormData({ name: type.name || '' });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (type) => {
    setSelectedType(type);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Vaccination type name is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleCreateSubmit = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      await adminVaccinationTypesService.createVaccinationType(formData);
      setIsCreateModalOpen(false);
      fetchVaccinationTypes(currentPage, searchTerm);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      setFormErrors({
        form: status === 409
          ? (message || 'A vaccination type with this name already exists.')
          : (message || 'Failed to create vaccination type'),
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      await adminVaccinationTypesService.updateVaccinationType(selectedType.id, formData);
      setIsEditModalOpen(false);
      fetchVaccinationTypes(currentPage, searchTerm);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      setFormErrors({
        form: status === 409
          ? (message || 'A vaccination type with this name already exists.')
          : (message || 'Failed to update vaccination type'),
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setSubmitLoading(true);
    setDeleteError('');
    try {
      await adminVaccinationTypesService.deleteVaccinationType(selectedType.id);
      setIsDeleteModalOpen(false);
      fetchVaccinationTypes(currentPage, searchTerm);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 409) {
        setDeleteError(message || 'Cannot delete this vaccination type because clinics still have vaccination plans using it.');
      } else {
        setDeleteError(message || 'Failed to delete vaccination type.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    { key: 'name', label: 'Name', width: '55%' },
    {
      key: 'createdAt',
      label: 'Created',
      width: '25%',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '--'),
    },
  ];

  return (
    <div className={styles.vaccinationTypesPage}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Vaccination Types</h1>
          <p className={styles.subtitle}>Manage the platform-wide vaccine catalog clinics pick from</p>
        </div>
        <Button variant="primary" icon="bi-plus-lg" onClick={handleCreate}>
          Add Vaccination Type
        </Button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search vaccination types..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
            disabled={loading}
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <TablePageSkeleton columns={2} rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={vaccinationTypes}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          emptyMessage="No vaccination types found"
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Vaccination Type"
        size="medium"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={submitLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSubmit} loading={submitLoading}>
              Create Type
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          {formErrors.form && <div className="alert alert-danger">{formErrors.form}</div>}
          <Input
            label="Type Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={formErrors.name}
            placeholder="e.g., Rabies (1-Year)"
            required
          />
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Rename Vaccination Type"
        size="medium"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)} disabled={submitLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEditSubmit} loading={submitLoading}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          {formErrors.form && <div className="alert alert-danger">{formErrors.form}</div>}
          <Input
            label="Type Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={formErrors.name}
            placeholder="e.g., Rabies (1-Year)"
            required
          />
          <p className={styles.fieldHint}>
            Renaming updates the label everywhere — clinics reference this type by ID, not by name.
          </p>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Vaccination Type"
        size="small"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={submitLoading}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteSubmit} loading={submitLoading}>
              Delete
            </Button>
          </>
        }
      >
        {deleteError && <div className="alert alert-danger">{deleteError}</div>}
        <p>
          Are you sure you want to delete <strong>{selectedType?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default VaccinationTypes;
