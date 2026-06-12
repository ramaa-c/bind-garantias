import React from "react";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { CdaPanel } from "../CdaPanel/CdaPanel";

export const CdaConfigModal = ({ isOpen, onClose, activeItem }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="CONFIGURACIÓN DE CDAs"
      maxWidth="600px"
      variant="blue"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <CdaPanel activeItem={activeItem} />
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
