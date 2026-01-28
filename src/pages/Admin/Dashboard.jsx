import { useState, useEffect } from 'react';
import adminUsersService from '../../services/adminUsersService';
import adminPetsService from '../../services/adminPetsService';
import adminAdminsService from '../../services/adminAdminsService';
import adminPetTypesService from '../../services/adminPetTypesService';
import styles from './Dashboard.module.scss';

const Dashboard = () => {
  const [stats, setStats] = useState({
    users: 0,
    pets: 0,
    admins: 0,
    petTypes: 0,
  });
  const [loading, setLoading] = useState(true);

  // Fetch all stats on component mount
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch each stat individually to handle errors separately
        let usersCount = 0;
        let petsCount = 0;
        let adminsCount = 0;
        let petTypesCount = 0;

        // Fetch users
        try {
          const usersRes = await adminUsersService.getAllUsers(1, 1);
          console.log('Users response:', usersRes);
          usersCount = usersRes.meta?.total || 0;
        } catch (err) {
          console.error('Failed to fetch users:', err.response?.data || err.message);
        }

        // Fetch pets
        try {
          const petsRes = await adminPetsService.getAllPets(1, 1);
          console.log('Pets response:', petsRes);
          petsCount = petsRes.meta?.total || 0;
        } catch (err) {
          console.error('Failed to fetch pets:', err.response?.data || err.message);
        }

        // Fetch admins
        try {
          const adminsRes = await adminAdminsService.getAllAdmins(1, 1);
          console.log('Admins response:', adminsRes);
          adminsCount = adminsRes.meta?.total || 0;
        } catch (err) {
          console.error('Failed to fetch admins:', err.response?.data || err.message);
        }

        // Fetch pet types
        try {
          const petTypesRes = await adminPetTypesService.getAllPetTypes(1, 1);
          console.log('Pet Types response:', petTypesRes);
          petTypesCount = petTypesRes.meta?.total || 0;
        } catch (err) {
          console.error('Failed to fetch pet types:', err.response?.data || err.message);
        }

        setStats({
          users: usersCount,
          pets: petsCount,
          admins: adminsCount,
          petTypes: petTypesCount,
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className={styles.dashboard}>
      <h1 className={styles.title}>Dashboard</h1>
      <p className={styles.subtitle}>Welcome to the Paw Buddy Admin Panel</p>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="bi bi-people"></i>
          </div>
          <div className={styles.statContent}>
            <h3>Total Users</h3>
            <p className={styles.statNumber}>
              {loading ? '...' : stats.users}
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="bi bi-heart"></i>
          </div>
          <div className={styles.statContent}>
            <h3>Total Pets</h3>
            <p className={styles.statNumber}>
              {loading ? '...' : stats.pets}
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="bi bi-shield"></i>
          </div>
          <div className={styles.statContent}>
            <h3>Admins</h3>
            <p className={styles.statNumber}>
              {loading ? '...' : stats.admins}
            </p>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <i className="bi bi-tag"></i>
          </div>
          <div className={styles.statContent}>
            <h3>Pet Types</h3>
            <p className={styles.statNumber}>
              {loading ? '...' : stats.petTypes}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
