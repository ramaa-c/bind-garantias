import React, { useState } from "react";
import { FiShield } from "react-icons/fi";
import { Modal } from "../../../ui/Modal/Modal";
import { CdaPanel } from "../CdaPanel/CdaPanel";
import { PantallaTabs } from "../PantallaTabs/PantallaTabs";
import { PANTALLAS_CDA } from "../../../../utils/pantallasCda";
import styles from "./CdaConfigModal.module.css";

export const CdaConfigModal = ({ isOpen, onClose, activeItem, isReadOnly = false }) => {
  const [selectedPantalla, setSelectedPantalla] = useState(PANTALLAS_CDA[0].value);
  const [contenedorPie, setContenedorPie] = useState(null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isReadOnly ? "CDAs configurados" : "Criterios de aceptación de la cadena"}
      subtitle={[activeItem?.denominacion, activeItem?.cadenavalorid && `ID ${activeItem.cadenavalorid}`]
        .filter(Boolean)
        .join(" · ")}
      icono={<FiShield />}
      maxWidth={isReadOnly ? "1000px" : "1080px"}
      variant="blue"
      footer={isReadOnly ? undefined : <div ref={setContenedorPie} className={styles.pie} />}
    >
      <div className={styles.pantallas}>
        <PantallaTabs value={selectedPantalla} onChange={setSelectedPantalla} />
      </div>
      <CdaPanel
        activeItem={activeItem}
        pantalla={selectedPantalla}
        onClose={onClose}
        isReadOnly={isReadOnly}
        hideCheckboxes={isReadOnly}
        hideHeader
        enModal
        contenedorPie={contenedorPie}
        key={`${activeItem?.cadenavalorid}-${selectedPantalla}`}
      />
    </Modal>
  );
};
