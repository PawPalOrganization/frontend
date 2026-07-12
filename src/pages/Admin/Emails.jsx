import { useState, useEffect } from 'react';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import adminEmailsService from '../../services/adminEmailsService';
import adminUsersService from '../../services/adminUsersService';
import adminAppSettingsService from '../../services/adminAppSettingsService';
import Button from '../../components/common/Button/Button';
import Input from '../../components/common/Input/Input';
import styles from './Emails.module.scss';

const QUILL_MODULES = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

const Emails = () => {
  // Email system enabled state
  const [emailsEnabled, setEmailsEnabled] = useState(true);

  // Users for selection
  const [users, setUsers] = useState([]);
  const [userSearchTerm, setUserSearchTerm] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    subject: '',
    html: '',
    text: '',
    sendTo: 'all', // 'all' or 'selected'
    selectedUserIds: [],
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitLoading, setSubmitLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Fetch users and email enabled setting on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [usersRes, settingsRes] = await Promise.all([
          adminUsersService.getUsersForDropdown(),
          adminAppSettingsService.getAllAppSettings(1, 50),
        ]);
        setUsers(usersRes.data || []);

        const emailSetting = (settingsRes.data || []).find(
          (s) => s.token === 'enable_transactional_emails'
        );
        if (emailSetting) {
          setEmailsEnabled(String(emailSetting.value?.value) === 'true');
        }
      } catch {
        // silently continue — page remains functional
      }
    };
    fetchData();
  }, []);

  // Handle text input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: '' }));
    }
    if (result) setResult(null);
  };

  // Handle ReactQuill change for html field
  const handleHtmlChange = (value) => {
    setFormData((prev) => ({ ...prev, html: value }));
    if (formErrors.html) {
      setFormErrors((prev) => ({ ...prev, html: '' }));
    }
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

  // Select/deselect all filtered users
  const handleSelectAllUsers = () => {
    const filtered = getFilteredUsers();
    const allFilteredIds = filtered.map((u) => u.id);
    const allSelected = allFilteredIds.every((id) => formData.selectedUserIds.includes(id));

    if (allSelected) {
      setFormData((prev) => ({
        ...prev,
        selectedUserIds: prev.selectedUserIds.filter((id) => !allFilteredIds.includes(id)),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedUserIds: [...new Set([...prev.selectedUserIds, ...allFilteredIds])],
      }));
    }
  };

  // Filter users by search term
  const getFilteredUsers = () => {
    if (!userSearchTerm.trim()) return users;
    const term = userSearchTerm.toLowerCase();
    return users.filter((user) => {
      const name = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      return name.includes(term) || email.includes(term);
    });
  };

  // Strip HTML tags to check if html field is empty
  const isHtmlEmpty = (html) => {
    return !html || html.replace(/<[^>]*>/g, '').trim() === '';
  };

  // Validate form
  const validateForm = () => {
    const errors = {};

    if (!formData.subject.trim()) {
      errors.subject = 'Subject is required';
    }

    if (isHtmlEmpty(formData.html)) {
      errors.html = 'Email body is required';
    }

    if (formData.sendTo === 'selected' && formData.selectedUserIds.length === 0) {
      errors.selectedUserIds = 'Please select at least one user';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Build email payload
  const buildPayload = () => {
    const payload = {
      subject: formData.subject,
      html: formData.html,
    };
    if (formData.text.trim()) {
      payload.text = formData.text;
    }
    return payload;
  };

  // Submit
  const handleSubmit = async () => {
    if (!emailsEnabled) return;
    if (!validateForm()) return;

    setSubmitLoading(true);
    setResult(null);

    const payload = buildPayload();

    try {
      if (formData.sendTo === 'all') {
        const response = await adminEmailsService.sendToAll(payload);
        const data = response.data || response;
        setResult({
          success: true,
          message: response.message || 'Email sent to all users',
          sent: data.sent,
          skipped: data.skipped,
          failed: data.failed,
        });
      } else {
        // Loop through selected users — one call per user
        let sent = 0;
        let failed = 0;
        for (const userId of formData.selectedUserIds) {
          try {
            await adminEmailsService.sendToUser(userId, payload);
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
        subject: '',
        html: '',
        text: '',
        sendTo: formData.sendTo,
        selectedUserIds: [],
      });
      setUserSearchTerm('');
    } catch (error) {
      setResult({
        success: false,
        message: error.response?.data?.message || 'Failed to send email',
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  const filteredUsers = getFilteredUsers();
  const allFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => formData.selectedUserIds.includes(u.id));

  return (
    <div className={styles.emailsPage}>
      {/* Page Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Send Emails</h1>
          <p className={styles.subtitle}>Send emails to your users</p>
        </div>
      </div>

      {/* Send Form Card */}
      <div className={styles.formCard}>
        {/* Emails Disabled Banner */}
        {!emailsEnabled && (
          <div className={styles.disabledBanner}>
            <i className="bi bi-envelope-slash"></i>
            <div>
              <strong>Transactional emails are disabled</strong>
              <span>Enable transactional emails in App Settings to send emails.</span>
            </div>
          </div>
        )}

        {/* Result Banner */}
        {result && (
          <div
            className={`${styles.resultBanner} ${result.success ? styles.resultSuccess : styles.resultError}`}
          >
            <i className={`bi ${result.success ? 'bi-check-circle' : 'bi-exclamation-circle'}`}></i>
            <div className={styles.resultContent}>
              <span>{result.message}</span>
              {result.skipped > 0 && (
                <span className={styles.resultNote}>
                  {result.skipped} user{result.skipped !== 1 ? 's' : ''} skipped (no email on file)
                </span>
              )}
            </div>
          </div>
        )}

        <div className={styles.form}>
          {/* Subject */}
          <Input
            label="Subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            error={formErrors.subject}
            placeholder="e.g. Important update from PawPal"
            icon="bi-envelope"
            required
          />

          {/* HTML Body — ReactQuill */}
          <div>
            <label className={styles.label}>
              Email Body <span style={{ color: '#E74C3C' }}>*</span>
            </label>
            <div className={`${styles.quillWrapper} ${formErrors.html ? styles.quillError : ''}`}>
              <ReactQuill
                theme="snow"
                value={formData.html}
                onChange={handleHtmlChange}
                modules={QUILL_MODULES}
                placeholder="Write your email content here..."
              />
            </div>
            {formErrors.html && <span className={styles.errorText}>{formErrors.html}</span>}
          </div>

          {/* Plain Text Fallback — optional */}
          <div>
            <label className={styles.label}>
              Plain Text Fallback{' '}
              <span className={styles.optionalBadge}>optional</span>
            </label>
            <textarea
              name="text"
              value={formData.text}
              onChange={handleInputChange}
              placeholder="Plain text version for email clients that don't render HTML..."
              className={styles.textarea}
              rows={3}
            />
          </div>

          {/* Send To Selection */}
          <div>
            <label className={styles.label}>
              Send To <span style={{ color: '#E74C3C' }}>*</span>
            </label>
            <div className={styles.sendToOptions}>
              <label
                className={`${styles.sendToOption} ${formData.sendTo === 'all' ? styles.sendToActive : ''}`}
              >
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
              <label
                className={`${styles.sendToOption} ${formData.sendTo === 'selected' ? styles.sendToActive : ''}`}
              >
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
                  {formData.selectedUserIds.length} user
                  {formData.selectedUserIds.length !== 1 ? 's' : ''} selected
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
              disabled={!emailsEnabled}
            >
              {formData.sendTo === 'all'
                ? `Send to All Users (${users.length})`
                : `Send to ${formData.selectedUserIds.length} User${formData.selectedUserIds.length !== 1 ? 's' : ''}`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Emails;
