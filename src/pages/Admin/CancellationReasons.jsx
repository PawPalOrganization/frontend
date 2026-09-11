import { useState, useEffect, useRef } from 'react';
import adminCancellationReasonsService from '../../services/adminCancellationReasonsService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './CancellationReasons.module.scss';

const CancellationReasons = () => {
  const [reasons, setReasons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState(null);

  // Form state
  const [formData, setFormData] = useState({ title: '', description: '' });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const searchTimerRef = useRef(null);

  const fetchReasons = async (page = 1, search = '') => {
    setLoading(true);
    try {
      const response = await adminCancellationReasonsService.getAllCancellationReasons(page, 10, search);
      setReasons(response.data || []);
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
    fetchReasons(1, '');
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchReasons(1, value);
    }, 600);
  };

  const handlePageChange = (page) => {
    fetchReasons(page, searchTerm);
  };

  const handleCreate = () => {
    setFormData({ title: '', description: '' });
    setFormErrors({});
    setIsCreateModalOpen(true);
  };

  const handleEdit = (reason) => {
    setSelectedReason(reason);
    setFormData({ title: reason.title || '', description: reason.description || '' });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (reason) => {
    setSelectedReason(reason);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description is required';
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
      await adminCancellationReasonsService.createCancellationReason(formData);
      setIsCreateModalOpen(false);
      fetchReasons(currentPage, searchTerm);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      setFormErrors({
        form: status === 409
          ? (message || 'A cancellation reason with this title already exists.')
          : (message || 'Failed to create cancellation reason'),
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleEditSubmit = async () => {
    if (!validateForm()) return;
    setSubmitLoading(true);
    try {
      await adminCancellationReasonsService.updateCancellationReason(selectedReason.id, formData);
      setIsEditModalOpen(false);
      fetchReasons(currentPage, searchTerm);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      setFormErrors({
        form: status === 409
          ? (message || 'A cancellation reason with this title already exists.')
          : (message || 'Failed to update cancellation reason'),
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteSubmit = async () => {
    setSubmitLoading(true);
    setDeleteError('');
    try {
      await adminCancellationReasonsService.deleteCancellationReason(selectedReason.id);
      setIsDeleteModalOpen(false);
      fetchReasons(currentPage, searchTerm);
    } catch (error) {
      const status = error.response?.status;
      const message = error.response?.data?.message;
      if (status === 409) {
        setDeleteError(message || 'Cannot delete this reason because appointments still reference it.');
      } else {
        setDeleteError(message || 'Failed to delete cancellation reason.');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  const columns = [
    { key: 'title', label: 'Title', width: '30%' },
    {
      key: 'description',
      label: 'Default Message',
      width: '45%',
      render: (row) => <span className={styles.descriptionCell}>{row.description}</span>,
    },
    {
      key: 'createdAt',
      label: 'Created',
      width: '15%',
      render: (row) => (row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '--'),
    },
  ];

  return (
    <div className={styles.cancellationReasonsPage}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Appointment Cancellation Reasons</h1>
          <p className={styles.subtitle}>Predefined reasons clinics pick from when cancelling a booked appointment</p>
        </div>
        <Button variant="primary" icon="bi-plus-lg" onClick={handleCreate}>
          Add Reason
        </Button>
      </div>

      {/* Search Bar */}
      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search cancellation reasons..."
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
          data={reasons}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          emptyMessage="No cancellation reasons found"
        />
      )}

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create Cancellation Reason"
        size="medium"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)} disabled={submitLoading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreateSubmit} loading={submitLoading}>
              Create Reason
            </Button>
          </>
        }
      >
        <div className={styles.form}>
          {formErrors.form && <div className="alert alert-danger">{formErrors.form}</div>}
          <Input
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            error={formErrors.title}
            placeholder="e.g., Doctor Unavailable"
            required
          />
          <div>
            <label className={styles.label}>Default Message</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Shown to the pet owner in the cancel modal — clinic staff can still edit it per-cancellation."
              className={styles.textarea}
              rows={3}
            />
            {formErrors.description && <span className={styles.errorText}>{formErrors.description}</span>}
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Cancellation Reason"
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
            label="Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            error={formErrors.title}
            placeholder="e.g., Doctor Unavailable"
            required
          />
          <div>
            <label className={styles.label}>Default Message</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              className={styles.textarea}
              rows={3}
            />
            {formErrors.description && <span className={styles.errorText}>{formErrors.description}</span>}
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Cancellation Reason"
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
          Are you sure you want to delete <strong>{selectedReason?.title}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default CancellationReasons;
