import React, { useState } from "react";
import styles from "../../../pages/admin/cadenas-valor/CadenasCda.module.css";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { CadenaSelectCard } from "../../../components/features/admin/CadenaSelectCard/CadenaSelectCard";
import { CdaLineaPanel } from "../../../components/features/admin/CdaLineaPanel/CdaLineaPanel";
import { useTiposProducto } from "../../../hooks/useCatalogos";

// Las Líneas de crédito no tienen "pantallas" como el onboarding de cadenas
// (Paso1Cuit, modales de socios): se evalúan en un único punto, al aprobar/
// usar la línea. Se mantiene igual el concepto de Pantalla porque el backend
// de CDAs lo pide (GrupoCda), pero acá es un literal fijo, no elegible.
const PANTALLA_LINEA = "PANTALLA_LINEA";

export default function LineasCda() {
  const [selectedTipoLimiteId, setSelectedTipoLimiteId] = useState("");

  const { data: tiposLimite, isLoading } = useTiposProducto();

  const listLineas = tiposLimite?.raw || [];
  const mappedLineas = listLineas.map((tl) => ({
    tipolimiteid: tl.tipolimiteid,
    descripcion: tl.descripcion,
    cadenavalorid: String(tl.tipolimiteid),
    denominacion: tl.descripcion,
    referencia: "LÍNEA",
    cuittercero: null,
    logo: null,
    activaOperativa: true,
  }));

  const activeItem = mappedLineas.find((l) => String(l.tipolimiteid) === String(selectedTipoLimiteId));

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>CDAs por Línea</h1>
          <p>
            Configurá qué Criterios de Aceptación (CDAs) se ejecutan para cada Línea de crédito
          </p>
        </div>
      </div>

      <div className={styles.selectorSection}>
        {isLoading ? (
          <Skeleton height="58px" width="100%" radius="0.75rem" style={{ maxWidth: "440px" }} />
        ) : (
          <div className={styles.compactSelector}>
            <CadenaSelectCard
              options={mappedLineas}
              value={selectedTipoLimiteId}
              onChange={(val) => setSelectedTipoLimiteId(String(val))}
              placeholder="Elegir línea de crédito..."
            />
          </div>
        )}
      </div>

      <div className={styles.cardSection}>
        {selectedTipoLimiteId && activeItem ? (
          <div className={styles.panelWrap}>
            <CdaLineaPanel
              activeItem={activeItem}
              pantalla={PANTALLA_LINEA}
              hideHeader={true}
              hideUnchecked={false}
              key={activeItem.tipolimiteid}
            />
          </div>
        ) : selectedTipoLimiteId && !activeItem ? (
          <div className={styles.emptyMsg}>
            Línea de crédito no encontrada.
          </div>
        ) : (
          <div className={styles.emptyMsg}>
            Seleccioná una línea en el buscador para gestionar sus CDAs.
          </div>
        )}
      </div>
    </div>
  );
}
