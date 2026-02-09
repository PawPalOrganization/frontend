import { useState, useEffect, useRef } from 'react';
import adminPetsService from '../../services/adminPetsService';
import adminFilesService from '../../services/adminFilesService';
import adminUsersService from '../../services/adminUsersService';
import adminPetTypesService from '../../services/adminPetTypesService';
import adminPetTypeBreedsService from '../../services/adminPetTypeBreedsService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './Pets.module.scss';

const Pets = () => {
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Dropdowns data
  const [users, setUsers] = useState([]);
  const [petTypes, setPetTypes] = useState([]);
  const [breeds, setBreeds] = useState([]);

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedPet, setSelectedPet] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    userId: '',
    petTypeId: '',
    petTypeBreedId: '',
    birthdate: '',
    gender: 'Male',
    size: 'Medium',
    weight: '',
    age: '',
    notes: '',
    imageUrl: '',
    adoptionDate: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [uploadLoading, setUploadLoading] = useState(false);
  const searchTimerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Fetch pets
  const fetchPets = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await adminPetsService.getAllPets(page, 10, search);
      setPets(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      // Error fetching pets
    } finally {
      setLoading(false);
    }
  };

  // Fetch users for dropdown
  const fetchUsers = async () => {
    try {
      const response = await adminUsersService.getUsersForDropdown();
      setUsers(response.data || []);
    } catch (error) {
      // Error fetching users
    }
  };

  // Fetch pet types for dropdown
  const fetchPetTypes = async () => {
    try {
      const response = await adminPetTypesService.getAllPetTypes(1, 100);
      setPetTypes(response.data || []);
    } catch (error) {
      // Error fetching pet types
    }
  };

  // Fetch breeds for dropdown (filtered by petTypeId)
  const fetchBreeds = async (petTypeId) => {
    if (!petTypeId) {
      setBreeds([]);
      return;
    }
    try {
      const response = await adminPetTypeBreedsService.getAllPetTypeBreeds(1, 100, petTypeId);
      setBreeds(response.data || []);
    } catch (error) {
      // Error fetching breeds
    }
  };

  useEffect(() => {
    fetchPets(1, searchTerm);
    fetchUsers();
    fetchPetTypes();
  }, []);

  // Handle search with debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchPets(1, value);
    }, 600);
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchPets(page, searchTerm);
  };

  // Open create modal
  const handleCreate = () => {
    setFormData({
      name: '',
      userId: '',
      petTypeId: '',
      petTypeBreedId: '',
      birthdate: '',
      gender: 'Male',
      size: 'Medium',
      weight: '',
      age: '',
      notes: '',
      imageUrl: '',
      adoptionDate: '',
    });
    setBreeds([]);
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (pet) => {
    setSelectedPet(pet);
    setFormData({
      name: pet.name || '',
      userId: pet.userId || '',
      petTypeId: pet.petTypeId || '',
      petTypeBreedId: pet.petTypeBreedId || '',
      birthdate: pet.birthdate ? pet.birthdate.split('T')[0] : '',
      gender: pet.gender || 'Male',
      size: pet.size || 'Medium',
      weight: pet.weight || '',
      age: pet.age || '',
      notes: pet.notes || '',
      imageUrl: pet.imageUrl || '',
      adoptionDate: pet.adoptionDate ? pet.adoptionDate.split('T')[0] : '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
    // Load breeds for the pet's type
    if (pet.petTypeId) {
      fetchBreeds(pet.petTypeId);
    }
  };

  // Open delete modal
  const handleDeleteClick = (pet) => {
    setSelectedPet(pet);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.name.trim()) {
      errors.name = 'Pet name is required';
    }

    if (!formData.userId) {
      errors.userId = 'Owner is required';
    }

    if (!formData.petTypeId) {
      errors.petTypeId = 'Pet type is required';
    }

    if (!formData.petTypeBreedId) {
      errors.petTypeBreedId = 'Breed is required';
    }

    if (formData.adoptionDate && formData.birthdate && formData.adoptionDate < formData.birthdate) {
      errors.adoptionDate = 'Adoption date cannot be before birthdate';
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

    // When pet type changes, reload breeds and reset breed selection
    if (name === 'petTypeId') {
      setFormData((prev) => ({ ...prev, petTypeId: value, petTypeBreedId: '' }));
      fetchBreeds(value);
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

  // Format weight: auto-append "kg" and normalize existing variants (KG, Kg, kG) to "kg"
  const formatWeight = (value) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    if (/kg/i.test(trimmed)) {
      return trimmed.replace(/\s*kg\s*$/i, ' kg').trim();
    }
    return `${trimmed} kg`;
  };

  // Submit create
  const handleCreateSubmit = async () => {
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      const petData = {
        name: formData.name,
        userId: parseInt(formData.userId, 10),
        petTypeId: parseInt(formData.petTypeId, 10),
        petTypeBreedId: parseInt(formData.petTypeBreedId, 10),
        gender: formData.gender,
        size: formData.size,
        weight: formatWeight(formData.weight),
        age: formData.age || undefined,
        notes: formData.notes || undefined,
        imageUrl: formData.imageUrl || undefined,
        birthdate: formData.birthdate || undefined,
        adoptionDate: formData.adoptionDate || undefined,
      };

      await adminPetsService.createPet(petData);
      setIsCreateModalOpen(false);
      fetchPets(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to create pet',
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
      const petData = {
        name: formData.name,
        userId: parseInt(formData.userId, 10),
        petTypeId: parseInt(formData.petTypeId, 10),
        petTypeBreedId: parseInt(formData.petTypeBreedId, 10),
        gender: formData.gender,
        size: formData.size,
        weight: formatWeight(formData.weight),
        age: formData.age || undefined,
        notes: formData.notes || undefined,
        imageUrl: formData.imageUrl || undefined,
        birthdate: formData.birthdate || undefined,
        adoptionDate: formData.adoptionDate || undefined,
      };

      await adminPetsService.updatePet(selectedPet.id, petData);
      setIsEditModalOpen(false);
      fetchPets(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to update pet',
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
      await adminPetsService.deletePet(selectedPet.id);
      setIsDeleteModalOpen(false);
      fetchPets(currentPage, searchTerm);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 409) {
        setDeleteError(message || 'Cannot delete this pet because it has related records.');
      } else {
        setDeleteError(message || 'Failed to delete pet.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Reusable form fields JSX (shared between Create and Edit modals)
  const renderFormFields = () => (
    <div className={styles.form}>
      {formErrors.form && (
        <div className="alert alert-danger">{formErrors.form}</div>
      )}

      <Input
        label="Pet Name"
        name="name"
        value={formData.name}
        onChange={handleInputChange}
        error={formErrors.name}
        placeholder="Buddy"
        icon="bi-heart"
        required
      />

      <div className={styles.formRow}>
        <div>
          <label className={styles.label}>
            Owner <span style={{ color: '#E74C3C' }}>*</span>
          </label>
          <select
            name="userId"
            value={formData.userId}
            onChange={handleInputChange}
            className={`${styles.select} ${formErrors.userId ? styles.selectError : ''}`}
          >
            <option value="">Select Owner</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName} {user.lastName} ({user.email})
              </option>
            ))}
          </select>
          {formErrors.userId && (
            <span className={styles.errorText}>{formErrors.userId}</span>
          )}
        </div>

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

      <div>
        <label className={styles.label}>
          Breed <span style={{ color: '#E74C3C' }}>*</span>
        </label>
        <select
          name="petTypeBreedId"
          value={formData.petTypeBreedId}
          onChange={handleInputChange}
          className={`${styles.select} ${formErrors.petTypeBreedId ? styles.selectError : ''}`}
          disabled={!formData.petTypeId}
        >
          <option value="">{formData.petTypeId ? 'Select Breed' : 'Select a pet type first'}</option>
          {breeds.map((breed) => (
            <option key={breed.id} value={breed.id}>
              {breed.name}
            </option>
          ))}
        </select>
        {formErrors.petTypeBreedId && (
          <span className={styles.errorText}>{formErrors.petTypeBreedId}</span>
        )}
      </div>

      <div className={styles.formRow}>
        <Input
          label="Birthdate"
          type="date"
          name="birthdate"
          value={formData.birthdate}
          onChange={handleInputChange}
          error={formErrors.birthdate}
        />

        <div>
          <label className={styles.label}>
            Gender <span style={{ color: '#E74C3C' }}>*</span>
          </label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleInputChange}
            className={styles.select}
          >
            <option value="Male">Male</option>
            <option value="Female">Female</option>
            <option value="Unknown">Unknown</option>
          </select>
        </div>
      </div>

      <div className={styles.formRow}>
        <div>
          <label className={styles.label}>
            Size <span style={{ color: '#E74C3C' }}>*</span>
          </label>
          <select
            name="size"
            value={formData.size}
            onChange={handleInputChange}
            className={styles.select}
          >
            <option value="Small">Small</option>
            <option value="Medium">Medium</option>
            <option value="Large">Large</option>
            <option value="Extra Large">Extra Large</option>
          </select>
        </div>

        <Input
          label="Weight"
          name="weight"
          value={formData.weight}
          onChange={handleInputChange}
          error={formErrors.weight}
          placeholder="e.g. 30 (kg auto-added)"
        />
      </div>

      <div className={styles.formRow}>
        <Input
          label="Age"
          name="age"
          value={formData.age}
          onChange={handleInputChange}
          placeholder="e.g. 3 years"
        />

        <Input
          label="Adoption Date"
          type="date"
          name="adoptionDate"
          value={formData.adoptionDate}
          onChange={handleInputChange}
          error={formErrors.adoptionDate}
        />
      </div>

      <Input
        label="Notes"
        name="notes"
        value={formData.notes}
        onChange={handleInputChange}
        placeholder="Any notes about the pet..."
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
  );

  // Table columns
  const columns = [
    {
      key: 'imageUrl',
      label: '',
      width: '60px',
      render: (row) =>
        row.imageUrl?.startsWith('http') ? (
          <img src={row.imageUrl} alt={row.name} className={styles.petImage} />
        ) : (
          <div className={styles.noImage}>
            <i className="bi bi-image"></i>
          </div>
        ),
    },
    {
      key: 'name',
      label: 'Pet Name',
      width: '14%',
    },
    {
      key: 'breed',
      label: 'Breed',
      width: '14%',
      render: (row) => row.petTypeBreed?.name || 'N/A',
    },
    {
      key: 'petType',
      label: 'Type',
      width: '10%',
      render: (row) => (
        <span className={styles.badge}>
          {row.petType?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      width: '16%',
      render: (row) => (
        <span>
          {row.user ? `${row.user.firstName} ${row.user.lastName}` : 'N/A'}
        </span>
      ),
    },
    {
      key: 'gender',
      label: 'Gender',
      width: '10%',
      render: (row) => (
        <span className={styles.genderBadge}>
          {row.gender || 'N/A'}
        </span>
      ),
    },
    {
      key: 'size',
      label: 'Size',
      width: '10%',
      render: (row) => (
        <span className={styles.sizeBadge}>
          {row.size || 'N/A'}
        </span>
      ),
    },
    {
      key: 'weight',
      label: 'Weight',
      width: '10%',
      render: (row) => row.weight || 'N/A',
    },
  ];

  // Show skeleton while loading
  if (loading) {
    return <TablePageSkeleton columns={8} rows={8} />;
  }

  return (
    <div className={styles.petsPage}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Pets Management</h1>
          <p className={styles.subtitle}>Manage all registered pets</p>
        </div>
        <Button
          variant="primary"
          icon="bi-plus-lg"
          onClick={handleCreate}
        >
          Add Pet
        </Button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search pets by name or breed..."
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
        data={pets}
        loading={loading}
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        onPageChange={handlePageChange}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        emptyMessage="No pets found"
      />

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Add New Pet"
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
              Add Pet
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
        title="Edit Pet"
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
        title="Delete Pet"
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
          <strong>{selectedPet?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Pets;
