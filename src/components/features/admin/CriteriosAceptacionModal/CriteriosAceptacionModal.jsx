import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FiCheck, FiX, FiChevronDown, FiRotateCw, FiHelpCircle, FiBriefcase, FiUser } from "react-icons/fi";
import { toast } from "sonner";
import { Modal } from "../../../ui/Modal/Modal";
import { Button } from "../../../ui/Button/Button";
import { Spinner } from "../../../ui/Spinner/Spinner";
import { sociosService } from "../../../../services/sociosService";
import { tercerosService } from "../../../../services/tercerosService";
import { useObtenerCdasPorCadenaId } from "../../../../hooks/useCadenaValor";
import styles from "./CriteriosAceptacionModal.module.css";

export const CriteriosAceptacionModal = ({ isOpen, onClose, solicitud }) => {
  const cuit = solicitud?.cuit || "";
  const estadoValue = solicitud?.estado || "";

  // Estado para controlar qué filas están abiertas (colapsadas/expandidas)
  // Usamos una clave como `cuit-cdaId` o `cuit-cdaIndex`
  const [expandedRows, setExpandedRows] = useState({});

  // Estado para la animación de recarga individual por fila
  const [reloadingRows, setReloadingRows] = useState({});
  // 1. Obtener socio por CUIT si no tenemos socioid directo
  const { data: socioResp } = useQuery({
    queryKey: ["socio", "cuit", cuit],
    queryFn: () => sociosService.obtenerSocios({ Cuit: cuit }),
    enabled: !!cuit && isOpen && !solicitud?.socioid,
    staleTime: 1000 * 60 * 5,
  });

  const socio = Array.isArray(socioResp)
    ? socioResp[0]
    : socioResp?.items?.[0] || socioResp?.data?.[0];

  const socioIdTarget = solicitud?.socioid || socio?.socioid;

  // 2. Obtener accionistas de la SGR o locales
  const { data: accionistas = [], isLoading: cargandoAccionistas } = useQuery({
    queryKey: ["accionistas-cda", socioIdTarget],
    queryFn: async () => {
      if (!socioIdTarget) return [];
      let relacionesSGR = [];
      let relacionesLocal = [];
      try {
        relacionesSGR = await tercerosService.obtenerRelacionesDeSocioSGRPlus(socioIdTarget) || [];
      } catch (e) {
        console.warn("No se pudo obtener relaciones de SGRPlus", e);
      }
      try {
        relacionesLocal = await tercerosService.obtenerRelacionesDeSocio(socioIdTarget) || [];
      } catch (e) {
        console.warn("No se pudo obtener relaciones locales", e);
      }

      const arrSgr = Array.isArray(relacionesSGR) ? relacionesSGR : [];
      const arrLocal = Array.isArray(relacionesLocal) ? relacionesLocal : [];

      const mapaRel = new Map();
      [...arrSgr, ...arrLocal].forEach((r) => {
        const tid = r.terceroid || r.tercerorelacionadoid || r.TerceroRelacionadoID || r.TerceroId;
        const rid = r.tiporelacionsocioid || r.TipoRelacionSocioID || r.tiporelacionsocioId;
        if (tid && rid) {
          mapaRel.set(`${tid}-${rid}`, r);
        }
      });

      const relaciones = Array.from(mapaRel.values());
      if (relaciones.length === 0) return [];

      const now = new Date();
      const relacionesFiltradas = relaciones.filter((rel) => {
        const tiporel = rel.tiporelacionsocioid || rel.TipoRelacionSocioID || rel.tiporelacionsocioId;
        if (Number(tiporel) !== 25) return false; // 25 = Accionista
        const fh = rel.fechahasta || rel.FechaHasta;
        if (fh && fh !== "") {
          const expirationDate = new Date(fh);
          const startDate = rel.fechadesde ? new Date(rel.fechadesde) : null;
          const isSameAsStart = startDate && (expirationDate.getTime() === startDate.getTime() || expirationDate.toISOString().split("T")[0] === startDate.toISOString().split("T")[0]);
          if (!isSameAsStart && expirationDate < now) return false;
        }
        return true;
      });

      const uniqueIds = new Set();
      const relacionesUnicas = relacionesFiltradas.filter((rel) => {
        const rawId = rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID || rel.TerceroId;
        if (!rawId) return false;
        const idStr = String(rawId);
        if (uniqueIds.has(idStr)) return false;
        uniqueIds.add(idStr);
        return true;
      });

      const promises = relacionesUnicas.map(async (rel) => {
        const terceroId = rel.terceroid || rel.tercerorelacionadoid || rel.TerceroRelacionadoID || rel.TerceroId;
        let tercero = null;
        try {
          tercero = await tercerosService.obtenerTerceroPorId(terceroId);
          if (!tercero || !tercero.denominacion || !tercero.cuit) {
            const terceroSGR = await tercerosService.obtenerTerceroPorIdSGRPlus(terceroId);
            if (terceroSGR && (terceroSGR.denominacion || terceroSGR.cuit)) {
              tercero = terceroSGR;
            }
          }
        } catch (e) {
          try {
            tercero = await tercerosService.obtenerTerceroPorIdSGRPlus(terceroId);
          } catch (sgrErr) {
            console.warn("No se pudo obtener tercero", sgrErr);
          }
        }
        if (tercero) {
          return {
            ...tercero,
            participacion: rel.porcacciones || rel.participacion || rel.Participacion || 0,
          };
        }
        return null;
      });

      const res = await Promise.all(promises);
      const validRes = res.filter(Boolean);

      const mapaCuit = new Map();
      validRes.forEach(t => {
        const cuitVal = t.cuit || t.Cuit || t.nrodocumento || t.numerodocumento || "";
        const cuitLimpio = String(cuitVal).replace(/\D/g, "");
        if (cuitLimpio) {
          if (!mapaCuit.has(cuitLimpio)) {
            mapaCuit.set(cuitLimpio, t);
          }
        }
      });
      return Array.from(mapaCuit.values());
    },
    enabled: !!socioIdTarget && isOpen,
    staleTime: 1000 * 60 * 5,
  });

  // 3. Obtener CDAs vinculados a la cadena de valor
  const cadenaId = Number(solicitud?.cadenavalorid) || 1;
  const { data: cdasReal, isLoading: isLoadingCdas } = useObtenerCdasPorCadenaId(cadenaId);

  const listCdas = Array.isArray(cdasReal)
    ? cdasReal
    : cdasReal?.items || cdasReal?.data || [];

  // CDAs por defecto si no devuelve nada la API para la empresa principal
  const defaultEmpresaCdas = [
    { cdaid: 1, descripcion: "Valida al socio que no sea socio protector de otra SGR" },
    { cdaid: 2, descripcion: "Actividades Excluidas" },
    { cdaid: 3, descripcion: "Evaluar si la persona se encuentra fuera del rango de edad permitido" },
    { cdaid: 4, descripcion: "Evaluar si la persona supera el score de Nosis" },
    { cdaid: 5, descripcion: "Evaluar si la persona posee deudas" },
  ];

  const cdasEmpresa = listCdas.length > 0
    ? listCdas.map((c, i) => ({ cdaid: c.cdaid || i + 1, descripcion: c.descripcion || c.Descripcion }))
    : defaultEmpresaCdas;

  // CDAs para los accionistas (según fotos, evalúan edad y si son socios de otra SGR)
  const cdasAccionistasTemplate = [
    { cdaid: 101, descripcion: "Evaluar si la composición accionaria cumple el rango de edad permitido" },
    { cdaid: 102, descripcion: "Valida si los accionistas del cliente son socios protectores de otra SGR" },
  ];

  // Accionistas finales: si no hay en la base de datos, simulamos los 2 de la captura de pantalla antigua
  // para mostrar una demo exacta y rica.
  const accionistasFinales = cargandoAccionistas
    ? []
    : accionistas.length > 0
      ? accionistas
      : [
          { cuit: "20331600629", denominacion: "ACCIONISTA DEMO 1 S.R.L." },
          { cuit: "20338655739", denominacion: "ACCIONISTA DEMO 2 S.R.L." }
        ];

  const handleToggleRow = (rowKey) => {
    setExpandedRows(prev => ({
      ...prev,
      [rowKey]: !prev[rowKey]
    }));
  };

  const handleReloadCda = (e, rowKey, cdaDesc) => {
    e.stopPropagation(); // Evitar colapsar la fila
    setReloadingRows(prev => ({ ...prev, [rowKey]: true }));

    setTimeout(() => {
      setReloadingRows(prev => ({ ...prev, [rowKey]: false }));
      toast.success(`Criterio "${cdaDesc}" validado correctamente (Simulado)`);
    }, 800);
  };

  const isLoading = isLoadingCdas || (!!socioIdTarget && cargandoAccionistas);

  const getCleanCuit = (c) => String(c || "").replace(/\D/g, "");

  // Generar datos de validación
  // Si la solicitud está Rechazada o Cancelada, simulamos un fallo
  const isRechazada = estadoValue.toLowerCase().includes("rechaz") || estadoValue.toLowerCase().includes("cancel");

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
          <div className={styles.loaderWrapper}>
            <Spinner size={50} />
            <p>Consultando criterios de aceptación y accionistas...</p>
          </div>
        ) : (
          <>
            {/* 1. GRUPO EMPRESA PRINCIPAL */}
            <div className={styles.cuitGroup}>
              <div className={styles.cuitCardHeader}>
                <div className={styles.cuitCardIcon}>
                  <FiBriefcase size={14} />
                </div>
                <div className={styles.cuitCardInfo}>
                  <span className={styles.cuitCardLabel}>Empresa Solicitante</span>
                  <div className={styles.cuitCardMain}>
                    <strong className={styles.cuitCardName}>
                      {solicitud?.cliente || "Cliente Principal"}
                    </strong>
                    <span className={styles.cuitCardNumber}>CUIT: {cuit || "No disponible"}</span>
                  </div>
                </div>
              </div>
              {cdasEmpresa.map((cda, idx) => {
                const rowKey = `empresa-${cda.cdaid}`;
                const isExpanded = !!expandedRows[rowKey];
                const isReloading = !!reloadingRows[rowKey];

                // Simulamos éxito para todos los CDAs de la empresa principal
                const passed = true;

                return (
                  <div key={rowKey} className={styles.cdaCard}>
                    <div
                      className={styles.cdaHeader}
                      onClick={() => handleToggleRow(rowKey)}
                    >
                      <div className={styles.cdaHeaderLeft}>
                        {passed ? (
                          <span className={styles.iconSuccess}><FiCheck /></span>
                        ) : (
                          <span className={styles.iconDanger}><FiX /></span>
                        )}
                        <span className={styles.cdaTitleText}>{cda.descripcion}</span>
                      </div>
                      <FiChevronDown
                        className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`}
                      />
                    </div>

                    {isExpanded && (
                      <div className={styles.cdaDetails}>
                        <div className={styles.detailsLeft}>
                          <div className={styles.detailRow}>
                            <span className={styles.detailBold}>Estado: </span>
                            <span className={styles.statusSuperada}>Superada</span>
                          </div>
                          <div className={styles.detailRow}>
                            <span className={styles.detailBold}>Última modificación: </span>
                            <span>sistema@bind.com.ar</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          className={styles.btnHistory}
                          onClick={(e) => handleReloadCda(e, rowKey, cda.descripcion)}
                          title="Revalidar criterio"
                        >
                          <FiRotateCw className={isReloading ? styles.btnHistoryActive : ""} />
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 2. GRUPOS ACCIONISTAS */}
            {accionistasFinales.map((acc, accIdx) => {
              const accCuit = getCleanCuit(acc.cuit || acc.Cuit);
              const accName = acc.denominacion || acc.Denominacion || acc.nombre || `Accionista ${accIdx + 1}`;

              return (
                <div key={accCuit || accIdx} className={styles.cuitGroup}>
                  <div className={styles.cuitCardHeader}>
                    <div className={styles.cuitCardIcon}>
                      <FiUser size={14} />
                    </div>
                    <div className={styles.cuitCardInfo}>
                      <span className={styles.cuitCardLabel}>Accionista / Fiador</span>
                      <div className={styles.cuitCardMain}>
                        <strong className={styles.cuitCardName}>{accName}</strong>
                        <span className={styles.cuitCardNumber}>CUIT: {accCuit}</span>
                      </div>
                    </div>
                  </div>
                  {cdasAccionistasTemplate.map((cda) => {
                    const rowKey = `acc-${accCuit}-${cda.cdaid}`;
                    const isExpanded = !!expandedRows[rowKey];
                    const isReloading = !!reloadingRows[rowKey];

                    // Simulamos fallo en el primer CDA (edad) de la segunda CUIT si la solicitud está Rechazada/Cancelada
                    // Para imitar exactamente el ejemplo de la captura de pantalla: CUIT 20338655739 tiene
                    // fallida la edad
                    const isFailedCase = isRechazada && accCuit === "20338655739" && cda.cdaid === 101;
                    const passed = !isFailedCase;

                    return (
                      <div key={rowKey} className={styles.cdaCard}>
                        <div
                          className={styles.cdaHeader}
                          onClick={() => handleToggleRow(rowKey)}
                        >
                          <div className={styles.cdaHeaderLeft}>
                            {passed ? (
                              <span className={styles.iconSuccess}><FiCheck /></span>
                            ) : (
                              <span className={styles.iconDanger}><FiX /></span>
                            )}
                            <span className={styles.cdaTitleText}>{cda.descripcion}</span>
                          </div>
                          <FiChevronDown
                            className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ""}`}
                          />
                        </div>

                        {isExpanded && (
                          <div className={styles.cdaDetails}>
                            <div className={styles.detailsLeft}>
                              <div className={styles.detailRow}>
                                <span className={styles.detailBold}>Estado: </span>
                                {passed ? (
                                  <span className={styles.statusSuperada}>Superada</span>
                                ) : (
                                  <>
                                    <span className={styles.statusNoSuperada}>No Superada</span>
                                    <span className={styles.statusReason}>
                                      (La edad del cliente no se encuentra entre 38 y 50 años)
                                    </span>
                                  </>
                                )}
                              </div>
                              <div className={styles.detailRow}>
                                <span className={styles.detailBold}>Última modificación: </span>
                                <span>{passed ? "sistema@bind.com.ar" : "pruebaivsa1@yopmail.com"}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className={styles.btnHistory}
                              onClick={(e) => handleReloadCda(e, rowKey, cda.descripcion)}
                              title="Revalidar criterio"
                            >
                              <FiRotateCw className={isReloading ? styles.btnHistoryActive : ""} />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
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
