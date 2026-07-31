import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import adminUsersService from '../../services/adminUsersService';
import adminPetsService from '../../services/adminPetsService';
import adminAdminsService from '../../services/adminAdminsService';
import adminPetTypesService from '../../services/adminPetTypesService';
import adminPetTypeBreedsService from '../../services/adminPetTypeBreedsService';
import adminUserRolesService from '../../services/adminUserRolesService';
import adminClinicsService from '../../services/adminClinicsService';
import adminClinicServicesService from '../../services/adminClinicServicesService';
import adminClinicStaffService from '../../services/adminClinicStaffService';
import adminReviewsService from '../../services/adminReviewsService';
import adminAppSettingsService from '../../services/adminAppSettingsService';

import StatCard from '../../components/common/StatCard/StatCard';
import PawLoader from '../../components/common/PawLoader/PawLoader';
import styles from './Dashboard.module.scss';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
// Large enough to cover most clinics' current scale in one request; "new this week"
// is only shown when this actually covers the full dataset (see countRecentlyCreated)
// so a clinic that outgrows it just silently loses the trend line, never shows a wrong one.
const BULK_LIMIT = 200;

const CLINIC_STATUS_COLORS = { Approved: '#27AE60', Pending: '#F39C12', Rejected: '#E74C3C' };

// Same defensive-accessor approach as Reviews.jsx — the nested user/clinic shape on a
// review isn't pinned down by a documented API contract, so fall back gracefully.
const getReviewUserName = (review) => {
  const user = review.user;
  if (!user) return 'Unknown user';
  const name = `${user.firstName || ''} ${user.lastName || ''}`.trim();
  return name || user.email || `User #${review.userId ?? '?'}`;
};

const getReviewClinicTitle = (review) =>
  review.clinic?.title || review.clinicBranch?.clinic?.title || (review.clinicId ? `Clinic #${review.clinicId}` : 'Unknown clinic');

// Only trustworthy when the bulk fetch actually covered the whole dataset — otherwise
// records outside the fetched page would silently be excluded from the count, making
// "+N this week" read as complete when it's actually a partial (and shrinking, as the
// dataset grows) sample. Returns null (render nothing) rather than a misleading number.
function countRecentlyCreated(items, total) {
  if (!items || total == null || total > items.length) return null;
  const cutoff = Date.now() - SEVEN_DAYS_MS;
  return items.filter((item) => item.createdAt && new Date(item.createdAt).getTime() >= cutoff).length;
}

