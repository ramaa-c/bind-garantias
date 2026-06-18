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
      maxWidth="650px"
      variant="blue"
    >
      <CdaPanel activeItem={activeItem} onClose={onClose} />
    </Modal>
  );
};
