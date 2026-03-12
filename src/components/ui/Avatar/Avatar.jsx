import styles from './Avatar.module.css';

export const Avatar = ({ name, className = '' }) => {
  const initial = name ? name.charAt(0) : '?';
  return (
    <div className={`${styles.avatar} ${className}`}>
      {initial}
    </div>
  );
};