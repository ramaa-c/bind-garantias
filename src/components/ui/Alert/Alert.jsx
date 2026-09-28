import React from "react";
import {
  FiInfo,
  FiAlertTriangle,
  FiCheckCircle,
  FiXCircle,
} from "react-icons/fi";
import styles from "./Alert.module.css";

const ICON_MAP = {
  warning: FiAlertTriangle,
  success: FiCheckCircle,
  error: FiXCircle,
  info: FiInfo,
};

export const Alert = ({
  children,
  variant = "info",
  layout = "box",
  className = "",
  icon: CustomIcon,
}) => {
  const DefaultIcon = ICON_MAP[variant] || ICON_MAP.info;
  const containerClass = `${styles.base} ${styles[layout]} ${styles[variant]} ${className}`;

  return (
    <div className={containerClass} role="alert">
      {CustomIcon ? (
        React.isValidElement(CustomIcon) ? (
          React.cloneElement(CustomIcon, { className: styles.icon })
        ) : (
          <CustomIcon className={styles.icon} />
        )
      ) : (
        <DefaultIcon className={styles.icon} />
      )}
      <p className={styles.text}>{children}</p>
    </div>
  );
};
