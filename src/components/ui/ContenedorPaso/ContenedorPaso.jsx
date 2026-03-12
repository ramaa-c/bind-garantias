import React from "react";
import styles from "./ContenedorPaso.module.css";

export const ContenedorPaso = ({
  title,
  subtitle,
  titleVariant = "default",
  centered = false,
  children,
  className = "",
}) => {
  
  const headerClass = `
    ${styles.header} 
    ${centered ? styles.centered : ""}
  `.trim();

  const titleClass = `
    ${styles.title} 
    ${titleVariant === "light" ? styles.titleLight : ""}
  `.trim();

  return (
    <section className={`${styles.container} ${className}`}>
      {(title || subtitle) && (
        <div className={headerClass}>
          {title && <h1 className={titleClass}>{title}</h1>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </section>
  );
};