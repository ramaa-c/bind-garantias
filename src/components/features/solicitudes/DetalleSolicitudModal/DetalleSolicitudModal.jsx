import React from "react";
import { Modal, Button } from "../../../ui";
import styles from "./DetalleSolicitudModal.module.css";
import { useQuery } from "@tanstack/react-query";
import { sociosService } from "../../../../services/sociosService";
import { tercerosService } from "../../../../services/tercerosService";
import {
  FiFileText,
  FiDollarSign,
  FiCalendar,
  FiUsers,
  FiAlertCircle,
} from "react-icons/fi";

const estadoConfig = {
  Cancelada: { color: styles.badgeGrey, label: "Cancelada" },
  Cancelado: { color: styles.badgeGrey, label: "Cancelado" },
  Aprobada: { color: styles.badgeGreen, label: "Aprobada" },
  Aprobado: { color: styles.badgeGreen, label: "Aprobado" },
  Pendiente: { color: styles.badgeYellow, label: "Pendiente" },
  Rechazada: { color: styles.badgeRed, label: "Rechazada" },
  Rechazado: { color: styles.badgeRed, label: "Rechazado" },
};

export const DetalleSolicitudModal = ({
  isOpen,
  onClose,
  solicitud,
  nombreEmpresa,
}) => {
  const cuit = solicitud?.cuit || "";
  const estadoValue = solicitud?.estado || "";
  const tipoValue = solicitud?.tipo || "";

  const estado = estadoConfig[estadoValue] || {
    color: styles.badgeYellow,
    label: estadoValue,
  };
  const esCancelada =
    estadoValue === "Cancelada" ||
    estadoValue === "Rechazada" ||
    estadoValue === "Cancelado" ||
    estadoValue === "Rechazado";

  const tipoLabel =
    tipoValue === "Cheque"
      ? "Cheque Propio"
      : tipoValue || "Operación";

  const { data: socioResp, isLoading: cargandoSocio } = useQuery({
    queryKey: ["socio", "cuit", cuit],
    queryFn: () => sociosService.obtenerSocios({ Cuit: cuit }),
    enabled: !!cuit && isOpen && !nombreEmpresa,
    staleTime: 1000 * 60 * 5,
  });

  const socio = Array.isArray(socioResp)
    ? socioResp[0]
    : socioResp?.items?.[0] || socioResp?.data?.[0];
  const nombreFinal = nombreEmpresa || socio?.denominacion || "Cargando...";

  const socioIdTarget = solicitud?.socioid || socio?.socioid;

  const { data: accionistas = [], isLoading: cargandoAccionistas } = useQuery({
    queryKey: ["accionistas", socioIdTarget],
    queryFn: async () => {
      let relacionesSGR = [];
      let relacionesLocal = [];
      try {
        relacionesSGR =
          await tercerosService.obtenerRelacionesDeSocioSGRPlus(socioIdTarget) || [];
      } catch (e) {
        console.warn("No se pudo obtener relaciones de SGRPlus", e);
      }
      try {
        relacionesLocal =
          await tercerosService.obtenerRelacionesDeSocio(socioIdTarget) || [];
      } catch (e) {
        console.warn("No se pudo obtener relaciones locales", e);
      }

      const arrSgr = Array.isArray(relacionesSGR) ? relacionesSGR : [];
      const arrLocal = Array.isArray(relacionesLocal) ? relacionesLocal : [];

      const mapaRel = new Map();
      [...arrSgr, ...arrLocal].forEach((r) => {
        const tid =
          r.terceroid || r.tercerorelacionadoid || r.TerceroRelacionadoID || r.TerceroId;
        const rid =
          r.tiporelacionsocioid ||
          r.TipoRelacionSocioID ||
          r.tiporelacionsocioId;
        if (tid && rid) {
          mapaRel.set(`${tid}-${rid}`, r);
        }
      });

      const relaciones = Array.from(mapaRel.values());

      if (!relaciones || relaciones.length === 0) return [];

      const now = new Date();
      const relacionesFiltradas = relaciones.filter((rel) => {
        // 1. Validar tipo de relación (25 es Accionista/Socio Accionista)
        const tiporel =
          rel.tiporelacionsocioid ||
          rel.TipoRelacionSocioID ||
          rel.tiporelacionsocioId;
        const tiporelNum = Number(tiporel);
        if (tiporel && tiporelNum !== 25) return false;

        // 2. Validar expiración de fecha (fechahasta)
        const fd = rel.fechadesde || rel.FechaDesde;
        const fh = rel.fechahasta || rel.FechaHasta;
        if (fh && fh !== "") {
          const expirationDate = new Date(fh);
          const startDate = fd ? new Date(fd) : null;

          // Si fechahasta coincide con fechadesde (por tiempo o día calendario), no está expirado
          const isSameAsStart =
            startDate &&
            (expirationDate.getTime() === startDate.getTime() ||
              expirationDate.toISOString().split("T")[0] ===
                startDate.toISOString().split("T")[0]);

          if (!isSameAsStart && expirationDate < now) {
            return false; // Expirada, omitir
          }
        }
        return true;
      });

      const uniqueIds = new Set();
      const relacionesUnicas = relacionesFiltradas.filter((rel) => {
        const rawId =
          rel.terceroid ||
          rel.tercerorelacionadoid ||
          rel.TerceroRelacionadoID ||
          rel.TerceroId;
        if (!rawId) return false;
        const idStr = String(rawId);
        if (uniqueIds.has(idStr)) return false;
        uniqueIds.add(idStr);
        return true;
      });

      const promises = relacionesUnicas.map(async (rel) => {
        const terceroId =
          rel.terceroid ||
          rel.tercerorelacionadoid ||
          rel.TerceroRelacionadoID ||
          rel.TerceroId;

        let tercero = null;
        try {
          tercero = await tercerosService.obtenerTerceroPorId(terceroId);
          if (!tercero || Object.keys(tercero).length === 0) {
            tercero =
              await tercerosService.obtenerTerceroPorIdSGRPlus(terceroId);
          }
        } catch (e) {
          tercero = await tercerosService.obtenerTerceroPorIdSGRPlus(terceroId);
        }

        if (tercero) {
          return {
            ...tercero,
            participacion:
              rel.porcacciones ||
              rel.participacion ||
              rel.Participacion ||
              rel.porcentajeparticipacion ||
              0,
          };
        }
        return null;
      });

      const res = await Promise.all(promises);
      return res.filter(Boolean);
    },
    enabled: !!socioIdTarget && isOpen,
    staleTime: 1000 * 60 * 5,
  });

  if (!solicitud) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="" maxWidth="600px">
      <div className={styles.container}>
        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <div className={styles.hero}>
          <div className={styles.heroTop}>
            <div className={styles.metaRow}>
              <span className={styles.tagSolicitud}>Solicitud</span>
              <span className={styles.tagId}>
                {solicitud.id ? `OB-${solicitud.id}` : "N/A"}
              </span>
            </div>
            <span className={`${styles.estadoBadge} ${estado.color}`}>
              {estado.label}
            </span>
          </div>

          <h2 className={styles.empresaNombre}>
            {cargandoSocio ? "Buscando..." : nombreFinal}
          </h2>
          <p className={styles.empresaCuit}>
            CUIT {solicitud.cuit || "No disponible"}
          </p>

          <div className={styles.metrics}>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>
                <FiFileText size={12} />
                Producto
              </div>
              <div className={styles.metricValue}>{tipoLabel}</div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>
                <FiDollarSign size={12} />
                Monto
              </div>
              <div
                className={`${styles.metricValue} ${styles.metricHighlight}`}
              >
                {solicitud.moneda || "$"} {solicitud.monto || "0"}
              </div>
            </div>
            <div className={styles.metric}>
              <div className={styles.metricLabel}>
                <FiCalendar size={12} />
                Fecha
              </div>
              <div className={styles.metricValue}>{solicitud.fecha || "-"}</div>
            </div>
          </div>

          {/* Alerta de rechazo */}
          {esCancelada && (
            <div className={styles.alertBox}>
              <span className={styles.alertTitle}>
                <FiAlertCircle size={12} />
                Motivos de rechazo
              </span>
              <ul className={styles.alertList}>
                {solicitud.motivosRechazo &&
                solicitud.motivosRechazo.length > 0 ? (
                  solicitud.motivosRechazo.map((motivo, idx) => (
                    <li key={idx}>{motivo}</li>
                  ))
                ) : (
                  <li>Cliente no bancarizado o posee deudas impagas.</li>
                )}
              </ul>
            </div>
          )}
        </div>

        {/* ── ACCIONISTAS / FIADORES ────────────────────────────────────── */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionTitle}>
              <FiUsers size={12} />
              Accionistas / Fiadores
            </span>
            <span className={styles.countPill}>
              {cargandoAccionistas
                ? "Cargando..."
                : `${accionistas.length} persona${accionistas.length !== 1 ? "s" : ""}`}
            </span>
          </div>

          <div className={styles.fiadoresGrid}>
            {cargandoAccionistas ? (
              <p className={styles.emptyText}>
                Buscando accionistas en el sistema...
              </p>
            ) : accionistas.length > 0 ? (
              accionistas.map((accionista, i) => {
                const nombre =
                  accionista.razonsocial ||
                  accionista.denominacion ||
                  accionista.nombre ||
                  accionista.RazonSocial ||
                  accionista.Denominacion ||
                  accionista.Nombre ||
                  "Sin nombre";

                const iniciales = nombre
                  .split(" ")
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((w) => w[0].toUpperCase())
                  .join("");

                const participacion = Number(accionista.participacion) || 0;

                return (
                  <div key={i} className={styles.fiadorCard}>
                    <div className={styles.fiadorAvatar}>{iniciales}</div>
                    <div className={styles.fiadorInfo}>
                      <p className={styles.fiadorName}>{nombre}</p>
                      <div className={styles.fiadorPart}>
                        <div className={styles.partBar}>
                          <div
                            className={styles.partFill}
                            style={{
                              width: `${Math.min(participacion, 100)}%`,
                            }}
                          />
                        </div>
                        <span>{participacion}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className={styles.emptyText}>
                No se encontraron accionistas vinculados a esta empresa.
              </p>
            )}
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <div className={styles.footer}>
          <span className={styles.footerHint}>
            {solicitud.fecha ? `Operación del ${solicitud.fecha}` : ""}
          </span>
          <Button
            variant="primary"
            className={styles.btnClose}
            onClick={onClose}
          >
            Cerrar
          </Button>
        </div>
      </div>
    </Modal>
  );
};
