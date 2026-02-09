import { useState, useEffect, useRef } from 'react';
import adminPetTypesService from '../../services/adminPetTypesService';
import adminFilesService from '../../services/adminFilesService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './PetTypes.module.scss';

const PetTypes = () => {
  const [petTypes, setPetTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPetType, setSelectedPetType] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    imageUrl: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const searchTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch pet types
  const fetchPetTypes = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await adminPetTypesService.getAllPetTypes(page, 10, search);
      setPetTypes(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error(error);
      // Error fetching pet types
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPetTypes(1, searchTerm);
  }, []);

  // Handle search with debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchPetTypes(1, value);
    }, 600);
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchPetTypes(page, searchTerm);
  };

  // Open create modal
  const handleCreate = () => {
    setFormData({
      name: '',
      imageUrl: '',
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (petType) => {
    setSelectedPetType(petType);
    setFormData({
      name: petType.name || '',
      imageUrl: petType.imageUrl || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (petType) => {
    setSelectedPetType(petType);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Pet type name is required';
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

  // Handle file upload
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadLoading(true);
    try {
      const response = await adminFilesService.uploadFile(file);
      const url = response.data?.signedUrl || response.data?.publicUrl || response.data?.url || '';
      setFormData((prev) => ({ ...prev, imageUrl: url }));
    } catch {
      setFormErrors((prev) => ({ ...prev, imageUrl: 'Failed to upload image' }));
    } finally {
      setUploadLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Submit create
  const handleCreateSubmit = async () => {
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      await adminPetTypesService.createPetType(formData);
      setIsCreateModalOpen(false);
      fetchPetTypes(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to create pet type',
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
      await adminPetTypesService.updatePetType(selectedPetType.id, formData);
      setIsEditModalOpen(false);
      fetchPetTypes(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to update pet type',
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
      await adminPetTypesService.deletePetType(selectedPetType.id);
      setIsDeleteModalOpen(false);
      fetchPetTypes(currentPage, searchTerm);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 409) {
        setDeleteError(message || 'Cannot delete this pet type because it has related records (pets or breeds). Remove them first.');
      } else {
        setDeleteError(message || 'Failed to delete pet type.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      key: 'imageUrl',
      label: 'Image',
      width: '15%',
      render: (row) =>
        row.imageUrl?.startsWith('http') ? (
          <img
            src={row.imageUrl}
            alt={row.name}
            className={styles.typeImage}
          />
        ) : (
          <div className={styles.noImage}>
            <i className="bi bi-image"></i>
          </div>
        ),
    },
    {
      key: 'name',
      label: 'Type Name',
      width: '35%',
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: '20%',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  return (
    <div className={styles.petTypesPage}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pet Types Management</h1>
          <p className={styles.subtitle}>Manage available pet types</p>
        </div>
        <Button
          variant="primary"
          icon="bi-plus-lg"
          onClick={handleCreate}
        >
          Add Pet Type
        </Button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search pet types..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
            disabled={loading}
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <TablePageSkeleton columns={3} rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={petTypes}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          emptyMessage="No pet types found"
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Pet Type"
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
              Create Pet Type
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          {formErrors.form && (
            <div className="alert alert-danger">{formErrors.form}</div>
          )}

          <Input
            label="Type Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={formErrors.name}
            placeholder="e.g., Dog, Cat, Bird"
            required
          />

          <div>
            <label className={styles.label}>Image</label>
            <div className={styles.uploadRow}>
              <button
                type="button"
                className={styles.uploadButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
              >
                <i className={`bi ${uploadLoading ? 'bi-arrow-repeat' : 'bi-upload'}`}></i>
                {uploadLoading ? 'Uploading...' : 'Upload'}
              </button>
              <span className={styles.orText}>or</span>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="Paste image URL"
                className={styles.urlInput}
              />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            {formErrors.imageUrl && (
              <span className={styles.errorText}>{formErrors.imageUrl}</span>
            )}
          </div>

          {formData.imageUrl?.startsWith('http') && (
            <div className={styles.imagePreview}>
              <img src={formData.imageUrl} alt="Preview" />
            </div>
          )}
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Pet Type"
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
            label="Type Name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            error={formErrors.name}
            placeholder="e.g., Dog, Cat, Bird"
            required
          />

          <div>
            <label className={styles.label}>Image</label>
            <div className={styles.uploadRow}>
              <button
                type="button"
                className={styles.uploadButton}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadLoading}
              >
                <i className={`bi ${uploadLoading ? 'bi-arrow-repeat' : 'bi-upload'}`}></i>
                {uploadLoading ? 'Uploading...' : 'Upload'}
              </button>
              <span className={styles.orText}>or</span>
              <input
                type="text"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleInputChange}
                placeholder="Paste image URL"
                className={styles.urlInput}
              />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              style={{ display: 'none' }}
            />
            {formErrors.imageUrl && (
              <span className={styles.errorText}>{formErrors.imageUrl}</span>
            )}
          </div>

          {formData.imageUrl?.startsWith('http') && (
            <div className={styles.imagePreview}>
              <img src={formData.imageUrl} alt="Preview" />
            </div>
          )}
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Pet Type"
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
          <strong>{selectedPetType?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default PetTypes;
