import React, { useState } from "react";
import styles from "../../../pages/admin/cadenas-valor/CadenasCda.module.css";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { CadenaSelectCard } from "../../../components/features/admin/CadenaSelectCard/CadenaSelectCard";
import { CdaLineaPanel } from "../../../components/features/admin/CdaLineaPanel/CdaLineaPanel";
import { useTiposProducto } from "../../../hooks/useCatalogos";
import { useObtenerTodasWebConEstado } from "../../../hooks/useCadenaValor";
import { useObtenerLimitesCadenaValor } from "../../../hooks/useLinea";

// Las Líneas de crédito no tienen "pantallas" como el onboarding de cadenas
// (Paso1Cuit, modales de socios): se evalúan en un único punto, al aprobar/
// usar la línea. Se mantiene igual el concepto de Pantalla porque el backend
// de CDAs lo pide (GrupoCda), pero acá es un literal fijo, no elegible.
const PANTALLA_LINEA = "PANTALLA_LINEA";

export default function LineasCda() {
  const [selectedCadenaId, setSelectedCadenaId] = useState("");
  const [selectedTipoLimiteCadenaId, setSelectedTipoLimiteCadenaId] = useState("");

  const { data: cadenas, isLoading: isLoadingCadenas } = useObtenerTodasWebConEstado();
  const { data: tiposLimite } = useTiposProducto();
  const { data: lineasCadena, isLoading: isLoadingLineas } =
    useObtenerLimitesCadenaValor(selectedCadenaId);

  // Solo cadenas activas: no tiene sentido configurar CDAs de línea para
  // una cadena inactiva (mismo criterio que CadenasCda.jsx).
  const listCadenas = (cadenas || []).filter((c) => c.activaOperativa);

  // Las líneas mostradas son las que ya están vinculadas a la cadena
  // elegida (TipoLimiteCadenaValor), no todo el catálogo global de tipos:
  // sin la cadena como filtro, se podían elegir líneas que esa cadena ni
  // siquiera tiene habilitadas.
  const listLineas = lineasCadena || [];
  const mappedLineas = listLineas.map((l) => {
    const tipo = tiposLimite?.raw?.find(
      (t) => String(t.tipolimiteid) === String(l.tipolimiteid),
    );
    const tipoDesc = tipo?.descripcion || `Línea #${l.tipolimiteid}`;
    return {
      tipolimiteid: l.tipolimiteid,
      cadenavalorid: String(l.tipolimitecadenavalorid),
      denominacion: l.descripcion || tipoDesc,
      referencia: tipoDesc,
      cuittercero: null,
      logo: null,
      activaOperativa: String(l.activa) === "1",
    };
  });

  const activeItem = mappedLineas.find(
    (l) => String(l.cadenavalorid) === String(selectedTipoLimiteCadenaId),
  );

  const handleChangeCadena = (val) => {
    setSelectedCadenaId(String(val));
    setSelectedTipoLimiteCadenaId("");
  };

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
        {isLoadingCadenas ? (
          <Skeleton height="58px" width="100%" radius="0.75rem" style={{ maxWidth: "440px" }} />
        ) : (
          <div className={styles.compactSelector}>
            <CadenaSelectCard
              options={listCadenas}
              value={selectedCadenaId}
              onChange={handleChangeCadena}
              placeholder="Elegir cadena de valor..."
            />
          </div>
        )}

        {selectedCadenaId && (
          isLoadingLineas ? (
            <Skeleton height="58px" width="100%" radius="0.75rem" style={{ maxWidth: "440px" }} />
          ) : (
            <div className={styles.compactSelector}>
              <CadenaSelectCard
                options={mappedLineas}
                value={selectedTipoLimiteCadenaId}
                onChange={(val) => setSelectedTipoLimiteCadenaId(String(val))}
                placeholder="Elegir línea de crédito..."
              />
            </div>
          )
        )}
      </div>

      <div className={styles.cardSection}>
        {!selectedCadenaId ? (
          <div className={styles.emptyMsg}>
            Seleccioná una cadena de valor para ver sus líneas.
          </div>
        ) : isLoadingLineas ? (
          <div className={styles.emptyMsg}>
            Cargando líneas de la cadena...
          </div>
        ) : mappedLineas.length === 0 ? (
          <div className={styles.emptyMsg}>
            Esta cadena de valor no tiene líneas de crédito configuradas.
          </div>
        ) : selectedTipoLimiteCadenaId && activeItem ? (
          <div className={styles.panelWrap}>
            <CdaLineaPanel
              activeItem={activeItem}
              pantalla={PANTALLA_LINEA}
              hideHeader={true}
              hideUnchecked={false}
              key={activeItem.tipolimiteid}
            />
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
