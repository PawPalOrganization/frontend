import { useState, useEffect } from 'react';
import adminReviewsService from '../../services/adminReviewsService';
import adminClinicsService from '../../services/adminClinicsService';
import DataTable from '../../components/common/DataTable/DataTable';
import Button from '../../components/common/Button/Button';
import Modal from '../../components/common/Modal/Modal';
import TablePageSkeleton from '../../components/common/Skeleton/TablePageSkeleton';
import styles from './Reviews.module.scss';

const PAGE_SIZE = 20;

const SENTIMENT_CONFIG = {
  positive: { label: 'Positive', className: 'sentimentPositive' },
  neutral: { label: 'Neutral', className: 'sentimentNeutral' },
  negative: { label: 'Negative', className: 'sentimentNegative' },
};

// The API response shape for nested summaries isn't pinned down by the Postman collection
// (no saved response examples), so these accessors fall back defensively across the field
// names used elsewhere in this codebase (title for clinic/branch, firstName/lastName/email
// for users) rather than assuming one exact shape.
const getUserName = (review) => {
  const user = review.user;
  if (!user) return 'Unknown user';
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || user.email || `User #${review.userId ?? '?'}`;
};

const getUserEmail = (review) => review.user?.email || '';

const getClinicTitle = (review) =>
  review.clinic?.title || review.clinicBranch?.clinic?.title || (review.clinicId ? `Clinic #${review.clinicId}` : '--');

const getBranchTitle = (review) =>
  review.clinicBranch?.title || review.branch?.title || (review.clinicBranchId ? `Branch #${review.clinicBranchId}` : null);

// The backend's `sentiment` field isn't reliable yet (it was coming back "positive" for every
// review regardless of rating), so sentiment is derived from the star rating instead: <3 stars
// is negative, exactly 3 is neutral, >3 is positive.
const getSentiment = (review) => {
  if (review.rating == null) return null;
  if (review.rating < 3) return 'negative';
  if (review.rating === 3) return 'neutral';
  return 'positive';
};

