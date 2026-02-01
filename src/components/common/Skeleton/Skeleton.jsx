import styles from './Skeleton.module.scss';

const Skeleton = ({ width = '100%', height = '16px', variant = 'text', className = '', maxWidth }) => {
  const style = { width, height };
  if (maxWidth) style.maxWidth = maxWidth;

  return (
    <div
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={style}
    />
  );
};

export default Skeleton;
