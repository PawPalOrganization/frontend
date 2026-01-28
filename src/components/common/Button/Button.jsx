import styles from './Button.module.css';

const Button = ({
  children,
  variant = 'primary', // primary, secondary, danger, outline
  size = 'medium', // small, medium, large
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
  icon,
  ...props
}) => {
  const buttonClass = `
    ${styles.button}
    ${styles[variant]}
    ${styles[size]}
    ${fullWidth ? styles.fullWidth : ''}
    ${disabled || loading ? styles.disabled : ''}
    ${className}
  `.trim();

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <span className={`spinner-border spinner-border-sm ${styles.spinner}`} />
      )}
      {!loading && icon && <i className={`bi ${icon} ${styles.icon}`}></i>}
      {children}
    </button>
  );
};

export default Button;
