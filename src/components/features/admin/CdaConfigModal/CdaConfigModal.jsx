import React, { useState } from "react";
import { Modal } from "../../../ui/Modal/Modal";
import { CdaPanel } from "../CdaPanel/CdaPanel";
import { PantallaTabs } from "../PantallaTabs/PantallaTabs";
import { PANTALLAS_CDA } from "../../../../utils/pantallasCda";

export const CdaConfigModal = ({ isOpen, onClose, activeItem, isReadOnly = false }) => {
  const [selectedPantalla, setSelectedPantalla] = useState(PANTALLAS_CDA[0].value);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReadOnly ? "CDAs CONFIGURADOS" : "CONFIGURACIÓN DE CDAs"}
      maxWidth={isReadOnly ? "1000px" : "850px"}
      variant="blue"
    >
      <div style={{ marginBottom: "1rem" }}>
        <PantallaTabs value={selectedPantalla} onChange={setSelectedPantalla} />
      </div>
      <CdaPanel
        activeItem={activeItem}
        pantalla={selectedPantalla}
        onClose={onClose}
        isReadOnly={isReadOnly}
        hideCheckboxes={isReadOnly}
        hideHeader={isReadOnly}
        key={`${activeItem?.cadenavalorid}-${selectedPantalla}`}
      />
    </Modal>
  );
};