function HealthBadge({ value }) {
  if (value === null) return <span className={styles.healthBadgeUnknown}>Unknown</span>;
  return value ? (
    <span className={styles.healthBadgeOn}><i className="bi bi-check-circle-fill"></i> Enabled</span>
  ) : (
    <span className={styles.healthBadgeOff}><i className="bi bi-x-circle-fill"></i> Disabled</span>
  );
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0, pets: 0, admins: 0, petTypes: 0, petBreeds: 0, userRoles: 0,
    clinics: 0, clinicServices: 0, clinicStaff: 0, reviews: 0,
  });
  const [usersTrend, setUsersTrend] = useState(null);
  const [clinicsTrend, setClinicsTrend] = useState(null);
  const [clinicStatus, setClinicStatus] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [avgClinicRating, setAvgClinicRating] = useState(null);
  const [recentReviews, setRecentReviews] = useState([]);
  const [systemHealth, setSystemHealth] = useState({ notifications: null, emails: null });

  useEffect(() => {
    let cancelled = false;

    const loadDashboard = async () => {
      const results = await Promise.allSettled([
        adminUsersService.getAllUsers(1, BULK_LIMIT, ''),
        adminPetsService.getAllPets(1, 1),
        adminAdminsService.getAllAdmins(1, 1),
        adminPetTypesService.getAllPetTypes(1, 1),
        adminPetTypeBreedsService.getAllPetTypeBreeds(1, 1),
        adminUserRolesService.getAllUserRoles(1, 1),
        adminClinicsService.getAllClinics(1, BULK_LIMIT, ''),
        adminClinicServicesService.getAllClinicServices(1, 1),
        adminClinicStaffService.getAllClinicStaff(1, 1),
        adminReviewsService.getAllReviews({ page: 1, limit: 5, sort: 'latest' }),
        adminAppSettingsService.getAllAppSettings(1, 50),
      ]);
      if (cancelled) return;

      // Each stat degrades independently on failure — one bad endpoint shouldn't
      // blank out the whole dashboard, same resilience posture as before.
      const ok = (result) => (result.status === 'fulfilled' ? result.value : null);
      const [
        usersRes, petsRes, adminsRes, petTypesRes, petBreedsRes, userRolesRes,
        clinicsRes, clinicServicesRes, clinicStaffRes, reviewsRes, appSettingsRes,
      ] = results.map(ok);

      setStats({
        users: usersRes?.meta?.total || 0,
        pets: petsRes?.meta?.total || 0,
        admins: adminsRes?.meta?.total || 0,
        petTypes: petTypesRes?.meta?.total || 0,
        petBreeds: petBreedsRes?.meta?.total || 0,
        userRoles: userRolesRes?.meta?.total || 0,
        clinics: clinicsRes?.meta?.total || 0,
        clinicServices: clinicServicesRes?.meta?.total || 0,
        clinicStaff: clinicStaffRes?.meta?.total || 0,
        reviews: reviewsRes?.meta?.total || 0,
      });

      setUsersTrend(usersRes ? countRecentlyCreated(usersRes.data, usersRes.meta?.total) : null);

      if (clinicsRes) {
        const items = clinicsRes.data || [];
        const breakdown = { pending: 0, approved: 0, rejected: 0 };
        let ratingSum = 0;
        let ratingCount = 0;
        items.forEach((clinic) => {
          if (clinic.approved === true) breakdown.approved += 1;
          else if (clinic.approved === false) breakdown.rejected += 1;
          else breakdown.pending += 1;
          if (clinic.avgRating != null) {
            ratingSum += Number(clinic.avgRating);
            ratingCount += 1;
          }
        });
        setClinicStatus(breakdown);
        setAvgClinicRating(ratingCount > 0 ? ratingSum / ratingCount : null);
        setClinicsTrend(countRecentlyCreated(items, clinicsRes.meta?.total));
      }

      setRecentReviews(reviewsRes?.data || []);

      const appSettings = appSettingsRes?.data || [];
      const findToggle = (token) => {
        const setting = appSettings.find((s) => s.token === token);
        return setting ? String(setting.value?.value) === 'true' : null;
      };
      setSystemHealth({
        notifications: findToggle('enable_system_notifications'),
        emails: findToggle('enable_transactional_emails'),
      });

      setLoading(false);
    };

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const clinicChartData = [
    { name: 'Approved', value: clinicStatus.approved },
    { name: 'Pending', value: clinicStatus.pending },
    { name: 'Rejected', value: clinicStatus.rejected },
  ].filter((slice) => slice.value > 0);
  const totalClinicsInChart = clinicStatus.approved + clinicStatus.pending + clinicStatus.rejected;

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.subtitle}>Welcome to the Paw-Pal Admin Panel</p>

      <h2 className={styles.sectionTitle}>Platform</h2>
      <div className={styles.statsGrid}>
        <StatCard
          icon="bi-people"
          label="Total Users"
          value={stats.users}
          loading={loading}
          onClick={() => navigate('/admin/users')}
          trend={usersTrend != null ? `+${usersTrend} this week` : undefined}
          trendTone="up"
        />
        <StatCard icon="bi-heart" label="Total Pets" value={stats.pets} loading={loading} onClick={() => navigate('/admin/pets')} />
        <StatCard icon="bi-shield" label="Admins" value={stats.admins} loading={loading} onClick={() => navigate('/admin/admins')} />
        <StatCard icon="bi-tag" label="Pet Types" value={stats.petTypes} loading={loading} onClick={() => navigate('/admin/pet-types')} />
        <StatCard icon="bi-bookmark-star" label="Pet Breeds" value={stats.petBreeds} loading={loading} onClick={() => navigate('/admin/pet-type-breeds')} />
        <StatCard icon="bi-person-badge" label="User Roles" value={stats.userRoles} loading={loading} onClick={() => navigate('/admin/user-roles')} />
      </div>

      <h2 className={styles.sectionTitle}>Clinics Network</h2>
      <div className={styles.statsGrid}>
        <StatCard
          icon="bi-hospital"
          label="Clinics"
          value={stats.clinics}
          loading={loading}
          onClick={() => navigate('/admin/clinics')}
          iconBg="linear-gradient(135deg, #8b5cf6, #6d28d9)"
          trend={clinicsTrend != null ? `+${clinicsTrend} this week` : undefined}
          trendTone="up"
        />
        <StatCard
          icon="bi-clock-history"
          label="Pending Approval"
          value={clinicStatus.pending}
          loading={loading}
          onClick={() => navigate('/admin/clinics')}
          iconBg="linear-gradient(135deg, #f39c12, #d68910)"
        />
        <StatCard
          icon="bi-gear-wide-connected"
          label="Clinic Services"
          value={stats.clinicServices}
          loading={loading}
          onClick={() => navigate('/admin/clinic-services')}
          iconBg="linear-gradient(135deg, #8b5cf6, #6d28d9)"
        />
        <StatCard
          icon="bi-person-workspace"
          label="Clinic Staff"
          value={stats.clinicStaff}
          loading={loading}
          onClick={() => navigate('/admin/clinic-staff')}
          iconBg="linear-gradient(135deg, #8b5cf6, #6d28d9)"
        />
        <StatCard
          icon="bi-star-fill"
          label="Avg. Clinic Rating"
          value={avgClinicRating != null ? avgClinicRating.toFixed(1) : '--'}
          loading={loading}
          onClick={() => navigate('/admin/reviews')}
          iconBg="linear-gradient(135deg, #27ae60, #1e8449)"
        />
        <StatCard
          icon="bi-chat-left-text"
          label="Reviews"
          value={stats.reviews}
          loading={loading}
          onClick={() => navigate('/admin/reviews')}
          iconBg="linear-gradient(135deg, #27ae60, #1e8449)"
        />
      </div>

      <div className={styles.widgetsGrid}>
        <div className={styles.widgetCard}>
          <h3 className={styles.widgetTitle}>Clinic Approval Status</h3>
          {loading ? (
            <div className={styles.widgetLoading}><PawLoader /></div>
          ) : totalClinicsInChart === 0 ? (
            <p className={styles.widgetEmpty}>No clinics yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={clinicChartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={2}>
                  {clinicChartData.map((slice) => (
                    <Cell key={slice.name} fill={CLINIC_STATUS_COLORS[slice.name]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className={styles.widgetCard}>
          <div className={styles.widgetHeader}>
            <h3 className={styles.widgetTitle}>Recent Reviews</h3>
            <button className={styles.widgetLink} onClick={() => navigate('/admin/reviews')}>View all</button>
          </div>
          {loading ? (
            <div className={styles.widgetLoading}><PawLoader /></div>
          ) : recentReviews.length === 0 ? (
            <p className={styles.widgetEmpty}>No reviews yet.</p>
          ) : (
            <ul className={styles.reviewList}>
              {recentReviews.map((review) => (
                <li key={review.id} className={styles.reviewItem}>
                  <div className={styles.reviewStars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <i key={i} className={`bi ${i < (review.rating || 0) ? 'bi-star-fill' : 'bi-star'}`}></i>
                    ))}
                  </div>
                  <p className={styles.reviewMeta}>
                    <strong>{getReviewUserName(review)}</strong> on {getReviewClinicTitle(review)}
                  </p>
                  {review.comment && <p className={styles.reviewComment}>{review.comment}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className={styles.widgetCard}>
          <h3 className={styles.widgetTitle}>System Health</h3>
          <div className={styles.healthRow}>
            <span>System Notifications</span>
            <HealthBadge value={systemHealth.notifications} />
          </div>
          <div className={styles.healthRow}>
            <span>Transactional Emails</span>
            <HealthBadge value={systemHealth.emails} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
