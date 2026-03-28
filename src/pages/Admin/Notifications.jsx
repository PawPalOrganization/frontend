import { useState, useEffect } from 'react';
import adminNotificationsService from '../../services/adminNotificationsService';
import adminUsersService from '../../services/adminUsersService';
import adminAppSettingsService from '../../services/adminAppSettingsService';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import styles from './Notifications.module.scss';

const Notifications = () => {
  // Notification system enabled state
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  // Users for selection
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    sendTo: 'all', // 'all' or 'selected'
    selectedUserIds: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch users and notification enabled state on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, settingsRes] = await Promise.all([
          adminUsersService.getUsersForDropdown(),
          adminAppSettingsService.getAllAppSettings(1, 50),
        ]);
        setUsers(usersRes.data || []);

        const notifSetting = (settingsRes.data || []).find(
          (s) => s.token === 'enable_system_notifications'
        );
        if (notifSetting) {
          setNotificationsEnabled(String(notifSetting.value?.value) === 'true');
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchData();
  }, []);

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    // Clear result when user starts editing
    if (result) setResult(null);
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
    const filtered = getFilteredUsers();
    const allFilteredIds = filtered.map((u) => u.id);
    const allSelected = allFilteredIds.every((id) => formData.selectedUserIds.includes(id));

    if (allSelected) {
      // Deselect only filtered users
      setFormData((prev) => ({
        ...prev,
        selectedUserIds: prev.selectedUserIds.filter((id) => !allFilteredIds.includes(id)),
      }));
    } else {
      // Select all filtered users (merge with existing)
      setFormData((prev) => ({
        ...prev,
        selectedUserIds: [...new Set([...prev.selectedUserIds, ...allFilteredIds])],
      }));
    }
  };

  // Filter users by search
  const getFilteredUsers = () => {
    if (!userSearchTerm.trim()) return users;
    const term = userSearchTerm.toLowerCase();
    return users.filter((user) => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      return name.includes(term) || email.includes(term);
    });
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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submit notification
  const handleSubmit = async () => {
    if (!notificationsEnabled) return;
    if (!validateForm()) return;

    setSubmitLoading(true);
    setResult(null);

    const payload = {
      title: formData.title,
      body: formData.body,
    };

    try {
      if (formData.sendTo === 'all') {
        // Send to all users — single API call
        const response = await adminNotificationsService.sendToAll(payload);
        setResult({
          success: true,
          message: response.message || 'Notification sent to all users',
          sent: response.data?.sent,
          skipped: response.data?.skipped,
        });
      } else {
        // Send to selected users — one call per user
        let sent = 0;
        let failed = 0;
        for (const userId of formData.selectedUserIds) {
          try {
            await adminNotificationsService.sendToUser(userId, payload);
            sent++;
          } catch {
            failed++;
          }
        }
        setResult({
          success: failed === 0,
          message: `Sent: ${sent}${failed > 0 ? `, Failed: ${failed}` : ''}`,
          sent,
          failed,
        });
      }

      // Reset form on success
      setFormData({
        title: '',
        body: '',
        sendTo: formData.sendTo,
        selectedUserIds: [],
      });
      setUserSearchTerm('');
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Failed to send notification',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredUsers = getFilteredUsers();
  const allFilteredSelected = filteredUsers.length > 0 &&
    filteredUsers.every((u) => formData.selectedUserIds.includes(u.id));

  return (
    <div className={styles.notificationsPage}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Send Notifications</h1>
          <p className={styles.subtitle}>Send push notifications to your users</p>
        </div>
      </div>

      {/* Send Form Card */}
      <div className={styles.formCard}>
        {/* Notifications Disabled Banner */}
        {!notificationsEnabled && (
          <div className={styles.disabledBanner}>
            <i className="bi bi-bell-slash"></i>
            <div>
              <strong>Notifications are disabled</strong>
              <span>Enable system notifications in App Settings to send notifications.</span>
            </div>
          </div>
        )}

        {/* Result Banner */}
        {result && (
          <div className={`${styles.resultBanner} ${result.success ? styles.resultSuccess : styles.resultError}`}>
            <i className={`bi ${result.success ? 'bi-check-circle' : 'bi-exclamation-circle'}`}></i>
            <span>{result.message}</span>
          </div>
        )}

        <div className={styles.form}>
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
              Message <span style={{ color: '#E74C3C' }}>*</span>
            </label>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleInputChange}
              placeholder="Write your notification message..."
              className={`${styles.textarea} ${formErrors.body ? styles.textareaError : ''}`}
              rows={4}
            />
            {formErrors.body && <span className={styles.errorText}>{formErrors.body}</span>}
          </div>

          {/* Send To Selection */}
          <div>
            <label className={styles.label}>
              Send To <span style={{ color: '#E74C3C' }}>*</span>
            </label>
            <div className={styles.sendToOptions}>
              <label className={`${styles.sendToOption} ${formData.sendTo === 'all' ? styles.sendToActive : ''}`}>
                <input
                  type="radio"
                  name="sendTo"
                  value="all"
                  checked={formData.sendTo === 'all'}
                  onChange={handleInputChange}
                  className={styles.radioInput}
                />
                <i className="bi bi-people"></i>
                <div>
                  <div className={styles.sendToLabel}>All Users</div>
                  <div className={styles.sendToDesc}>{users.length} users will receive this</div>
                </div>
              </label>
              <label className={`${styles.sendToOption} ${formData.sendTo === 'selected' ? styles.sendToActive : ''}`}>
                <input
                  type="radio"
                  name="sendTo"
                  value="selected"
                  checked={formData.sendTo === 'selected'}
                  onChange={handleInputChange}
                  className={styles.radioInput}
                />
                <i className="bi bi-person-check"></i>
                <div>
                  <div className={styles.sendToLabel}>Select Users</div>
                  <div className={styles.sendToDesc}>Choose specific users</div>
                </div>
              </label>
            </div>
          </div>

          {/* User Selection */}
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
                  {allFilteredSelected ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {/* User search */}
              <div className={styles.userSearchWrapper}>
                <i className="bi bi-search"></i>
                <input
                  type="text"
                  placeholder="Search users..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  className={styles.userSearchInput}
                />
              </div>

              <div className={styles.userCheckboxList}>
                {filteredUsers.length === 0 ? (
                  <div className={styles.noUsers}>No users found</div>
                ) : (
                  filteredUsers.map((user) => (
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
                  ))
                )}
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

          {/* Send Button */}
          <div className={styles.sendButtonWrapper}>
            <Button
              variant="primary"
              icon="bi-send"
              onClick={handleSubmit}
              loading={submitLoading}
              disabled={!notificationsEnabled}
            >
              {formData.sendTo === 'all'
                ? `Send to All Users (${users.length})`
                : `Send to ${formData.selectedUserIds.length} User${formData.selectedUserIds.length !== 1 ? 's' : ''}`
              }
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
