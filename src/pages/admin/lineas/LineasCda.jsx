import React, { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { FiArrowRight, FiLayers, FiAlertTriangle, FiPlus } from "react-icons/fi";
import styles from "../../../pages/admin/cadenas-valor/CadenasCda.module.css";
import lineaStyles from "./LineasCda.module.css";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { Button } from "../../../components/ui/Button/Button";
import { CadenaSelectCard } from "../../../components/features/admin/CadenaSelectCard/CadenaSelectCard";
import { CdaPanel } from "../../../components/features/admin/CdaPanel/CdaPanel";
import { CdaWorkbench } from "../../../components/features/admin/CdaWorkbench/CdaWorkbench";
import { PANTALLA_LINEA } from "../../../utils/pantallasCda";
import { resolverGrupoCda } from "../../../utils/grupoCdaUtils";
import { cadenaValorService } from "../../../services/cadenaValorService";
import { useUsuarioWebIdActual } from "../../../hooks/useUsuario";
import { useObtenerTodasWebConEstado, useObtenerCdaIdsPorPantalla } from "../../../hooks/useCadenaValor";
import { useObtenerLimitesCadenaValor } from "../../../hooks/useLinea";
import { useTiposProducto } from "../../../hooks/useCatalogos";

const DESCRIPCION_PANEL =
  "Activá los CDAs que se deben validar al pedir una línea de crédito nueva en esta cadena, y definí cómo se combinan entre sí. La regla y el mensaje de rechazo son los definidos en Criterios de Aceptación: acá solo podés personalizar, para esta cadena, el valor límite de cada uno.";

export default function LineasCda() {
  const queryClient = useQueryClient();
  const usuarioWebId = useUsuarioWebIdActual();
  const [selectedCadenaId, setSelectedCadenaId] = useState("");
  const [creandoCda, setCreandoCda] = useState(false);

  const { data: cadenas, isLoading: isLoadingCadenas } = useObtenerTodasWebConEstado();

  // Solo cadenas activas: no tiene sentido configurar CDAs de alta de línea
  // para una cadena inactiva (mismo criterio que CadenasCda.jsx).
  const listCadenas = (cadenas || []).filter((c) => c.activaOperativa);
  const activeItem = listCadenas.find(
    (c) => String(c.cadenavalorid) === String(selectedCadenaId),
  );

  // El backend no tiene ningún concepto de "CDA por línea" (WSGrupoCda solo
  // admite CadenaValorID) - los CDAs de PANTALLA_LINEA se vinculan a la
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

  // Los CDAs no tienen un campo de "pantalla" propio: un CDA solo "es de
  // líneas" en el sentido de que ya está vinculado a PANTALLA_LINEA en
  // alguna cadena. Por eso el checklist no lista los ~61 CDAs globales
  // (eso quedó para CadenasCda.jsx) sino solo este subconjunto - que arranca
  // vacío hasta que se cree el primero con el botón de arriba.
  const { data: cdaIdsPermitidos, isLoading: isLoadingCdaIds } =
    useObtenerCdaIdsPorPantalla(PANTALLA_LINEA);

  // El CDA en sí ya se guardó (CdaWorkbench lo hizo antes de llamar acá) -
  // acá solo falta vincularlo a PANTALLA_LINEA para la cadena elegida, igual
  // que hace CdasGlobales.jsx con "vincular a cadenas existentes" pero
  // acotado a una sola cadena y sin toggle: siempre se vincula, es lo único
  // que tiene sentido en este flujo.
  const handleGuardarCdaLinea = async (_payloadCda, { cdaId, valorParaLog }) => {
    if (!cdaId || !activeItem) {
      toast.error("No se pudo determinar el CDA recién creado o la cadena elegida.");
      return true;
    }
    try {
      const grupo = await resolverGrupoCda(PANTALLA_LINEA, activeItem.cadenavalorid);
      await cadenaValorService.vincularCdasAGrupo({
        grupocdaid: grupo.grupocdaid,
        listacda: [{ cdaid: cdaId, valorcomparacion: valorParaLog, usuariowebid: usuarioWebId }],
      });
      await queryClient.invalidateQueries({ queryKey: ["cda"] });
      await queryClient.invalidateQueries({
        queryKey: ["cadenaValor", "grupoCdaConCdas", PANTALLA_LINEA, activeItem.cadenavalorid],
      });
      toast.success(`Criterio creado y vinculado a ${activeItem.denominacion}.`);
      return true;
    } catch (err) {
      console.error("[LineasCda] Error al vincular el CDA nuevo a la cadena:", err);
      toast.error(
        "El CDA se guardó, pero no se pudo vincular automáticamente a esta cadena. Podés reintentarlo desde el checklist.",
      );
      return true;
    }
  };

  if (creandoCda) {
    return (
      <CdaWorkbench
        titulo={`Nuevo CDA para Alta de Línea${activeItem ? ` — ${activeItem.denominacion}` : ""}`}
        subtitulo="Se crea como un Criterio de Aceptación global (va a aparecer también en Criterios de Aceptación Globales) y se vincula automáticamente a esta cadena, en la pantalla de Alta de Línea."
        onCancel={() => setCreandoCda(false)}
        onGuardar={handleGuardarCdaLinea}
        submitLabel="Crear y vincular a esta cadena"
        mostrarCdaPorDefectoToggle={false}
      />
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>CDAs de Alta de Línea</h1>
          <p>
            Configurá qué Criterios de Aceptación se validan al pedir una línea de crédito nueva. Se aplican a todas las líneas activas de la cadena elegida.
          </p>
        </div>
        <Button
          type="button"
          variant="blue"
          size="md"
          onClick={() => setCreandoCda(true)}
          disabled={!activeItem}
          title={!activeItem ? "Elegí una cadena primero" : undefined}
        >
          <FiPlus /> Crear CDA para esta cadena
        </Button>
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
        ) : isLoadingCdaIds ? (
          <div className={styles.emptyMsg}>
            Cargando configuración de esta pantalla...
          </div>
        ) : (
          <div className={styles.panelWrap}>
            <CdaPanel
              activeItem={activeItem}
              pantalla={PANTALLA_LINEA}
              hideHeader={true}
              hideUnchecked={false}
              description={DESCRIPCION_PANEL}
              cdaIdsPermitidos={cdaIdsPermitidos || []}
              key={activeItem.cadenavalorid}
            />
          </div>
        )}
      </div>
    </div>
  );
}
