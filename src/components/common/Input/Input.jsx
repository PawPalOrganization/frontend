import styles from './Input.module.css';

const Input = ({
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  icon,
  ...props
}) => {
  return (
    <div className={styles.inputGroup}>
      {label && (
        <label className={styles.label}>
          {label}
          {required && <span className={styles.required}>*</span>}
        </label>
      )}

      <div className={styles.inputWrapper}>
        {icon && <i className={`bi ${icon} ${styles.icon}`}></i>}

        <input
          type={type}
          className={`${styles.input} ${error ? styles.error : ''} ${icon ? styles.hasIcon : ''}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          {...props}
        />
      </div>

      {error && <span className={styles.errorMessage}>{error}</span>}
    </div>
  );
};

export default Input;
