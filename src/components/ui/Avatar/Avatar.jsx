import styles from './Avatar.module.css';

export const Avatar = ({ name, number, icon: Icon, className = '' }) => {
  let display;
  if (Icon) {
    display = <Icon />;
  } else {
    display = number !== undefined ? String(number) : (name ? name.charAt(0) : '?');
  }

  return (
    <div className={`${styles.avatar} ${className}`}>
      {display}
    </div>
  );
};