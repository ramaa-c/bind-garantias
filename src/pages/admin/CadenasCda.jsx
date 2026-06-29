import React, { useState } from "react";
import styles from "./CadenasCda.module.css";
import { CadenaSelectCard } from "../../components/features/admin/CadenaSelectCard/CadenaSelectCard";
import { CdaPanel } from "../../components/features/admin/CdaPanel/CdaPanel";
import { useObtenerTodasWeb } from "../../hooks/useCadenaValor";

export default function CadenasCda() {
  const [selectedCadenaId, setSelectedCadenaId] = useState("");

  const {
    data: activeCadenas,
    isLoading: isLoadingActive,
  } = useObtenerTodasWeb();

  const activeList = activeCadenas || [];
  
  const activeItem = activeList.find((c) => String(c.cadenavalorid) === String(selectedCadenaId));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>CDAs por Cadena</h1>
          <p>
            Configurá qué Criterios de Aceptación (CDAs) se ejecutan para cada Cadena de Valor
          </p>
        </div>
      </div>

      <div className={styles.selectorSection}>
        {isLoadingActive ? (
          <div
            className={styles.skeletonBlock}
            style={{ height: "82px", width: "100%", borderRadius: "0.75rem" }}
          ></div>
        ) : (
          <CadenaSelectCard
            options={activeList}
            value={selectedCadenaId}
            onChange={(val) => setSelectedCadenaId(String(val))}
            placeholder="Seleccionar Cadena de Valor..."
          />
        )}
      </div>

      <div className={styles.cardSection}>
        {selectedCadenaId && activeItem ? (
          <div style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.06)",
            borderRadius: "0.75rem",
            padding: "1.25rem",
            backdropFilter: "blur(8px)"
          }}>
            <CdaPanel activeItem={activeItem} hideHeader={true} isReadOnly={false} />
          </div>
        ) : selectedCadenaId && !activeItem ? (
          <div className={styles.emptyMsg}>
            Cadena de valor no encontrada.
          </div>
        ) : (
          <div className={styles.emptyMsg}>
            Seleccioná una cadena en el buscador para gestionar sus CDAs.
          </div>
        )}
      </div>
    </div>
  );
}
