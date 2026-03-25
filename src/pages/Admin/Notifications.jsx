import { useState, useEffect, useRef } from 'react';
import adminNotificationsService from '../../services/adminNotificationsService';
import adminUsersService from '../../services/adminUsersService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import Input from '../../components/common/Input/Input';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './Notifications.module.scss';

const NOTIFICATION_TYPES = [
  { value: 'reminder', label: 'Reminder' },
  { value: 'pet', label: 'Pet' },
  { value: 'system', label: 'System' },
];

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter states
  const [filterUserId, setFilterUserId] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterIsRead, setFilterIsRead] = useState('');

  // Dropdown data
  const [users, setUsers] = useState([]);

  // Modal states
  const [isSendModalOpen, setIsSendModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    type: 'system',
    sendTo: 'all', // 'all' or 'selected'
    selectedUserIds: [],
    data: '',
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [sendProgress, setSendProgress] = useState(null);
  const searchTimerRef = useRef(null);

  // Fetch notifications
  const fetchNotifications = async (page = 1, search = '', filters = {}) => {
    setLoading(true);
    try {
      const response = await adminNotificationsService.getAllNotifications(
        page, 10, search, filters
      );
      setNotifications(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      console.error(error);
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
      console.error(error);
    }
  };

  useEffect(() => {
    fetchNotifications(1, searchTerm, { userId: filterUserId, type: filterType, isRead: filterIsRead });
    fetchUsers();
  }, []);

  // Get current filters object
  const getFilters = () => ({
    userId: filterUserId,
    type: filterType,
    isRead: filterIsRead,
  });

  // Handle search with debounce
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      fetchNotifications(1, value, getFilters());
    }, 600);
  };

  // Handle filter changes
  const handleFilterUserChange = (e) => {
    const value = e.target.value;
    setFilterUserId(value);
    fetchNotifications(1, searchTerm, { ...getFilters(), userId: value });
  };

  const handleFilterTypeChange = (e) => {
    const value = e.target.value;
    setFilterType(value);
    fetchNotifications(1, searchTerm, { ...getFilters(), type: value });
  };

  const handleFilterIsReadChange = (e) => {
    const value = e.target.value;
    setFilterIsRead(value);
    fetchNotifications(1, searchTerm, { ...getFilters(), isRead: value });
  };

  // Handle page change
  const handlePageChange = (page) => {
    fetchNotifications(page, searchTerm, getFilters());
  };

  // Open send modal
  const handleSend = () => {
    setFormData({
      title: '',
      body: '',
      type: 'system',
      sendTo: 'all',
      selectedUserIds: [],
      data: '',
    });
    setFormErrors({});
    setSendProgress(null);
    setIsSendModalOpen(true);
  };

  // Open edit modal
  const handleEdit = (notification) => {
    setSelectedNotification(notification);
    setFormData({
      title: notification.title || '',
      body: notification.body || '',
      type: notification.type || 'system',
      sendTo: 'selected',
      selectedUserIds: notification.userId ? [notification.userId] : [],
      data: notification.data ? JSON.stringify(notification.data) : '',
    });
    setFormErrors({});
    setIsEditModalOpen(true);
  };

  // Open delete modal
  const handleDeleteClick = (notification) => {
    setSelectedNotification(notification);
    setIsDeleteModalOpen(true);
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.title.trim()) {
      errors.title = 'Title is required';
    }

    if (!formData.body.trim()) {
      errors.body = 'Body is required';
    }

    if (formData.sendTo === 'selected' && formData.selectedUserIds.length === 0) {
      errors.selectedUserIds = 'Please select at least one user';
    }

    if (formData.data) {
      try {
        JSON.parse(formData.data);
      } catch {
        errors.data = 'Data must be valid JSON';
      }
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

  // Handle user checkbox toggle
  const handleUserToggle = (userId) => {
    setFormData((prev) => {
      const ids = prev.selectedUserIds.includes(userId)
        ? prev.selectedUserIds.filter((id) => id !== userId)
        : [...prev.selectedUserIds, userId];
      return { ...prev, selectedUserIds: ids };
    });
    if (formErrors.selectedUserIds) {
      setFormErrors((prev) => ({ ...prev, selectedUserIds: '' }));
    }
  };

  // Select/deselect all users
  const handleSelectAllUsers = () => {
    if (formData.selectedUserIds.length === users.length) {
      setFormData((prev) => ({ ...prev, selectedUserIds: [] }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedUserIds: users.map((u) => u.id),
      }));
    }
  };

  // Submit send notification
  const handleSendSubmit = async () => {
    if (!validateForm()) return;

    setSubmitLoading(true);
    setSendProgress(null);

    try {
      const parsedData = formData.data ? JSON.parse(formData.data) : undefined;
      const targetUserIds =
        formData.sendTo === 'all'
          ? users.map((u) => u.id)
          : formData.selectedUserIds;

      // Send to each user
      let sent = 0;
      let failed = 0;
      for (const userId of targetUserIds) {
        try {
          await adminNotificationsService.createNotification({
            title: formData.title,
            body: formData.body,
            type: formData.type,
            userId,
            ...(parsedData && { data: parsedData }),
          });
          sent++;
        } catch {
          failed++;
        }
        setSendProgress({ sent, failed, total: targetUserIds.length });
      }

      setSendProgress({ sent, failed, total: targetUserIds.length, done: true });

      // Refresh after a short delay so the user can see the result
      setTimeout(() => {
        setIsSendModalOpen(false);
        setSendProgress(null);
        fetchNotifications(1, searchTerm, getFilters());
      }, 1500);
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to send notification',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit edit
  const handleEditSubmit = async () => {
    if (!formData.title.trim()) {
      setFormErrors({ title: 'Title is required' });
      return;
    }
    if (!formData.body.trim()) {
      setFormErrors({ body: 'Body is required' });
      return;
    }

    setSubmitLoading(true);
    try {
      const updateData = {
        title: formData.title,
        body: formData.body,
        type: formData.type,
      };

      if (formData.data) {
        try {
          updateData.data = JSON.parse(formData.data);
        } catch {
          setFormErrors({ data: 'Data must be valid JSON' });
          setSubmitLoading(false);
          return;
        }
      }

      await adminNotificationsService.updateNotification(selectedNotification.id, updateData);
      setIsEditModalOpen(false);
      fetchNotifications(currentPage, searchTerm, getFilters());
    } catch (error) {
      setFormErrors({
        form: error.response?.data?.message || 'Failed to update notification',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Submit delete
  const handleDeleteSubmit = async () => {
    setSubmitLoading(true);
    try {
      await adminNotificationsService.deleteNotification(selectedNotification.id);
      setIsDeleteModalOpen(false);
      fetchNotifications(currentPage, searchTerm, getFilters());
    } catch (error) {
      if (error.response?.status === 409) {
        alert(error.response?.data?.message || 'Cannot delete this notification');
      } else {
        alert('Failed to delete notification');
      }
    } finally {
      setSubmitLoading(false);
    }
  };

  // Get user display name
  const getUserName = (userId) => {
    const user = users.find((u) => u.id === userId);
    if (!user) return `User #${userId}`;
    return user.firstName
      ? `${user.firstName} ${user.lastName || ''}`.trim()
      : user.email || `User #${userId}`;
  };

  // TODO(human): Implement the getTypeBadgeClass function
  const getTypeBadgeClass = (type) => {
    switch (type) {
      case 'reminder': return styles.badgeReminder;
      case 'pet': return styles.badgePet;
      case 'system': return styles.badgeSystem;
      default: return styles.badge;
    }
  };

  // Table columns
  const columns = [
    {
      key: 'title',
      label: 'Title',
      width: '22%',
    },
    {
      key: 'body',
      label: 'Body',
      width: '25%',
      render: (row) => (
        <span className={styles.bodyCell}>
          {row.body || <span style={{ color: '#ADB5BD' }}>--</span>}
        </span>
      ),
    },
    {
      key: 'type',
      label: 'Type',
      width: '10%',
      render: (row) => (
        <span className={getTypeBadgeClass(row.type)}>
          {row.type || 'N/A'}
        </span>
      ),
    },
    {
      key: 'userId',
      label: 'User',
      width: '18%',
      render: (row) => getUserName(row.userId),
    },
    {
      key: 'isRead',
      label: 'Status',
      width: '10%',
      render: (row) => (
        <span className={row.isRead ? styles.badgeRead : styles.badgeUnread}>
          {row.isRead ? 'Read' : 'Unread'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      label: 'Sent',
      width: '12%',
      render: (row) => new Date(row.createdAt).toLocaleDateString(),
    },
  ];

  // Render send form fields
  const renderSendForm = () => (
    <div className={styles.form}>
      {formErrors.form && (
        <div className="alert alert-danger">{formErrors.form}</div>
      )}

      <Input
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleInputChange}
        error={formErrors.title}
        placeholder="Notification title"
        required
      />

      <div>
        <label className={styles.label}>
          Body <span style={{ color: '#E74C3C' }}>*</span>
        </label>
        <textarea
          name="body"
          value={formData.body}
          onChange={handleInputChange}
          placeholder="Notification message..."
          className={`${styles.textarea} ${formErrors.body ? styles.textareaError : ''}`}
          rows={3}
        />
        {formErrors.body && <span className={styles.errorText}>{formErrors.body}</span>}
      </div>

      <div className={styles.formRow}>
        <div>
          <label className={styles.label}>
            Type <span style={{ color: '#E74C3C' }}>*</span>
          </label>
          <select
            name="type"
            value={formData.type}
            onChange={handleInputChange}
            className={styles.select}
          >
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={styles.label}>
            Send To <span style={{ color: '#E74C3C' }}>*</span>
          </label>
          <select
            name="sendTo"
            value={formData.sendTo}
            onChange={handleInputChange}
            className={styles.select}
          >
            <option value="all">All Users ({users.length})</option>
            <option value="selected">Select Users</option>
          </select>
        </div>
      </div>

      {formData.sendTo === 'selected' && (
        <div>
          <div className={styles.userSelectHeader}>
            <label className={styles.label}>
              Select Users <span style={{ color: '#E74C3C' }}>*</span>
            </label>
            <button
              type="button"
              className={styles.selectAllButton}
              onClick={handleSelectAllUsers}
            >
              {formData.selectedUserIds.length === users.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>
          <div className={styles.userCheckboxList}>
            {users.map((user) => (
              <label key={user.id} className={styles.userCheckboxItem}>
                <input
                  type="checkbox"
                  checked={formData.selectedUserIds.includes(user.id)}
                  onChange={() => handleUserToggle(user.id)}
                  className={styles.checkbox}
                />
                <span className={styles.userName}>
                  {user.firstName
                    ? `${user.firstName} ${user.lastName || ''}`.trim()
                    : user.email}
                </span>
                <span className={styles.userEmail}>{user.email}</span>
              </label>
            ))}
          </div>
          {formErrors.selectedUserIds && (
            <span className={styles.errorText}>{formErrors.selectedUserIds}</span>
          )}
          {formData.selectedUserIds.length > 0 && (
            <div className={styles.selectedCount}>
              {formData.selectedUserIds.length} user{formData.selectedUserIds.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>
      )}

      <div>
        <label className={styles.label}>Data (optional JSON)</label>
        <textarea
          name="data"
          value={formData.data}
          onChange={handleInputChange}
          placeholder='{"screen": "pet", "petId": 1}'
          className={`${styles.textarea} ${styles.codeTextarea} ${formErrors.data ? styles.textareaError : ''}`}
          rows={2}
        />
        {formErrors.data && <span className={styles.errorText}>{formErrors.data}</span>}
      </div>

      {sendProgress && (
        <div className={styles.progressBar}>
          <div className={styles.progressInfo}>
            Sending: {sendProgress.sent + sendProgress.failed} / {sendProgress.total}
            {sendProgress.failed > 0 && (
              <span className={styles.progressFailed}> ({sendProgress.failed} failed)</span>
            )}
            {sendProgress.done && (
              <span className={styles.progressDone}> — Done!</span>
            )}
          </div>
          <div className={styles.progressTrack}>
            <div
              className={styles.progressFill}
              style={{ width: `${((sendProgress.sent + sendProgress.failed) / sendProgress.total) * 100}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );

  // Render edit form fields
  const renderEditForm = () => (
    <div className={styles.form}>
      {formErrors.form && (
        <div className="alert alert-danger">{formErrors.form}</div>
      )}

      <Input
        label="Title"
        name="title"
        value={formData.title}
        onChange={handleInputChange}
        error={formErrors.title}
        placeholder="Notification title"
        required
      />

      <div>
        <label className={styles.label}>
          Body <span style={{ color: '#E74C3C' }}>*</span>
        </label>
        <textarea
          name="body"
          value={formData.body}
          onChange={handleInputChange}
          placeholder="Notification message..."
          className={`${styles.textarea} ${formErrors.body ? styles.textareaError : ''}`}
          rows={3}
        />
        {formErrors.body && <span className={styles.errorText}>{formErrors.body}</span>}
      </div>

      <div>
        <label className={styles.label}>Type</label>
        <select
          name="type"
          value={formData.type}
          onChange={handleInputChange}
          className={styles.select}
        >
          {NOTIFICATION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className={styles.label}>Data (optional JSON)</label>
        <textarea
          name="data"
          value={formData.data}
          onChange={handleInputChange}
          placeholder='{"screen": "pet", "petId": 1}'
          className={`${styles.textarea} ${styles.codeTextarea} ${formErrors.data ? styles.textareaError : ''}`}
          rows={2}
        />
        {formErrors.data && <span className={styles.errorText}>{formErrors.data}</span>}
      </div>
    </div>
  );

  return (
    <div className={styles.notificationsPage}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Notifications</h1>
          <p className={styles.subtitle}>Send and manage push notifications</p>
        </div>
        <Button
          variant="primary"
          icon="bi-send"
          onClick={handleSend}
        >
          Send Notification
        </Button>
      </div>

      {/* Search & Filters */}
      <div className={styles.searchBar}>
        <div className={styles.searchWrapper}>
          <i className="bi bi-search"></i>
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={handleSearch}
            className={styles.searchInput}
            disabled={loading}
          />
        </div>
        <div className={styles.filters}>
          <select
            value={filterUserId}
            onChange={handleFilterUserChange}
            className={styles.filterSelect}
            disabled={loading}
          >
            <option value="">All Users</option>
            {users.map((user) => (
              <option key={user.id} value={user.id}>
                {user.firstName
                  ? `${user.firstName} ${user.lastName || ''}`.trim()
                  : user.email}
              </option>
            ))}
          </select>
          <select
            value={filterType}
            onChange={handleFilterTypeChange}
            className={styles.filterSelect}
            disabled={loading}
          >
            <option value="">All Types</option>
            {NOTIFICATION_TYPES.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
          <select
            value={filterIsRead}
            onChange={handleFilterIsReadChange}
            className={styles.filterSelect}
            disabled={loading}
          >
            <option value="">All Status</option>
            <option value="true">Read</option>
            <option value="false">Unread</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <TablePageSkeleton columns={6} rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={notifications}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          onPageChange={handlePageChange}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          emptyMessage="No notifications found"
        />
      )}

      {/* Send Notification Modal */}
      <Modal
        isOpen={isSendModalOpen}
        onClose={() => !submitLoading && setIsSendModalOpen(false)}
        title="Send Notification"
        size="large"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setIsSendModalOpen(false)}
              disabled={submitLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon="bi-send"
              onClick={handleSendSubmit}
              loading={submitLoading}
              disabled={sendProgress?.done}
            >
              {formData.sendTo === 'all'
                ? `Send to All (${users.length})`
                : `Send to ${formData.selectedUserIds.length} User${formData.selectedUserIds.length !== 1 ? 's' : ''}`
              }
            </Button>
          </>
        }
      >
        {renderSendForm()}
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Notification"
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
        {renderEditForm()}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Notification"
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
          Are you sure you want to delete the notification{' '}
          <strong>{selectedNotification?.title}</strong>? This action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Notifications;
