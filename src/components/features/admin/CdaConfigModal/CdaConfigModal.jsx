import React from "react";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { CdaPanel } from "../CdaPanel/CdaPanel";

export const CdaConfigModal = ({ isOpen, onClose, activeItem, isReadOnly = false }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="CONFIGURACIÓN DE CDAs"
      maxWidth="850px"
      variant="blue"
    >
      <CdaPanel activeItem={activeItem} onClose={onClose} isReadOnly={isReadOnly} />
    </Modal>
  );
};
