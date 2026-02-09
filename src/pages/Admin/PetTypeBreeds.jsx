import { useState, useEffect, useRef } from 'react';
import adminPetTypeBreedsService from '../../services/adminPetTypeBreedsService';
import adminPetTypesService from '../../services/adminPetTypesService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './PetTypeBreeds.module.scss';

const PetTypeBreeds = () => {
  const [breeds, setBreeds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPetTypeId, setFilterPetTypeId] = useState('');

  // Pet types for filter & form dropdown
  const [petTypes, setPetTypes] = useState([]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBreed, setSelectedBreed] = useState(null);

  // Form state
  const [formData, setFormData] = useState({ name: '', petTypeId: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const searchTimerRef = useRef(null);

  // Fetch breeds
  const fetchBreeds = async (page = 1, petTypeId = '', search = '') => {
    setLoading(true);
    try {
      const response = await adminPetTypeBreedsService.getAllPetTypeBreeds(page, 10, petTypeId, search);
      setBreeds(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      // Error fetching breeds
    } finally {
      setLoading(false);
    }
  };

  // Fetch pet types for dropdowns
  const fetchPetTypes = async () => {
    try {
      const response = await adminPetTypesService.getAllPetTypes(1, 100);
      setPetTypes(response.data || []);
    } catch (error) {
      // Error fetching pet types
    }
  };

  useEffect(() => {
    fetchBreeds(1, filterPetTypeId, searchTerm);
    fetchPetTypes();
  }, []);

  // Handle search with debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchBreeds(1, filterPetTypeId, value);
    }, 600);
  };

  // Handle pet type filter
  const handleFilterChange = (e) => {
    const value = e.target.value;
    setFilterPetTypeId(value);
    fetchBreeds(1, value, searchTerm);
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchBreeds(page, filterPetTypeId, searchTerm);
  };

  // Open create modal
  const handleCreate = () => {
    setFormData({ name: '', petTypeId: '' });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (breed) => {
    setSelectedBreed(breed);
    setFormData({
      name: breed.name || '',
      petTypeId: breed.petTypeId || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (breed) => {
    setSelectedBreed(breed);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = 'Breed name is required';
    }
    if (!formData.petTypeId) {
      errors.petTypeId = 'Pet type is required';
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
      await adminPetTypeBreedsService.createPetTypeBreed({
        name: formData.name,
        petTypeId: parseInt(formData.petTypeId, 10),
      });
      setIsCreateModalOpen(false);
      fetchBreeds(currentPage, filterPetTypeId, searchTerm);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to create breed',
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
      await adminPetTypeBreedsService.updatePetTypeBreed(selectedBreed.id, {
        name: formData.name,
        petTypeId: parseInt(formData.petTypeId, 10),
      });
      setIsEditModalOpen(false);
      fetchBreeds(currentPage, filterPetTypeId, searchTerm);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to update breed',
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
      await adminPetTypeBreedsService.deletePetTypeBreed(selectedBreed.id);
      setIsDeleteModalOpen(false);
      fetchBreeds(currentPage, filterPetTypeId, searchTerm);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 409) {
        setDeleteError(message || 'Cannot delete this breed because it has related pets. Remove them first.');
      } else {
        setDeleteError(message || 'Failed to delete breed.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Reusable form fields
  const renderFormFields = () => (
    <div className={styles.form}>
      {formErrors.form && (
        <div className="alert alert-danger">{formErrors.form}</div>
      )}

      <Input
        label="Breed Name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        error={formErrors.name}
        placeholder="e.g., Golden Retriever, Persian"
        required
      />

      <div>
        <label className={styles.label}>
          Pet Type <span style={{ color: '#E74C3C' }}>*</span>
        </label>
        <select
          name="petTypeId"
          value={formData.petTypeId}
          onChange={handleInputChange}
          className={`${styles.select} ${formErrors.petTypeId ? styles.selectError : ''}`}
        >
          <option value="">Select Pet Type</option>
          {petTypes.map((type) => (
            <option key={type.id} value={type.id}>
              {type.name}
            </option>
          ))}
        </select>
        {formErrors.petTypeId && (
          <span className={styles.errorText}>{formErrors.petTypeId}</span>
        )}
      </div>
    </div>
  );

  // Table columns
  const columns = [
    {
      key: 'name',
      label: 'Breed Name',
      width: '35%',
    },
    {
      key: 'petType',
      label: 'Pet Type',
      width: '25%',
      render: (row) => (
        <span className={styles.badge}>
          {row.petType?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: '20%',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className={styles.petTypeBreedsPage}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pet Breeds Management</h1>
          <p className={styles.subtitle}>Manage breeds for each pet type</p>
        </div>
        <Button
          variant="primary"
          icon="bi-plus-lg"
          onClick={handleCreate}
        >
          Add Breed
        </Button>
      </div>

      {/* Search & Filter Bar */}
      <div className={styles.searchBar}>
        <div className={styles.filterRow}>
          <div className={styles.searchWrapper}>
            <i className="bi bi-search"></i>
            <input
              type="text"
              placeholder="Search breeds..."
              value={searchTerm}
              onChange={handleSearch}
              className={styles.searchInput}
              disabled={loading}
            />
          </div>
          <select
            value={filterPetTypeId}
            onChange={handleFilterChange}
            className={styles.filterSelect}
            disabled={loading}
          >
            <option value="">All Pet Types</option>
            {petTypes.map((type) => (
              <option key={type.id} value={type.id}>
                {type.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <TablePageSkeleton columns={3} rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={breeds}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          emptyMessage="No breeds found"
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Breed"
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
              Create Breed
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
        title="Edit Breed"
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
        title="Delete Breed"
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
          <strong>{selectedBreed?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default PetTypeBreeds;
