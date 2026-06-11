import React from "react";
import { toast } from "sonner";
import { Modal, Button } from "../../../ui";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import styles from "./UsuariosRelacionadosModal.module.css";

export const UsuariosRelacionadosModal = ({ isOpen, onClose, activeItem }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="USUARIOS AUTORIZADOS"
      maxWidth="600px"
      variant="blue"
    >
      <div>
        <CadenaHeaderCard
          denominacion={activeItem?.denominacion}
          logo={activeItem?.logo}
          referencia={activeItem?.referencia}
          cadenavalorid={activeItem?.cadenavalorid}
          cuittercero={activeItem?.cuittercero}
        />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", gap: "1rem" }}>
          <p style={{ fontSize: "0.8125rem", color: "#8b949e", margin: 0, lineHeight: "1.4" }}>
            Usuarios autorizados a interactuar con esta cadena de valor en la plataforma web.
          </p>
          <button
            className={styles.btnNuevoBlue}
            style={{ marginBottom: 0, flexShrink: 0 }}
            onClick={() => toast.info("Funcionalidad próximamente disponible")}
          >
            NUEVO
          </button>
        </div>
        <table className={styles.usersTable}>
          <thead>
            <tr>
              <th>Nombre de usuario / Email</th>
              <th>Habilitado</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>consultante_{activeItem?.referencia || "cadenadevalor"}@mailinator.com</td>
              <td>
                <span className={styles.cdaStatusBadge}>Si</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div
        style={{
          margin: "1.5rem -1.5rem -1.5rem -1.5rem",
          padding: "1.25rem 1.5rem",
          borderTop: "1px solid rgba(43, 113, 200, 0.12)",
          display: "flex",
          justifyContent: "flex-end",
          background: "rgba(0, 0, 0, 0.2)",
        }}
      >
        <Button variant="outlineBlue" onClick={onClose}>
          CERRAR
        </Button>
      </div>
    </Modal>
  );
};
