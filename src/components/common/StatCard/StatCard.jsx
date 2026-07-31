import PawLoader from '../PawLoader/PawLoader';
import styles from './StatCard.module.scss';

const StatCard = ({ icon, label, value, loading, onClick, iconBg, trend, trendTone = 'neutral' }) => {
  const trendClassName =
    trendTone === 'up' ? styles.trendUp : trendTone === 'down' ? styles.trendDown : styles.trendNeutral;

  return (
    <div
      className={styles.statCard}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <div className={styles.statIcon} style={iconBg ? { background: iconBg } : undefined}>
        <i className={`bi ${icon}`}></i>
      </div>
      <div className={styles.statContent}>
        <h3>{label}</h3>
        <p className={styles.statNumber}>{loading ? <PawLoader size="small" /> : value}</p>
        {!loading && trend && <span className={`${styles.trend} ${trendClassName}`}>{trend}</span>}
      </div>
    </div>
  );
};

export default StatCard;
