import styles from './AuthLayout.module.css';
import logoBIND from '../../../assets/images/bind-g-logo.svg';

export const AuthLayout = ({ 
  children, 
  brandTitle = "Bienvenido a Bind Garantías", 
  brandSubtitle = "Gestioná tus garantías y pagarés de forma ágil y segura." 
}) => {
  return (
    <div className={styles.page}>
      <div className={styles.globalLogo}>
        <logoBIND />
        <span style={{ color: 'white', fontWeight: 'bold' }}>LOGO</span>
      </div>

      <div className={styles.layoutSplit}>
        
        <div className={styles.sideForm}>
          <div className={styles.formContainer}>
            {children}
          </div>
        </div>

        <div className={styles.sideBrand}>
          <div className={styles.brandContent}>
            <h1 className={styles.brandTitle}>{brandTitle}</h1>
            <p className={styles.brandSubtitle}>{brandSubtitle}</p>
          </div>
        </div>

      </div>
    </div>
  );
};