import React from "react";
import { FiEdit2, FiInbox } from "react-icons/fi";
import { Button, Badge, SinResultados, SkeletonTable } from "../../../ui";
import styles from "./Tabla.module.css";

export const Tabla = ({ socios = [], isLoading, onEditarSocio }) => {
  const getBadgeClass = (estadoId) => {
    return `${styles.badge} ${estadoId === 1 ? styles.badgeActive : styles.badgeInactive}`;
  };

  return (
    <div className={styles.tableContainer}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th className={styles.th}>ID</th>
            <th className={styles.th}>Denominación</th>
            <th className={styles.th}>CUIT</th>
            <th className={styles.th}>Email</th>
            <th className={styles.th}>Estado</th>
            <th className={`${styles.th} ${styles.thRightAlign}`}>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {isLoading ? (
            <SkeletonTable columns={6} rows={5} />
          ) : !socios || socios.length === 0 ? (
            <tr>
              <td
                colSpan="6"
                style={{ padding: "3rem 0", borderBottom: "none" }}
              >
                <SinResultados
                  title="No se encontraron socios"
                  message="Refiná tu búsqueda o agregá un socio nuevo para comenzar."
                  icon={FiInbox}
                />
              </td>
            </tr>
          ) : (
            socios.map((socio) => (
              <tr key={socio.socioid} className={styles.tr}>
                <td className={styles.td}>
                  <span className={styles.tdMuted}>#{socio.socioid}</span>
                </td>
                <td className={`${styles.td} ${styles.tdBold}`}>
                  {socio.denominacion}
                </td>
                <td className={styles.td}>{socio.cuit}</td>
                <td className={`${styles.td} ${styles.tdMuted}`}>
                  {socio.email || "-"}
                </td>
                <td className={styles.td}>
                  <span className={getBadgeClass(socio.socioestadoid)}>
                    {socio.socioestadoid === 1 ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className={`${styles.td} ${styles.tdRightAlign}`}>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => onEditarSocio(socio)}
                    className={styles.actionButton}
                  >
                    <FiEdit2 /> EDITAR
                  </Button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
