import { useState, useEffect, useRef } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import adminAppSettingsService from '../../services/adminAppSettingsService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './AppSettings.module.scss';

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ align: [] }],
    ['link'],
    ['clean'],
  ],
};

const AppSettings = () => {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedSetting, setSelectedSetting] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    token: '',
    value: '',
    description: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const searchTimerRef = useRef(null);

  // Fetch settings
  const fetchSettings = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await adminAppSettingsService.getAllAppSettings(page, 10, search);
      const data = response.data || [];
      setSettings(data);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || data.length);
      setCurrentPage(page);
    } catch (error) {
      // Error fetching settings
      console.error(error)
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings(1, searchTerm);
  }, []);

  // Handle search with debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchSettings(1, value);
    }, 600);
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchSettings(page, searchTerm);
  };

  // Open edit modal
  const handleEdit = (setting) => {
    setSelectedSetting(setting);
    setFormData({
      name: setting.name || '',
      token: setting.token || '',
      value: setting.value?.value != null ? String(setting.value.value) : '',
      description: setting.description || '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};
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

  // Handle rich text editor change
  const handleEditorChange = (content) => {
    setFormData((prev) => ({ ...prev, value: content }));
  };

  // Submit edit
  const handleEditSubmit = async () => {
    if (!validateForm()) return;

    setSubmitLoading(true);
    try {
      await adminAppSettingsService.updateAppSettings([{
        id: selectedSetting.id,
        value: { value: formData.value },
      }]);
      setIsEditModalOpen(false);
      fetchSettings(currentPage, searchTerm);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to update setting',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Check if setting needs rich text editor
  const isRichTextSetting = (token) => token === 'terms_and_conditions';

  // Render form fields
  const renderFormFields = () => (
    <div className={styles.form}>
      {formErrors.form && (
        <div className="alert alert-danger">{formErrors.form}</div>
      )}

      <Input
        label="Name"
        name="name"
        value={formData.name}
        disabled
        placeholder="Setting name"
      />

      {isRichTextSetting(selectedSetting?.token) ? (
        <div>
          <label className={styles.label}>
            Value <span style={{ color: '#E74C3C' }}>*</span>
          </label>
          <div className={styles.editorWrapper}>
            <ReactQuill
              theme="snow"
              value={formData.value}
              onChange={handleEditorChange}
              modules={QUILL_MODULES}
              placeholder="Write terms and conditions content..."
            />
          </div>
        </div>
      ) : (
        <Input
          label="Value"
          name="value"
          value={formData.value}
          onChange={handleInputChange}
          error={formErrors.value}
          placeholder="Setting value"
        />
      )}

      <div>
        <label className={styles.label}>Description</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleInputChange}
          placeholder="Optional description for this setting"
          className={styles.textarea}
          rows={3}
        />
      </div>
    </div>
  );

  // Table columns
  const columns = [
    {
      key: 'name',
      label: 'Name',
      width: '20%',
    },
    {
      key: 'value',
      label: 'Value',
      width: '25%',
      render: (row) => {
        const val = row.value?.value != null ? String(row.value.value) : '';
        if (isRichTextSetting(row.token) && val) {
          return <span className={styles.valueCell}>HTML Content</span>;
        }
        return (
          <span className={styles.valueCell}>
            {val || <span style={{ color: '#ADB5BD' }}>--</span>}
          </span>
        );
      },
    },
    {
      key: 'description',
      label: 'Description',
      width: '25%',
      render: (row) => (
        <span className={styles.descriptionCell}>
          {row.description || <span style={{ color: '#ADB5BD' }}>--</span>}
        </span>
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
    <div className={styles.appSettingsPage}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>App Settings</h1>
          <p className={styles.subtitle}>Manage application configuration settings</p>
        </div>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search settings by name..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
            disabled={loading}
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <TablePageSkeleton columns={4} rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={settings}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          emptyMessage="No settings found"
        />
      )}

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={`Edit: ${selectedSetting?.name || 'Setting'}`}
        size={isRichTextSetting(selectedSetting?.token) ? 'large' : 'medium'}
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
    </div>
  );
};

export default AppSettings;
