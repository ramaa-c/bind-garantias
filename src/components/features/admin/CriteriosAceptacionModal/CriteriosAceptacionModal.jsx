import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { FiCheck, FiX, FiChevronDown, FiRotateCw, FiHelpCircle, FiBriefcase, FiUser, FiMinus, FiShield } from "react-icons/fi";
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

// La API devuelve una fila por cada vez que se vinculó el CDA al grupo (el historial incluye repetidas y las dadas
// de baja, Activo = "0"): se muestra un solo criterio por CdaID, el de la vinculación activa más reciente.
const unicosPorCda = (lista) => {
  const masReciente = new Map();
  lista.forEach((c, i) => {
    const cdaid = Number(c.cdaid ?? c.CdaID);
    if (!cdaid) return;
    if (String(c.activo ?? c.Activo ?? "") === "0") return;
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

const TextoEstado = ({ estado }) =>
  estado === true ? (
    <span className={`${styles.estado} ${styles.statusSuperada}`}><FiCheck aria-hidden="true" />Superada</span>
  ) : estado === false ? (
    <span className={`${styles.estado} ${styles.statusNoSuperada}`}><FiX aria-hidden="true" />No superada</span>
  ) : (
    <span className={`${styles.estado} ${styles.statusPendiente}`}><FiMinus aria-hidden="true" />Sin evaluar</span>
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
  const [grupoMovil, setGrupoMovil] = useState("empresa");
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

  const handleReevaluar = async (rowKey, cda, { terceroId, pantalla }) => {
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

  const grupos = [
    {
      clave: "empresa",
      etiqueta: "Empresa solicitante",
      nombre: solicitud?.cliente || "Cliente Principal",
      cuit: cuit || "No disponible",
      icono: <FiBriefcase />,
      items: cdasEmpresa.map((cda) => ({
        rowKey: `empresa-${cda.cdaid}`,
        cda,
        estado: estadoDe(estadoEmpresa, cda.cdaid),
        ejecucion: ultimaEjecucion(historialEmpresa, cda.cdaid),
        pantalla: PANTALLA_EMPRESA,
      })),
    },
    ...(cdasAccionistas.length > 0
      ? accionistas.map((acc, accIdx) => {
          const estadoAcc = armarEstadoPorCda(acc.historial, { cadenaValorId: cadenaId });
          return {
            clave: `acc-${acc.terceroId}`,
            etiqueta: "Accionista",
            nombre: acc.denominacion || acc.Denominacion || acc.nombre || `Accionista ${accIdx + 1}`,
            cuit: getCleanCuit(acc.cuit || acc.Cuit),
            icono: <FiUser />,
            items: cdasAccionistas.map((cda) => ({
              rowKey: `acc-${acc.terceroId}-${cda.cdaid}`,
              cda,
              estado: estadoDe(estadoAcc, cda.cdaid),
              ejecucion: ultimaEjecucion(acc.historial, cda.cdaid),
              terceroId: acc.terceroId,
              pantalla: PANTALLA_ACCIONISTAS,
            })),
          };
        })
      : []),
  ];

  const todos = grupos.flatMap((g) => g.items);
  const contar = (estado) => todos.filter((i) => i.estado === estado).length;
  const grupoMovilActivo = grupos.find((g) => g.clave === grupoMovil) || grupos[0];
  const ultimaEvaluacion = ordenarEjecucionesCda(historialEmpresa)[0];
  const reevaluandoGrupo = grupoMovilActivo?.items.some((i) => reloadingRows[i.rowKey]);

  const reevaluarGrupo = async () => {
    for (const item of grupoMovilActivo?.items || []) {
      await handleReevaluar(item.rowKey, item.cda, { terceroId: item.terceroId, pantalla: item.pantalla });
    }
  };

  const regla = (cda) => [cda.expresion, cda.simbolocomparacion, cda.valorcomparacion].filter(Boolean).join(" ");

  const renderFila = ({ rowKey, cda, estado, ejecucion, terceroId, pantalla }) => {
    const isExpanded = !!expandedRows[rowKey];
    const isReloading = !!reloadingRows[rowKey];
    const valor = ejecucion?.valorresultado ?? ejecucion?.ValorResultado;
    return (
      <div key={rowKey} className={styles.fila}>
        <div className={styles.filaCabecera}>
          <span className={`${styles.punto} ${estado === true ? styles.puntoOk : estado === false ? styles.puntoMal : ""}`} />
          <button
            type="button"
            className={styles.filaTextos}
            onClick={() => handleToggleRow(rowKey)}
            aria-expanded={isExpanded}
          >
            <span className={styles.cdaTitleText}>{cda.descripcion}</span>
            {regla(cda) && <code className={styles.ruleBadge}>{regla(cda)}</code>}
          </button>
          <TextoEstado estado={estado} />
          {puedeReevaluar && (
            <button
              type="button"
              className={styles.btnHistory}
              onClick={() => handleReevaluar(rowKey, cda, { terceroId, pantalla })}
              title="Volver a evaluar el criterio"
              aria-label={`Volver a evaluar ${cda.descripcion}`}
              disabled={isReloading}
            >
              <FiRotateCw className={isReloading ? styles.btnHistoryActive : ""} />
            </button>
          )}
          <button
            type="button"
            className={styles.chevronBtn}
            onClick={() => handleToggleRow(rowKey)}
            aria-label={isExpanded ? "Ocultar detalle" : "Ver detalle"}
          >
            <FiChevronDown className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`} />
          </button>
        </div>
        <div className={`${styles.cdaDetails} ${isExpanded ? styles.cdaDetailsAbierto : ""}`}>
          {valor !== undefined && valor !== null && valor !== "" && (
            <span className={styles.detalleDato}>
              Valor evaluado <code className={estado === false ? styles.valorMal : ""}>{valor}</code>
            </span>
          )}
          <span className={styles.detalleDato}>
            Última evaluación{" "}
            <strong>{ejecucion ? formatearMomentoControl(ejecucion.momentocontrol ?? ejecucion.MomentoControl) : "Sin evaluar"}</strong>
          </span>
        </div>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Criterios de aceptación"
      subtitle={[solicitud?.id && `Solicitud N° ${solicitud.id}`, solicitud?.cliente].filter(Boolean).join(" · ")}
      icono={<FiShield />}
      maxWidth="700px"
      variant="blue"
      headerActions={
        <button
          type="button"
          className={styles.helpButton}
          onClick={() => toast.info("Los criterios de aceptación definen las reglas de negocio y riesgo evaluadas para esta operación.")}
          title="Ayuda"
          aria-label="Ayuda"
        >
          <FiHelpCircle size={17} />
        </button>
      }
      footer={
        <>
          {ultimaEvaluacion && (
            <span className={styles.pieAyuda}>
              Última evaluación: {formatearMomentoControl(ultimaEvaluacion.momentocontrol ?? ultimaEvaluacion.MomentoControl)}
            </span>
          )}
          {puedeReevaluar && !isLoading && grupoMovilActivo?.items.length > 0 && (
            <Button
              variant="adminSuave"
              className={styles.soloMovil}
              onClick={reevaluarGrupo}
              isLoading={reevaluandoGrupo}
              disabled={reevaluandoGrupo}
            >
              Reevaluar todos
            </Button>
          )}
          <Button variant="adminNeutro" onClick={onClose}>
            Cerrar
          </Button>
        </>
      }
    >
      <div className={styles.modalBody}>
        {isLoading ? (
          <div className={styles.grupo}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={styles.filaCabecera} style={{ padding: "0.75rem 0.85rem" }}>
                <Skeleton width="0.5rem" height="0.5rem" radius="50%" />
                <Skeleton width="45%" height="0.85rem" />
                <Skeleton width="6rem" height="1.2rem" radius="pill" style={{ marginLeft: "auto" }} />
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className={styles.resumen}>
              <div className={styles.resumenItem}>
                <span className={`${styles.resumenIcono} ${styles.resumenOk}`}><FiCheck /></span>
                <span className={styles.resumenTextos}>
                  <strong>{contar(true)} {contar(true) === 1 ? "superada" : "superadas"}</strong>
                  <span>de {todos.length} criterios</span>
                </span>
              </div>
              <div className={styles.resumenItem}>
                <span className={`${styles.resumenIcono} ${styles.resumenMal}`}><FiX /></span>
                <span className={styles.resumenTextos}>
                  <strong>{contar(false)} {contar(false) === 1 ? "no superada" : "no superadas"}</strong>
                </span>
              </div>
              <div className={styles.resumenItem}>
                <span className={styles.resumenIcono}><FiMinus /></span>
                <span className={styles.resumenTextos}>
                  <strong>{contar(null)} sin evaluar</strong>
                </span>
              </div>
            </div>

            {grupos.length > 1 && (
              <label className={styles.selectorMovil}>
                <span className={styles.srOnly}>Persona</span>
                <select value={grupoMovilActivo?.clave} onChange={(e) => setGrupoMovil(e.target.value)}>
                  {grupos.map((g) => {
                    const ok = g.items.filter((i) => i.estado === true).length;
                    return (
                      <option key={g.clave} value={g.clave}>
                        {g.nombre} · {g.etiqueta} · {ok}/{g.items.length}
                      </option>
                    );
                  })}
                </select>
                <FiChevronDown aria-hidden="true" />
              </label>
            )}

            {grupos.map((g) => {
              const ok = g.items.filter((i) => i.estado === true).length;
              const conFallas = g.items.some((i) => i.estado === false);
              return (
                <div
                  key={g.clave}
                  className={`${styles.grupo} ${g.clave !== grupoMovilActivo?.clave ? styles.ocultoMovil : ""}`}
                >
                  <div className={styles.grupoCabecera}>
                    <span className={styles.cuitCardIcon} aria-hidden="true">{g.icono}</span>
                    <span className={styles.cuitCardInfo}>
                      <span className={styles.cuitCardLabel}>{g.etiqueta}</span>
                      <span className={styles.cuitCardMain}>
                        <strong className={styles.cuitCardName}>{g.nombre}</strong>
                        <span className={styles.cuitCardNumber}>CUIT {g.cuit}</span>
                      </span>
                    </span>
                    {g.items.length > 0 && (
                      <span className={`${styles.grupoConteo} ${conFallas ? styles.grupoConteoMal : ""}`}>
                        {ok}/{g.items.length} {ok === 1 ? "superada" : "superadas"}
                      </span>
                    )}
                  </div>
                  {g.items.length === 0 ? (
                    <p className={styles.grupoVacio}>La cadena no tiene criterios configurados para la empresa.</p>
                  ) : (
                    g.items.map(renderFila)
                  )}
                </div>
              );
            })}
          </>
        )}
      </div>
    </Modal>
  );
};
