import { useState, useEffect } from 'react';
import adminPetsService from '../../services/adminPetsService';
import adminUsersService from '../../services/adminUsersService';
import adminPetTypesService from '../../services/adminPetTypesService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
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
    breed: '',
    birthDate: '',
    gender: 'Male',
    size: 'Medium',
    weight: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);

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
      console.error('Failed to fetch pets:', error);
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
      console.error('Failed to fetch users:', error);
    }
  };

  // Fetch pet types for dropdown
  const fetchPetTypes = async () => {
    try {
      const response = await adminPetTypesService.getAllPetTypes(1, 100);
      setPetTypes(response.data || []);
    } catch (error) {
      console.error('Failed to fetch pet types:', error);
    }
  };

  useEffect(() => {
    fetchPets(1, searchTerm);
    fetchUsers();
    fetchPetTypes();
  }, []);

  // Handle search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    fetchPets(1, value);
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
      breed: '',
      birthDate: '',
      gender: 'Male',
      size: 'Medium',
      weight: '',
    });
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
      breed: pet.breed || '',
      birthDate: pet.birthDate ? pet.birthDate.split('T')[0] : '',
      gender: pet.gender || 'Male',
      size: pet.size || 'Medium',
      weight: pet.weight || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (pet) => {
    setSelectedPet(pet);
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

    if (!formData.breed.trim()) {
      errors.breed = 'Breed is required';
    }

    if (!formData.birthDate) {
      errors.birthDate = 'Birth date is required';
    }

    if (formData.weight && isNaN(formData.weight)) {
      errors.weight = 'Weight must be a number';
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
      // Calculate age from birthDate
      const calculateAge = (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return Math.max(0, age);
      };

      // Convert to API format
      const petData = {
        name: formData.name,
        userId: parseInt(formData.userId, 10),
        petTypeId: parseInt(formData.petTypeId, 10),
        breed: formData.breed,
        age: calculateAge(formData.birthDate),
        gender: formData.gender, // Already capitalized from form
        size: formData.size, // Already capitalized from form
        weight: formData.weight ? parseFloat(formData.weight) : null,
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
      // Calculate age from birthDate
      const calculateAge = (birthDate) => {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
          age--;
        }
        return Math.max(0, age);
      };

      // Convert to API format
      const petData = {
        name: formData.name,
        userId: parseInt(formData.userId, 10),
        petTypeId: parseInt(formData.petTypeId, 10),
        breed: formData.breed,
        age: calculateAge(formData.birthDate),
        gender: formData.gender, // Already capitalized from form
        size: formData.size, // Already capitalized from form
        weight: formData.weight ? parseFloat(formData.weight) : null,
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
    try {
      await adminPetsService.deletePet(selectedPet.id);
      setIsDeleteModalOpen(false);
      fetchPets(currentPage, searchTerm);
    } catch (error) {
      console.error('Failed to delete pet:', error);
      alert('Failed to delete pet');
    } finally {
      setSubmitLoading(false);
    }
  };

  // Table columns
  const columns = [
    {
      key: 'name',
      label: 'Pet Name',
      width: '15%',
    },
    {
      key: 'breed',
      label: 'Breed',
      width: '15%',
    },
    {
      key: 'petType',
      label: 'Type',
      width: '10%',
      render: (row) => (
        <span className={styles.badge}>
          {row.PetType?.name || 'N/A'}
        </span>
      ),
    },
    {
      key: 'owner',
      label: 'Owner',
      width: '20%',
      render: (row) => (
        <span>
          {row.User ? `${row.User.firstName} ${row.User.lastName}` : 'N/A'}
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
      render: (row) => (row.weight ? `${row.weight} kg` : 'N/A'),
    },
    {
      key: 'createdAt',
      label: 'Added',
      width: '10%',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

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

          <Input
            label="Breed"
            name="breed"
            value={formData.breed}
            onChange={handleInputChange}
            error={formErrors.breed}
            placeholder="Golden Retriever"
            required
          />

          <div className={styles.formRow}>
            <Input
              label="Birth Date"
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              error={formErrors.birthDate}
              required
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
              label="Weight (kg)"
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleInputChange}
              error={formErrors.weight}
              placeholder="15.5"
              step="0.1"
            />
          </div>
        </div>
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

          <Input
            label="Breed"
            name="breed"
            value={formData.breed}
            onChange={handleInputChange}
            error={formErrors.breed}
            placeholder="Golden Retriever"
            required
          />

          <div className={styles.formRow}>
            <Input
              label="Birth Date"
              type="date"
              name="birthDate"
              value={formData.birthDate}
              onChange={handleInputChange}
              error={formErrors.birthDate}
              required
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
              label="Weight (kg)"
              type="number"
              name="weight"
              value={formData.weight}
              onChange={handleInputChange}
              error={formErrors.weight}
              placeholder="15.5"
              step="0.1"
            />
          </div>
        </div>
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
        <p>
          Are you sure you want to delete{' '}
          <strong>{selectedPet?.name}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Pets;
