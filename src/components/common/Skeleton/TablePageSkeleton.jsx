import Skeleton from './Skeleton';
import styles from './TablePageSkeleton.module.scss';

const TablePageSkeleton = ({ columns = 6, rows = 8 }) => {
  return (
    <div className={styles.container}>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Skeleton width="240px" height="32px" className={styles.title} />
          <Skeleton width="180px" height="16px" className={styles.subtitle} />
        </div>
        <Skeleton width="140px" height="44px" variant="rectangular" />
      </div>

      {/* Search Bar */}
      <div className={styles.searchSection}>
        <Skeleton width="100%" maxWidth="400px" height="48px" variant="rectangular" />
      </div>

      {/* Data Table */}
      <div className={styles.tableCard}>
        {/* Table Header */}
        <div className={styles.tableHeader}>
          {Array.from({ length: columns }).map((_, i) => (
            <div key={i} className={styles.headerCell}>
              <Skeleton width="70%" height="14px" />
            </div>
          ))}
          <div className={styles.headerCell}>
            <Skeleton width="60px" height="14px" />
          </div>
        </div>

        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className={styles.tableRow}>
            {Array.from({ length: columns }).map((_, colIndex) => (
              <div key={colIndex} className={styles.tableCell}>
                <Skeleton
                  width={colIndex === 0 ? '85%' : colIndex === 1 ? '75%' : '65%'}
                  height="14px"
                />
              </div>
            ))}
            {/* Actions */}
            <div className={styles.tableCell}>
              <div className={styles.actions}>
                <Skeleton width="32px" height="32px" variant="circular" />
                <Skeleton width="32px" height="32px" variant="circular" />
              </div>
            </div>
          </div>
        ))}

        {/* Table Footer */}
        <div className={styles.tableFooter}>
          <Skeleton width="180px" height="16px" />
          <div className={styles.pagination}>
            <Skeleton width="36px" height="36px" variant="rectangular" />
            <Skeleton width="36px" height="36px" variant="rectangular" />
            <Skeleton width="36px" height="36px" variant="rectangular" />
            <Skeleton width="36px" height="36px" variant="rectangular" />
            <Skeleton width="36px" height="36px" variant="rectangular" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default TablePageSkeleton;
