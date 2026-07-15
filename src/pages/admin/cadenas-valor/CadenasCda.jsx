import React, { useState } from "react";
import styles from "./CadenasCda.module.css";
import { CadenaSelectCard } from "../../../components/features/admin/CadenaSelectCard/CadenaSelectCard";
import { CdaPanel } from "../../../components/features/admin/CdaPanel/CdaPanel";
import { PantallaTabs } from "../../../components/features/admin/PantallaTabs/PantallaTabs";
import { PANTALLAS_CDA } from "../../../utils/pantallasCda";
import { useObtenerTodasWebConEstado, useObtenerGrupoCdaConCdas } from "../../../hooks/useCadenaValor";
import { esCdaActivo } from "../../../utils/cdaUtils";

const contarCdasActivos = (data) => {
  const cdas = Array.isArray(data?.cdas) ? data.cdas : data?.cdas?.items || data?.cdas?.data || [];
  return cdas.filter(esCdaActivo).length;
};

export default function CadenasCda() {
  const [selectedCadenaId, setSelectedCadenaId] = useState("");
  const [selectedPantalla, setSelectedPantalla] = useState(PANTALLAS_CDA[0].value);

  const {
    data: activeCadenas,
    isLoading: isLoadingActive,
  } = useObtenerTodasWebConEstado();

  // Solo cadenas activas: acá no tiene sentido dejar elegir una cadena
  // inactiva para configurarle CDAs.
  const activeList = (activeCadenas || []).filter((c) => c.activaOperativa);

  const activeItem = activeList.find((c) => String(c.cadenavalorid) === String(selectedCadenaId));
  const cadenaId = activeItem?.cadenavalorid;

  // Traemos el estado de AMBAS pantallas (no solo la seleccionada) para que
  // el paso a paso muestre de un vistazo cuál de las dos le falta configurar
  // a esta cadena.
  const grupoIngresoCuit = useObtenerGrupoCdaConCdas(cadenaId, PANTALLAS_CDA[0].value);
  const grupoSocios = useObtenerGrupoCdaConCdas(cadenaId, PANTALLAS_CDA[1].value);

  const estadosPantallas = {
    [PANTALLAS_CDA[0].value]: { cantidad: contarCdasActivos(grupoIngresoCuit.data), cargando: grupoIngresoCuit.isLoading },
    [PANTALLAS_CDA[1].value]: { cantidad: contarCdasActivos(grupoSocios.data), cargando: grupoSocios.isLoading },
  };

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
            style={{ height: "58px", width: "100%", maxWidth: "440px", borderRadius: "0.75rem" }}
          ></div>
        ) : (
          <div className={styles.compactSelector}>
            <CadenaSelectCard
              options={activeList}
              value={selectedCadenaId}
              onChange={(val) => setSelectedCadenaId(String(val))}
              placeholder="Elegir cadena de valor..."
            />
          </div>
        )}

        {selectedCadenaId && activeItem && (
          <PantallaTabs value={selectedPantalla} onChange={setSelectedPantalla} estados={estadosPantallas} />
        )}
      </div>

      <div className={styles.cardSection}>
        {selectedCadenaId && activeItem ? (
          <div className={styles.panelWrap}>
            <CdaPanel
              activeItem={activeItem}
              pantalla={selectedPantalla}
              hideHeader={true}
              hideUnchecked={false}
              key={`${activeItem.cadenavalorid}-${selectedPantalla}`}
            />
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
