import { useState, useEffect, useRef, useMemo } from 'react';
import adminClinicServicesService from '../../services/adminClinicServicesService';
import adminClinicServiceCategoriesService from '../../services/adminClinicServiceCategoriesService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './ClinicServices.module.scss';

const EMPTY_CATEGORY_FORM = { name: '', nameAr: '', description: '', descriptionAr: '', logoUrl: '' };

const ClinicServices = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [scopeFilter, setScopeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fetchError, setFetchError] = useState('');

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState(null);

  // form state
  const [formData, setFormData] = useState({
    name: '', nameAr: '', description: '', descriptionAr: '', logoUrl: '',
    homeServiceAvailable: false, clinicServiceCategoryId: '', clinicId: '', isPlatformService: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const searchTimerRef = useRef(null);

  // ── Categories (loaded once for the filter + form picker, and for the Manage Categories modal) ──
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(false);
  const categoriesById = useMemo(
    () => Object.fromEntries(categories.map((c) => [String(c.id), c])),
    [categories]
  );

  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [isEditCategoryModalOpen, setIsEditCategoryModalOpen] = useState(false);
  const [isDeleteCategoryModalOpen, setIsDeleteCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryFormData, setCategoryFormData] = useState(EMPTY_CATEGORY_FORM);
  const [categoryFormErrors, setCategoryFormErrors] = useState({});
  const [categorySubmitLoading, setCategorySubmitLoading] = useState(false);
  const [categoryDeleteError, setCategoryDeleteError] = useState('');

  const fetchCategories = async () => {
    setCategoriesLoading(true);
    try {
      const response = await adminClinicServiceCategoriesService.getAllClinicServiceCategories(1, 100, '');
      setCategories(response.data || []);
    } catch {
      // non-critical — filter/picker just show an empty list
    } finally {
      setCategoriesLoading(false);
    }
  };

  const filteredCategories = useMemo(() => {
    if (!categorySearchTerm.trim()) return categories;
    const term = categorySearchTerm.toLowerCase();
    return categories.filter(
      (c) => c.name?.toLowerCase().includes(term) || c.nameAr?.toLowerCase().includes(term)
    );
  }, [categories, categorySearchTerm]);

  const fetchServices = async (page = 1, search = '', scope = scopeFilter, categoryId = categoryFilter) => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await adminClinicServicesService.getAllClinicServices(page, 10, search, scope, '', categoryId);
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
    fetchServices(1, searchTerm, scopeFilter, categoryFilter);
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopeFilter, categoryFilter]);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => fetchServices(1, value, scopeFilter, categoryFilter), 600);
  };

  const handlePageChange = (page) => fetchServices(page, searchTerm, scopeFilter, categoryFilter);

  const handleCreate = () => {
    setFormData({
      name: '', nameAr: '', description: '', descriptionAr: '', logoUrl: '',
      homeServiceAvailable: false, clinicServiceCategoryId: '', clinicId: '', isPlatformService: true,
    });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleEdit = (service) => {
    setSelectedService(service);
    setFormData({
      name: service.name || '',
      nameAr: service.nameAr || '',
      description: service.description || '',
      descriptionAr: service.descriptionAr || '',
      logoUrl: service.logoUrl || '',
      homeServiceAvailable: !!service.homeServiceAvailable,
      clinicServiceCategoryId: service.clinicServiceCategoryId ? String(service.clinicServiceCategoryId) : '',
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
    if (!formData.clinicServiceCategoryId) errors.clinicServiceCategoryId = 'Category is required';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleCreateSubmit = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      const payload = {
        name: formData.name,
        nameAr: formData.nameAr || null,
        description: formData.description || null,
        descriptionAr: formData.descriptionAr || null,
        logoUrl: formData.logoUrl || null,
        homeServiceAvailable: formData.homeServiceAvailable,
        clinicServiceCategoryId: parseInt(formData.clinicServiceCategoryId, 10),
        clinicId: formData.isPlatformService ? null : (parseInt(formData.clinicId, 10) || null),
      };
      await adminClinicServicesService.createClinicService(payload);
      setIsCreateModalOpen(false);
      fetchServices(currentPage, searchTerm, scopeFilter, categoryFilter);
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
        nameAr: formData.nameAr || null,
        description: formData.description || null,
        descriptionAr: formData.descriptionAr || null,
        logoUrl: formData.logoUrl || null,
        homeServiceAvailable: formData.homeServiceAvailable,
        clinicServiceCategoryId: parseInt(formData.clinicServiceCategoryId, 10),
      });
      setIsEditModalOpen(false);
      fetchServices(currentPage, searchTerm, scopeFilter, categoryFilter);
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
      fetchServices(currentPage, searchTerm, scopeFilter, categoryFilter);
    } catch (error) {
      const msg = error.response?.data?.message;
      setDeleteError(msg || 'Failed to delete service.');
    } finally {
      setSubmitLoading(false);
    }
  };

  // ── Manage Categories handlers ────────────────────────────────────────────
  const handleManageCategories = () => {
    setCategorySearchTerm('');
    setIsCategoriesModalOpen(true);
  };

  const handleAddCategory = () => {
    setCategoryFormData(EMPTY_CATEGORY_FORM);
    setCategoryFormErrors({});
    setIsAddCategoryModalOpen(true);
  };

  const handleEditCategory = (category) => {
    setSelectedCategory(category);
    setCategoryFormData({
      name: category.name || '',
      nameAr: category.nameAr || '',
      description: category.description || '',
      descriptionAr: category.descriptionAr || '',
      logoUrl: category.logoUrl || '',
    });
    setCategoryFormErrors({});
    setIsEditCategoryModalOpen(true);
  };

  const handleDeleteCategoryClick = (category) => {
    setSelectedCategory(category);
    setCategoryDeleteError('');
    setIsDeleteCategoryModalOpen(true);
  };

  const validateCategoryForm = () => {
    const errors = {};
    if (!categoryFormData.name.trim()) errors.name = 'Category name is required';
    setCategoryFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCategoryInputChange = (e) => {
    const { name, value } = e.target;
    setCategoryFormData((prev) => ({ ...prev, [name]: value }));
    if (categoryFormErrors[name]) setCategoryFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleAddCategorySubmit = async () => {
    if (!validateCategoryForm()) return;
    setCategorySubmitLoading(true);
    try {
      await adminClinicServiceCategoriesService.createClinicServiceCategory({
        name: categoryFormData.name,
        nameAr: categoryFormData.nameAr || null,
        description: categoryFormData.description || null,
        descriptionAr: categoryFormData.descriptionAr || null,
        logoUrl: categoryFormData.logoUrl || null,
      });
      setIsAddCategoryModalOpen(false);
      fetchCategories();
    } catch (error) {
      setCategoryFormErrors({ form: error.response?.data?.message || 'Failed to create category' });
    } finally {
      setCategorySubmitLoading(false);
    }
  };

  const handleEditCategorySubmit = async () => {
    if (!validateCategoryForm()) return;
    setCategorySubmitLoading(true);
    try {
      await adminClinicServiceCategoriesService.updateClinicServiceCategory(selectedCategory.id, {
        name: categoryFormData.name,
        nameAr: categoryFormData.nameAr || null,
        description: categoryFormData.description || null,
        descriptionAr: categoryFormData.descriptionAr || null,
        logoUrl: categoryFormData.logoUrl || null,
      });
      setIsEditCategoryModalOpen(false);
      fetchCategories();
    } catch (error) {
      setCategoryFormErrors({ form: error.response?.data?.message || 'Failed to update category' });
    } finally {
      setCategorySubmitLoading(false);
    }
  };

  const handleDeleteCategorySubmit = async () => {
    setCategorySubmitLoading(true);
    setCategoryDeleteError('');
    try {
      await adminClinicServiceCategoriesService.deleteClinicServiceCategory(selectedCategory.id);
      setIsDeleteCategoryModalOpen(false);
      fetchCategories();
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 409) {
        setCategoryDeleteError(message || 'Cannot delete this category because services still use it.');
      } else {
        setCategoryDeleteError(message || 'Failed to delete category.');
      }
    } finally {
      setCategorySubmitLoading(false);
    }
  };

  const renderCategoryFormFields = () => (
    <div className={styles.form}>
      {categoryFormErrors.form && <div className="alert alert-danger">{categoryFormErrors.form}</div>}
      <div className={styles.formRow}>
        <Input
          label="Category Name"
          name="name"
          value={categoryFormData.name}
          onChange={handleCategoryInputChange}
          error={categoryFormErrors.name}
          placeholder="e.g. Preventive Care"
          icon="bi-tag"
          required
        />
        <Input
          label="Name in Arabic"
          name="nameAr"
          value={categoryFormData.nameAr}
          onChange={handleCategoryInputChange}
          placeholder="الرعاية الوقائية"
          icon="bi-translate"
        />
      </div>
      <div>
        <label className={styles.label}>Description</label>
        <textarea
          name="description"
          value={categoryFormData.description}
          onChange={handleCategoryInputChange}
          placeholder="Optional description..."
          className={styles.textarea}
          rows={2}
        />
      </div>
      <div>
        <label className={styles.label}>Description in Arabic</label>
        <textarea
          name="descriptionAr"
          value={categoryFormData.descriptionAr}
          onChange={handleCategoryInputChange}
          placeholder="وصف اختياري..."
          className={styles.textarea}
          rows={2}
          dir="rtl"
        />
      </div>
      <Input
        label="Logo URL"
        name="logoUrl"
        value={categoryFormData.logoUrl}
        onChange={handleCategoryInputChange}
        placeholder="https://example.com/category.png"
        icon="bi-image"
      />
    </div>
  );

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

      <div className={styles.formRow}>
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
        <Input
          label="Name in Arabic"
          name="nameAr"
          value={formData.nameAr}
          onChange={handleInputChange}
          placeholder="العناية"
          icon="bi-translate"
        />
      </div>

      <div>
        <div className={styles.categoryPickerHeader}>
          <label className={styles.label}>
            Category <span style={{ color: '#E74C3C' }}>*</span>
          </label>
          <button type="button" className={styles.manageCategoriesLink} onClick={handleManageCategories}>
            Manage Categories
          </button>
        </div>
        <select
          name="clinicServiceCategoryId"
          value={formData.clinicServiceCategoryId}
          onChange={handleInputChange}
          className={`${styles.select} ${formErrors.clinicServiceCategoryId ? styles.selectError : ''}`}
          disabled={categoriesLoading}
        >
          <option value="">{categoriesLoading ? 'Loading categories...' : 'Select Category'}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}{category.nameAr ? ` (${category.nameAr})` : ''}
            </option>
          ))}
        </select>
        {formErrors.clinicServiceCategoryId && (
          <span className={styles.errorText}>{formErrors.clinicServiceCategoryId}</span>
        )}
        {!categoriesLoading && categories.length === 0 && (
          <p className={styles.noCategoriesText}>
            No categories yet. <button type="button" className={styles.manageCategoriesLink} onClick={handleManageCategories}>Create one</button> before adding a service.
          </p>
        )}
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
      <div>
        <label className={styles.label}>Description in Arabic</label>
        <textarea
          name="descriptionAr"
          value={formData.descriptionAr}
          onChange={handleInputChange}
          placeholder="وصف اختياري..."
          className={styles.textarea}
          rows={2}
          dir="rtl"
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

      <label className={styles.checkboxLabel}>
        <input
          type="checkbox"
          name="homeServiceAvailable"
          checked={formData.homeServiceAvailable}
          onChange={handleInputChange}
        />
        <span>Home service available</span>
      </label>
    </div>
  );

  const columns = [
    {
      key: 'id',
      label: 'ID',
      width: '6%',
      render: (row) => (
        <span style={{ fontFamily: 'monospace', fontWeight: 600, color: '#0D9AFF' }}>
          #{row.id}
        </span>
      ),
    },
    {
      key: 'name',
      label: 'Name',
      width: '16%',
      render: (row) => (
        <div>
          <span>{row.name}</span>
          {row.isPlatform && (
            <span className={styles.platformBadge}>
              <i className="bi bi-shield-check" /> Platform
            </span>
          )}
          {row.nameAr && <div className={styles.arabicSubtext} dir="rtl">{row.nameAr}</div>}
        </div>
      ),
    },
    {
      key: 'clinicId',
      label: 'Owner',
      width: '10%',
      render: (row) =>
        row.isPlatform
          ? <span className={styles.ownerPlatform}>Platform</span>
          : <span className={styles.ownerClinic}>Clinic #{row.clinicId}</span>,
    },
    {
      key: 'category',
      label: 'Category',
      width: '14%',
      render: (row) => {
        const category = row.category || categoriesById[String(row.clinicServiceCategoryId)];
        return category ? (
          <span className={styles.categoryBadge} title={category.nameAr || ''}>{category.name}</span>
        ) : (
          <span style={{ color: '#ADB5BD' }}>--</span>
        );
      },
    },
    {
      key: 'homeServiceAvailable',
      label: 'Home Service',
      width: '10%',
      render: (row) =>
        row.homeServiceAvailable ? (
          <span className={styles.homeServiceYes}><i className="bi bi-check-circle" /> Yes</span>
        ) : (
          <span className={styles.homeServiceNo}>No</span>
        ),
    },
    {
      key: 'description',
      label: 'Description',
      width: '22%',
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
      width: '8%',
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
      width: '10%',
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
        <div className={styles.headerActions}>
          <Button variant="outline" icon="bi-tags" onClick={handleManageCategories}>
            Manage Categories
          </Button>
          <Button variant="primary" icon="bi-plus-lg" onClick={handleCreate}>
            Add Service
          </Button>
        </div>
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

        <select
          className={styles.scopeSelect}
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
          disabled={loading || categoriesLoading}
        >
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      {fetchError && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          <i className="bi bi-exclamation-triangle" style={{ marginRight: '8px' }}></i>
          {fetchError}
        </div>
      )}

      {loading ? (
        <TablePageSkeleton columns={8} rows={8} />
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

      {/* ── Manage Categories (list) Modal ── */}
      <Modal
        isOpen={isCategoriesModalOpen}
        onClose={() => setIsCategoriesModalOpen(false)}
        title="Service Categories"
        size="large"
        footer={<Button variant="outline" onClick={() => setIsCategoriesModalOpen(false)}>Close</Button>}
      >
        <div className={styles.categoriesModalContent}>
          <div className={styles.categoriesModalHeader}>
            <div className={styles.categoriesSearchWrapper}>
              <i className="bi bi-search"></i>
              <input
                type="text"
                placeholder="Search categories (EN or AR)..."
                value={categorySearchTerm}
                onChange={(e) => setCategorySearchTerm(e.target.value)}
                className={styles.categoriesSearchInput}
              />
            </div>
            <Button variant="primary" icon="bi-plus-lg" onClick={handleAddCategory}>Add Category</Button>
          </div>

          {categoriesLoading ? (
            <div className={styles.branchesLoading}><div className={styles.spinner}></div>Loading categories...</div>
          ) : filteredCategories.length === 0 ? (
            <div className={styles.branchesEmpty}>
              <i className="bi bi-tags"></i>
              <p>{categories.length === 0 ? 'No categories yet. Add one to get started.' : 'No categories match your search.'}</p>
            </div>
          ) : (
            <div className={styles.branchesList}>
              {filteredCategories.map((category) => (
                <div key={category.id} className={styles.branchCard}>
                  <div className={styles.branchInfo}>
                    <div className={styles.branchName}>
                      {category.logoUrl && <img src={category.logoUrl} alt="" className={styles.categoryThumb} />}
                      <i className="bi bi-tag"></i>
                      {category.name}
                      {category.nameAr && <span className={styles.arabicInline} dir="rtl">{category.nameAr}</span>}
                    </div>
                    {category.description && (
                      <div className={styles.branchDetail}>{category.description}</div>
                    )}
                  </div>
                  <div className={styles.branchActions}>
                    <button className={`${styles.actionBtn} ${styles.actionEdit}`} onClick={() => handleEditCategory(category)} title="Edit">
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className={`${styles.actionBtn} ${styles.actionDelete}`} onClick={() => handleDeleteCategoryClick(category)} title="Delete">
                      <i className="bi bi-trash"></i>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* ── Add Category Modal ── */}
      <Modal
        isOpen={isAddCategoryModalOpen}
        onClose={() => setIsAddCategoryModalOpen(false)}
        title="Add Service Category"
        size="medium"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsAddCategoryModalOpen(false)} disabled={categorySubmitLoading}>Cancel</Button>
            <Button variant="primary" onClick={handleAddCategorySubmit} loading={categorySubmitLoading}>Add Category</Button>
          </>
        }
      >
        {renderCategoryFormFields()}
      </Modal>

      {/* ── Edit Category Modal ── */}
      <Modal
        isOpen={isEditCategoryModalOpen}
        onClose={() => setIsEditCategoryModalOpen(false)}
        title="Edit Service Category"
        size="medium"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsEditCategoryModalOpen(false)} disabled={categorySubmitLoading}>Cancel</Button>
            <Button variant="primary" onClick={handleEditCategorySubmit} loading={categorySubmitLoading}>Save Changes</Button>
          </>
        }
      >
        {renderCategoryFormFields()}
      </Modal>

      {/* ── Delete Category Modal ── */}
      <Modal
        isOpen={isDeleteCategoryModalOpen}
        onClose={() => setIsDeleteCategoryModalOpen(false)}
        title="Delete Service Category"
        size="small"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteCategoryModalOpen(false)} disabled={categorySubmitLoading}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteCategorySubmit} loading={categorySubmitLoading}>Delete</Button>
          </>
        }
      >
        {categoryDeleteError && <div className="alert alert-danger">{categoryDeleteError}</div>}
        <p>
          Delete <strong>{selectedCategory?.name}</strong>? Services using this category must be reassigned first.
        </p>
      </Modal>
    </div>
  );
};

export default ClinicServices;
