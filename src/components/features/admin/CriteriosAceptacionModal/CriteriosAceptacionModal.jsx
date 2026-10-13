import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCheck, FiX, FiChevronDown, FiRotateCw, FiHelpCircle, FiBriefcase, FiUser, FiMinus } from "react-icons/fi";
import { toast } from "sonner";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { Skeleton } from "../../../ui/Skeleton/Skeleton";
import { sociosService } from "../../../../services/sociosService";
import { tercerosService } from "../../../../services/tercerosService";
import { cdaService } from "../../../../services/cdaService";
import { useObtenerGrupoCdaConCdas } from "../../../../hooks/useCadenaValor";
import { useAdminRestrictions } from "../../../../hooks/useAdminRestrictions";
import { RELACION_ACCIONISTA_ID } from "../../../../constants/tiposRelacionSocio";
import { armarEstadoPorCda, formatearMomentoControl, ordenarEjecucionesCda } from "../../../../utils/executeCda";
import styles from "./CriteriosAceptacionModal.module.css";

const PANTALLA_EMPRESA = "PANTALLA_INGRESO_CUIT";
const PANTALLA_ACCIONISTAS = "PANTALLA_SOCIOS";

// La API devuelve una fila por cada vez que se vinculó el CDA al grupo (el historial incluye repetidas):
// se muestra un solo criterio por CdaID, el de la vinculación más reciente.
const unicosPorCda = (lista) => {
  const masReciente = new Map();
  lista.forEach((c, i) => {
    const cdaid = Number(c.cdaid ?? c.CdaID);
    if (!cdaid) return;
    const momento = new Date(c.momento ?? c.Momento ?? 0).getTime() || 0;
    const previo = masReciente.get(cdaid);
    if (!previo || momento > previo.momento || (momento === previo.momento && i > previo.i)) {
      masReciente.set(cdaid, { c, momento, i });
    }
  });
  return Array.from(masReciente.values())
    .sort((a, b) => Number(a.c.cdaid ?? a.c.CdaID) - Number(b.c.cdaid ?? b.c.CdaID))
    .map(({ c }) => ({
      cdaid: Number(c.cdaid ?? c.CdaID),
      descripcion: c.descripcion || c.Descripcion || `Criterio ${c.cdaid ?? c.CdaID}`,
      expresion: c.expresion || c.Expresion || "",
      simbolocomparacion: c.simbolocomparacion || c.SimboloComparacion || "",
      valorcomparacion: c.valorcomparacion || c.ValorComparacion || "",
    }));
};

const listaDe = (data) => (Array.isArray(data) ? data : data?.items || data?.data || []);

// Estado real de un criterio a partir del historial de ejecuciones (true = superado, false = no superado,
// null = todavia no se evaluo o quedo pendiente).
const estadoDe = (mapa, cdaid) => (mapa.has(cdaid) ? mapa.get(cdaid) : null);

const ultimaEjecucion = (historial, cdaid) =>
  ordenarEjecucionesCda(historial).find((f) => Number(f.cdaid ?? f.CdaID) === cdaid);

const IconoEstado = ({ estado }) =>
  estado === true ? (
    <span className={styles.iconSuccess}><FiCheck /></span>
  ) : estado === false ? (
    <span className={styles.iconDanger}><FiX /></span>
  ) : (
    <span className={styles.iconPending}><FiMinus /></span>
  );

const TextoEstado = ({ estado }) =>
  estado === true ? (
    <span className={styles.statusSuperada}>Superada</span>
  ) : estado === false ? (
    <span className={styles.statusNoSuperada}>No Superada</span>
  ) : (
    <span className={styles.statusPendiente}>Sin evaluar</span>
  );