const Reviews = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [fetchError, setFetchError] = useState('');

  // Filters
  const [clinics, setClinics] = useState([]);
  const [branches, setBranches] = useState([]);
  const [branchesLoading, setBranchesLoading] = useState(false);
  const [clinicFilter, setClinicFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [sort, setSort] = useState('latest');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedReview, setSelectedReview] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const fetchReviews = async (page = 1) => {
    setLoading(true);
    setFetchError('');
    try {
      const response = await adminReviewsService.getAllReviews({
        page,
        limit: PAGE_SIZE,
        clinicId: clinicFilter,
        clinicBranchId: branchFilter,
        includeDeleted,
        sort,
      });
      setReviews(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
      setTotalItems(response.meta?.total || 0);
      setCurrentPage(page);
    } catch (error) {
      setFetchError(error.response?.data?.message || 'Failed to load reviews.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const response = await adminClinicsService.getAllClinics(1, 100, '');
      setClinics(response.data || []);
    } catch {
      // non-critical — filter dropdown just stays empty
    }
  };

  useEffect(() => {
    fetchReviews(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicFilter, branchFilter, includeDeleted, sort]);

  useEffect(() => {
    fetchClinics();
  }, []);

  const handleClinicFilterChange = async (e) => {
    const value = e.target.value;
    setClinicFilter(value);
    setBranchFilter('');
    setBranches([]);
    if (!value) return;
    setBranchesLoading(true);
    try {
      const response = await adminClinicsService.getBranches(parseInt(value, 10));
      setBranches(response.data || response || []);
    } catch {
      setBranches([]);
    } finally {
      setBranchesLoading(false);
    }
  };

  const handlePageChange = (page) => fetchReviews(page);

  const handleDeleteClick = (review) => {
    setSelectedReview(review);
    setDeleteError('');
    setIsDeleteModalOpen(true);
  };

  const handleDeleteSubmit = async () => {
    setDeleteLoading(true);
    setDeleteError('');
    try {
      await adminReviewsService.deleteReview(selectedReview.id);
      setIsDeleteModalOpen(false);
      fetchReviews(currentPage);
    } catch (error) {
      setDeleteError(error.response?.data?.message || 'Failed to delete review.');
    } finally {
      setDeleteLoading(false);
    }
  };

  const columns = [
    {
      key: 'user',
      label: 'Reviewer',
      width: '16%',
      render: (row) => (
        <div className={styles.userCell}>
          <div className={styles.userName}>{getUserName(row)}</div>
          {getUserEmail(row) && <div className={styles.userEmail}>{getUserEmail(row)}</div>}
        </div>
      ),
    },
    {
      key: 'clinic',
      label: 'Clinic / Branch',
      width: '18%',
      render: (row) => (
        <div>
          <div className={styles.clinicTitle}>{getClinicTitle(row)}</div>
          {getBranchTitle(row) && <div className={styles.branchTitle}>{getBranchTitle(row)}</div>}
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      width: '12%',
      render: (row) => (
        <div className={styles.ratingCell}>
          {Array.from({ length: 5 }, (_, i) => (
            <i
              key={i}
              className={`bi ${i < (row.rating || 0) ? 'bi-star-fill' : 'bi-star'} ${styles.starIcon}`}
            />
          ))}
          <span className={styles.ratingValue}>{row.rating ?? '--'}</span>
        </div>
      ),
    },
    {
      key: 'comment',
      label: 'Comment',
      width: '26%',
      render: (row) =>
        row.comment ? (
          <span className={styles.commentCell} title={row.comment}>{row.comment}</span>
        ) : (
          <span style={{ color: '#ADB5BD' }}>--</span>
        ),
    },
    {
      key: 'sentiment',
      label: 'Sentiment',
      width: '12%',
      render: (row) => {
        const sentiment = getSentiment(row);
        const cfg = sentiment ? SENTIMENT_CONFIG[sentiment] : null;
        return cfg ? (
          <span className={`${styles.sentimentBadge} ${styles[cfg.className]}`}>{cfg.label}</span>
        ) : (
          <span style={{ color: '#ADB5BD' }}>--</span>
        );
      },
    },
    {
      key: 'status',
      label: 'Status',
      width: '14%',
      render: (row) =>
        row.deletedAt ? (
          <span className={styles.statusDeleted} title={new Date(row.deletedAt).toLocaleString()}>
            <i className="bi bi-trash" /> Deleted
          </span>
        ) : (
          <span className={styles.statusActive}>Active</span>
        ),
    },
    {
      key: '_actions',
      label: 'Actions',
      width: '10%',
      render: (row) =>
        row.deletedAt ? (
          <span style={{ color: '#ADB5BD', fontSize: '12px' }}>--</span>
        ) : (
          <button
            className={`${styles.actionBtn} ${styles.actionDelete}`}
            onClick={() => handleDeleteClick(row)}
            title="Soft-delete review"
          >
            <i className="bi bi-trash" />
          </button>
        ),
    },
  ];

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Reviews</h1>
          <p className={styles.subtitle}>Moderate clinic reviews submitted by users</p>
        </div>
      </div>

      <div className={styles.filtersBar}>
        <select
          className={styles.filterSelect}
          value={clinicFilter}
          onChange={handleClinicFilterChange}
          disabled={loading}
        >
          <option value="">All clinics</option>
          {clinics.map((clinic) => (
            <option key={clinic.id} value={clinic.id}>{clinic.title}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={branchFilter}
          onChange={(e) => setBranchFilter(e.target.value)}
          disabled={loading || !clinicFilter || branchesLoading}
        >
          <option value="">{clinicFilter ? 'All branches' : 'Select a clinic first'}</option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>{branch.title}</option>
          ))}
        </select>

        <select
          className={styles.filterSelect}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          disabled={loading}
        >
          <option value="latest">Newest first</option>
          <option value="highest">Highest rated</option>
          <option value="lowest">Lowest rated</option>
        </select>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={includeDeleted}
            onChange={(e) => setIncludeDeleted(e.target.checked)}
          />
          <span>Include deleted</span>
        </label>
      </div>

      {fetchError && (
        <div className="alert alert-danger" style={{ marginBottom: '16px' }}>
          <i className="bi bi-exclamation-triangle" style={{ marginRight: '8px' }}></i>
          {fetchError}
        </div>
      )}

      {loading ? (
        <TablePageSkeleton columns={7} rows={8} />
      ) : (
        <DataTable
          columns={columns}
          data={reviews}
          loading={loading}
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={PAGE_SIZE}
          onPageChange={handlePageChange}
          emptyMessage="No reviews found"
        />
      )}

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Review"
        size="small"
        footer={
          <>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={deleteLoading}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteSubmit} loading={deleteLoading}>Delete</Button>
          </>
        }
      >
        {deleteError && <div className="alert alert-danger">{deleteError}</div>}
        <p>
          Delete this review by <strong>{selectedReview ? getUserName(selectedReview) : ''}</strong>?
          This soft-deletes it and recomputes the clinic/branch rating. This cannot be undone from here.
        </p>
      </Modal>
    </div>
  );
};

export default Reviews;
