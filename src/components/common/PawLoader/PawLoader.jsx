import styles from './PawLoader.module.scss';

const PawIcon = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 512 512" fill="currentColor">
    <path d="M226.5 92.9c14.3 42.9-.3 86.2-32.6 96.8s-70.1-15.6-84.4-58.5.3-86.2 32.6-96.8 70.1 15.6 84.4 58.5zM100.4 198.6c18.9 32.4 14.3 70.1-10.2 84.1s-59.7-.9-78.5-33.3S-2.7 179.3 21.8 165.3s59.7.9 78.6 33.3zM69.2 401.2C121.6 259.9 214.7 224 256 224s134.4 35.9 186.8 177.2c3.6 9.7 5.2 20.1 5.2 30.5v1.6c0 25.8-20.9 46.7-46.7 46.7-11.5 0-22.9-1.4-34-4.2l-88-22c-15.3-3.8-31.3-3.8-46.6 0l-88 22c-11.1 2.8-22.5 4.2-34 4.2-25.8 0-46.7-20.9-46.7-46.7v-1.6c0-10.4 1.6-20.8 5.2-30.5zM318 128.4c-14.3-42.9.3-86.2 32.6-96.8s70.1 15.6 84.4 58.5-.3 86.2-32.6 96.8-70.1-15.6-84.4-58.5zm131.4 163.3c-18.9-32.4-14.3-70.1 10.2-84.1s59.7.9 78.5 33.3 14.3 70.1-10.2 84.1-59.7-.9-78.5-33.3z" />
  </svg>
);

const PawLoader = ({ size = 'medium' }) => {
  const iconSize = size === 'small' ? 14 : size === 'large' ? 24 : 18;

  return (
    <span className={`${styles.pawLoader} ${styles[size]}`}>
      <span className={styles.pawDot}><PawIcon size={iconSize} /></span>
      <span className={styles.pawDot}><PawIcon size={iconSize} /></span>
      <span className={styles.pawDot}><PawIcon size={iconSize} /></span>
    </span>
  );
};

export default PawLoader;