export const CriteriosAceptacionModal = ({ isOpen, onClose, solicitud }) => {
  const queryClient = useQueryClient();
  const cuit = solicitud?.cuit || "";
  const socioIdTarget = solicitud?.socioid || null;
  const cadenaId = Number(solicitud?.cadenavalorid) || null;
  // El admin de cadena es de solo lectura: no puede volver a evaluar un criterio
  const { isRestricted, isPending: cargandoRol } = useAdminRestrictions();
  const puedeReevaluar = !cargandoRol && !isRestricted;

  const [expandedRows, setExpandedRows] = useState({});
  const [reloadingRows, setReloadingRows] = useState({});

  // 1. Criterios de la cadena para la empresa y para sus accionistas
  const { data: grupoEmpresa, isLoading: cargandoEmpresa } = useObtenerGrupoCdaConCdas(cadenaId, PANTALLA_EMPRESA);
  const { data: grupoAccionistas, isLoading: cargandoGrupoAcc } = useObtenerGrupoCdaConCdas(cadenaId, PANTALLA_ACCIONISTAS);
  const cdasEmpresa = unicosPorCda(listaDe(grupoEmpresa?.cdas));
  const cdasAccionistas = unicosPorCda(listaDe(grupoAccionistas?.cdas));

  // 2. Resultado real de la empresa (historial de ejecuciones del socio)
  const { data: historialEmpresa = [], isLoading: cargandoHistorial } = useQuery({
    queryKey: ["criterios", "historial-socio", socioIdTarget],
    queryFn: () => sociosService.obtenerExecuteCda(socioIdTarget),
    enabled: !!socioIdTarget && isOpen,
  });
  const estadoEmpresa = armarEstadoPorCda(historialEmpresa, { cadenaValorId: cadenaId });

  // 3. Accionistas reales del socio con el resultado de cada criterio
  const { data: accionistas = [], isLoading: cargandoAccionistas } = useQuery({
    queryKey: ["criterios", "accionistas", socioIdTarget, cadenaId],
    queryFn: async () => {
      let relaciones = [];
      try {
        // Solo la relacion del socio en el esquema web: pedir la de SGR+ con el ID web podia traer otro socio
        relaciones = (await tercerosService.obtenerRelacionesDeSocio(socioIdTarget)) || [];
      } catch (e) {
        console.warn("No se pudieron obtener las relaciones del socio", e);
      }
      const ahora = new Date();
      const vigentes = (Array.isArray(relaciones) ? relaciones : []).filter((rel) => {
        const tipo = rel.tiporelacionsocioid || rel.TipoRelacionSocioID;
        if (Number(tipo) !== RELACION_ACCIONISTA_ID) return false;
        const hasta = rel.fechahasta || rel.FechaHasta;
        return !hasta || new Date(hasta) >= ahora;
      });
      const vistos = new Set();
      const resultado = [];
      for (const rel of vigentes) {
        const terceroId = rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID || rel.TerceroId;
        if (!terceroId || vistos.has(String(terceroId))) continue;
        vistos.add(String(terceroId));
        let tercero = null;
        let historial = [];
        try {
          tercero = await tercerosService.obtenerTerceroPorId(terceroId);
        } catch (e) {
          console.warn("No se pudo obtener el tercero", e);
        }
        try {
          historial = (await tercerosService.obtenerExecuteCda(terceroId)) || [];
        } catch (e) {
          console.warn("No se pudo obtener el historial de criterios del tercero", e);
        }
        if (tercero) resultado.push({ ...tercero, terceroId, historial });
      }
      return resultado;
    },
    enabled: !!socioIdTarget && isOpen,
  });

  const handleToggleRow = (rowKey) => setExpandedRows((prev) => ({ ...prev, [rowKey]: !prev[rowKey] }));

  const handleReevaluar = async (e, rowKey, cda, { terceroId, pantalla }) => {
    e.stopPropagation();
    setReloadingRows((prev) => ({ ...prev, [rowKey]: true }));
    try {
      const { status } = await cdaService.reejecutarCda({
        cdaId: cda.cdaid,
        socioId: terceroId ? undefined : socioIdTarget,
        terceroId,
        pantalla,
        cadenaValorId: cadenaId,
      });
      if (status === 202) toast.success(`Criterio "${cda.descripcion}" superado.`);
      else if (status === 406) toast.error(`Criterio "${cda.descripcion}" no superado.`);
      else toast.info(`Criterio "${cda.descripcion}" quedó pendiente de evaluación.`);
      await queryClient.invalidateQueries({ queryKey: ["criterios"] });
    } catch (err) {
      toast.error(`No se pudo evaluar el criterio: ${err.message}`);
    } finally {
      setReloadingRows((prev) => ({ ...prev, [rowKey]: false }));
    }
  };

  const isLoading = cargandoEmpresa || cargandoGrupoAcc || cargandoHistorial || (!!socioIdTarget && cargandoAccionistas);
  const getCleanCuit = (c) => String(c || "").replace(/\D/g, "");

  const FilaCriterio = ({ rowKey, cda, estado, ejecucion, terceroId, pantalla }) => {
    const isExpanded = !!expandedRows[rowKey];
    const isReloading = !!reloadingRows[rowKey];
    return (
      <div className={styles.cdaCard}>
        <div className={styles.cdaHeader} onClick={() => handleToggleRow(rowKey)}>
          <div className={styles.cdaHeaderLeft}>
            <IconoEstado estado={estado} />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <span className={styles.cdaTitleText}>{cda.descripcion}</span>
              {cda.valorcomparacion && (
                <span className={styles.ruleBadge}>
                  {[cda.expresion, cda.simbolocomparacion, cda.valorcomparacion].filter(Boolean).join(" ")}
                </span>
              )}
            </div>
          </div>
          <FiChevronDown className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`} />
        </div>

        {isExpanded && (
          <div className={styles.cdaDetails}>
            <div className={styles.detailsLeft}>
              <div className={styles.detailRow}>
                <span className={styles.detailBold}>Estado: </span>
                <TextoEstado estado={estado} />
              </div>
              {ejecucion?.valorresultado || ejecucion?.ValorResultado ? (
                <div className={styles.detailRow}>
                  <span className={styles.detailBold}>Valor evaluado: </span>
                  <span>{ejecucion.valorresultado ?? ejecucion.ValorResultado}</span>
                </div>
              ) : null}
              <div className={styles.detailRow}>
                <span className={styles.detailBold}>Última evaluación: </span>
                <span>{ejecucion ? formatearMomentoControl(ejecucion.momentocontrol ?? ejecucion.MomentoControl) : "Sin evaluar"}</span>
              </div>
            </div>
            {puedeReevaluar && (
              <button
                type="button"
                className={styles.btnHistory}
                onClick={(e) => handleReevaluar(e, rowKey, cda, { terceroId, pantalla })}
                title="Volver a evaluar el criterio"
                disabled={isReloading}
              >
                <FiRotateCw className={isReloading ? styles.btnHistoryActive : ""} />
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criterios De Aceptación"
      maxWidth="650px"
      variant="blue"
      headerActions={
        <button
          type="button"
          className={styles.helpButton}
          onClick={() => toast.info("Los criterios de aceptación definen las reglas de negocio y riesgo evaluadas para esta operación.")}
          title="Ayuda"
        >
          <FiHelpCircle size={20} />
        </button>
      }
    >
      <div className={styles.modalBody}>
        {isLoading ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "0.75rem" }}>
              <Skeleton width="2.2rem" height="2.2rem" radius="0.5rem" />
              <div style={{ flex: 1 }}>
                <Skeleton width="30%" height="0.7rem" />
                <Skeleton width="50%" height="0.95rem" style={{ marginTop: "0.4rem" }} />
              </div>
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.85rem 1rem", border: "1px solid rgba(255, 255, 255, 0.06)", borderRadius: "0.65rem" }}>
                <Skeleton width="1.4rem" height="1.4rem" radius="50%" />
                <Skeleton width="45%" height="0.85rem" />
                <Skeleton width="9rem" height="1.2rem" radius="pill" style={{ marginLeft: "auto" }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* 1. EMPRESA SOLICITANTE */}
            <div className={styles.cuitGroup}>
              <div className={styles.cuitCardHeader}>
                <div className={styles.cuitCardIcon}>
                  <FiBriefcase size={14} />
                </div>
                <div className={styles.cuitCardInfo}>
                  <span className={styles.cuitCardLabel}>Empresa Solicitante</span>
                  <div className={styles.cuitCardMain}>
                    <strong className={styles.cuitCardName}>{solicitud?.cliente || "Cliente Principal"}</strong>
                    <span className={styles.cuitCardNumber}>CUIT: {cuit || "No disponible"}</span>
                  </div>
                </div>
              </div>
              {cdasEmpresa.length === 0 && (
                <div className={styles.cdaCard}>
                  <div className={styles.cdaHeader}>
                    <span className={styles.cdaTitleText}>La cadena no tiene criterios configurados para la empresa.</span>
                  </div>
                </div>
              )}
              {cdasEmpresa.map((cda) => (
                <FilaCriterio
                  key={`empresa-${cda.cdaid}`}
                  rowKey={`empresa-${cda.cdaid}`}
                  cda={cda}
                  estado={estadoDe(estadoEmpresa, cda.cdaid)}
                  ejecucion={ultimaEjecucion(historialEmpresa, cda.cdaid)}
                  pantalla={PANTALLA_EMPRESA}
                />
              ))}
            </div>

            {/* 2. ACCIONISTAS (solo los reales) */}
            {cdasAccionistas.length > 0 &&
              accionistas.map((acc, accIdx) => {
                const accCuit = getCleanCuit(acc.cuit || acc.Cuit);
                const accName = acc.denominacion || acc.Denominacion || acc.nombre || `Accionista ${accIdx + 1}`;
                const estadoAcc = armarEstadoPorCda(acc.historial, { cadenaValorId: cadenaId });
                return (
                  <div key={acc.terceroId} className={styles.cuitGroup}>
                    <div className={styles.cuitCardHeader}>
                      <div className={styles.cuitCardIcon}>
                        <FiUser size={14} />
                      </div>
                      <div className={styles.cuitCardInfo}>
                        <span className={styles.cuitCardLabel}>Accionista</span>
                        <div className={styles.cuitCardMain}>
                          <strong className={styles.cuitCardName}>{accName}</strong>
                          <span className={styles.cuitCardNumber}>CUIT: {accCuit}</span>
                        </div>
                      </div>
                    </div>
                    {cdasAccionistas.map((cda) => (
                      <FilaCriterio
                        key={`acc-${acc.terceroId}-${cda.cdaid}`}
                        rowKey={`acc-${acc.terceroId}-${cda.cdaid}`}
                        cda={cda}
                        estado={estadoDe(estadoAcc, cda.cdaid)}
                        ejecucion={ultimaEjecucion(acc.historial, cda.cdaid)}
                        terceroId={acc.terceroId}
                        pantalla={PANTALLA_ACCIONISTAS}
                      />
                    ))}
                  </div>
                );
              })}
          </>
        )}
      </div>

      <div className={styles.modalFooter}>
        <Button variant="outlineBlue" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </Modal>
  );
};
