import React from "react";
import { FiTag } from "react-icons/fi";
import styles from "./CadenaHeaderCard.module.css";

export const CadenaHeaderCard = ({
  denominacion,
  logo,
  referencia,
  cadenavalorid,
  cuittercero,
  avatarColor,
}) => {
  const getLogoSrc = (logoData) => {
    if (!logoData) return "";
    if (logoData.startsWith("data:") || logoData.startsWith("http"))
      return logoData;
    return `data:image/png;base64,${logoData}`;
  };

  const logoSrc = getLogoSrc(logo);

  const getInitials = (name) => {
    if (!name) return "CV";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join("");
  };

  const getAvatarColor = (name) => {
    if (!name) return "var(--color-azul-bind, #4c65e6)";
    const colors = [
      "#4c65e6",
      "#e64c65",
      "#10b981",
      "#f59e0b",
      "#8b5cf6",
      "#ec4899",
      "#06b6d4",
      "#84cc16",
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className={styles.headerCard}>
      <div className={styles.logoContainer}>
        {logoSrc ? (
          <img
            src={logoSrc}
            alt={`${denominacion} Logo`}
            className={styles.logoImage}
          />
        ) : (
          <div
            className={styles.avatarPlaceholder}
            style={{
              backgroundColor: avatarColor || getAvatarColor(denominacion),
            }}
          >
            {getInitials(denominacion)}
          </div>
        )}
      </div>
      <div className={styles.infoContainer}>
        <div className={styles.metaRow}>
          <span className={styles.idBadge}>ID: #{cadenavalorid}</span>
          {referencia && (
            <span className={styles.refBadge}>
              <FiTag className={styles.badgeIcon} /> {referencia}
            </span>
          )}
        </div>
        <h3 className={styles.title}>{denominacion || "Cadena de Valor"}</h3>
        {cuittercero && <p className={styles.cuitText}>CUIT: {cuittercero}</p>}
      </div>
    </div>
  );
};
