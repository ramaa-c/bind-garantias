import React, { useState } from "react";
import { FiArrowRight, FiLayers, FiAlertTriangle } from "react-icons/fi";
import styles from "../../../pages/admin/cadenas-valor/CadenasCda.module.css";
import lineaStyles from "./LineasCda.module.css";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { CadenaSelectCard } from "../../../components/features/admin/CadenaSelectCard/CadenaSelectCard";
import { CdaPanel } from "../../../components/features/admin/CdaPanel/CdaPanel";
import { PANTALLA_LINEAS } from "../../../utils/pantallasCda";
import { useObtenerTodasWebConEstado } from "../../../hooks/useCadenaValor";
import { useObtenerLimitesCadenaValor } from "../../../hooks/useLinea";
import { useTiposProducto } from "../../../hooks/useCatalogos";

const DESCRIPCION_PANEL =
  "Activá los CDAs a validar y cómo se combinan. La regla se define en Criterios de Aceptación Globales; acá solo el valor por cadena.";

export default function LineasCda() {
  const [selectedCadenaId, setSelectedCadenaId] = useState("");

  const { data: cadenas, isLoading: isLoadingCadenas } = useObtenerTodasWebConEstado();

  // Solo cadenas activas: no tiene sentido configurar CDAs de alta de línea
  // para una cadena inactiva (mismo criterio que CadenasCda.jsx).
  const listCadenas = (cadenas || []).filter((c) => c.activaOperativa);
  const activeItem = listCadenas.find(
    (c) => String(c.cadenavalorid) === String(selectedCadenaId),
  );

  // El backend no tiene ningún concepto de "CDA por línea" (WSGrupoCda solo
  // admite CadenaValorID) - los CDAs de PANTALLA_LINEAS se vinculan a la
  // cadena entera y aplican por igual a todas sus líneas activas. La caja de
  // "alcance" de abajo es solo para mostrar ese alcance real, no para elegir
  // nada - por eso queda siempre visible (con su propio estado vacío) en vez
  // de aparecer recién después de elegir cadena.
  const { data: lineasCadena, isLoading: isLoadingLineas } =
    useObtenerLimitesCadenaValor(selectedCadenaId || undefined);
  const { data: tiposLimite } = useTiposProducto();
  const nombresLineasActivas = (lineasCadena || [])
    .filter((l) => String(l.activa) === "1")
    .map((l) => {
      const tipo = tiposLimite?.raw?.find(
        (t) => String(t.tipolimiteid) === String(l.tipolimiteid),
      );
      return l.descripcion || tipo?.descripcion || `Línea #${l.tipolimiteid}`;
    });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>CDAs de Alta de Línea</h1>
          <p>
            Configurá qué CDAs se validan al pedir una línea de crédito, por cadena.
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
              onChange={(val) => setSelectedCadenaId(String(val))}
              placeholder="Elegir cadena de valor..."
            />
          </div>
        )}

        <div className={lineaStyles.selectorConnector} aria-hidden="true">
          <FiArrowRight />
        </div>

        <div
          className={`${lineaStyles.alcanceBox} ${!selectedCadenaId ? lineaStyles.alcanceBoxEmpty : ""}`}
        >
          <div className={lineaStyles.alcanceHeader}>
            <FiLayers className={lineaStyles.alcanceIcon} size={13} />
            <span className={lineaStyles.alcanceLabel}>Alcance de esta configuración</span>
          </div>

          {!selectedCadenaId ? (
            <p className={lineaStyles.alcancePlaceholder}>
              Elegí una cadena para ver a qué líneas de crédito les va a aplicar esta configuración.
            </p>
          ) : isLoadingLineas ? (
            <Skeleton height="1.35rem" width="70%" radius="1rem" />
          ) : nombresLineasActivas.length === 0 ? (
            <div className={lineaStyles.alcanceVacio}>
              <FiAlertTriangle size={13} className={lineaStyles.alcanceVacioIcon} />
              <span>
                Esta cadena todavía no tiene líneas de crédito activas: esta configuración no va a tener efecto hasta que tenga alguna.
              </span>
            </div>
          ) : (
            <>
              <span className={lineaStyles.alcanceCount}>
                {nombresLineasActivas.length} línea{nombresLineasActivas.length !== 1 ? "s" : ""} activa
                {nombresLineasActivas.length !== 1 ? "s" : ""}
              </span>
              <div className={lineaStyles.alcanceChips}>
                {nombresLineasActivas.map((nombre, i) => (
                  <span key={i} className={lineaStyles.alcanceChip}>
                    <span className={lineaStyles.alcanceChipDot} />
                    {nombre}
                  </span>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.cardSection}>
        {!selectedCadenaId ? (
          <div className={styles.emptyMsg}>
            Seleccioná una cadena de valor para configurar sus CDAs de alta de línea.
          </div>
        ) : !activeItem ? (
          <div className={styles.emptyMsg}>
            Cadena de valor no encontrada.
          </div>
        ) : (
          <div className={styles.panelWrap}>
            <CdaPanel
              activeItem={activeItem}
              pantalla={PANTALLA_LINEAS}
              hideHeader={true}
              hideUnchecked={false}
              description={DESCRIPCION_PANEL}
              key={activeItem.cadenavalorid}
            />
          </div>
        )}
      </div>
    </div>
  );
}
