import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FiSearch, FiCheck, FiX, FiEye, FiArrowRight, FiFileText, FiBriefcase, FiTrendingUp, FiClock, FiCheckCircle, FiList } from "react-icons/fi";
import { toast } from "sonner";
import { Button } from "../../components/ui/Button/Button";
import { Badge } from "../../components/ui/Badge/Badge";
import { Modal } from "../../components/ui/Modal/Modal";
import { SinResultados } from "../../components/ui/SinResultados/SinResultados";
import { TarjetaMetrica } from "../../components/ui/TarjetaMetrica/TarjetaMetrica";
import { Select } from "../../components/ui/Select/Select";
import { useAdminRestrictions } from "../../hooks/useAdminRestrictions";
import { CriteriosAceptacionModal } from "../../components/features";
import api from "../../api/axios";
import styles from "./Dashboard.module.css";

const solicitudesIniciales = [
  {
    id: "16557",
    tipo: "Alta de línea en John Deere",
    monto: "100.000.000",
    cliente: "COMERCIALIZADORA DE BIENES DE CAPITAL SA",
    cuit: "30-59319937-8",
    usuario: "30593199378@yopmail.com",
    estado: "Pendiente de validación",
    accionPendiente: "Espera de documentación de Alta de línea",
    creado: "14/07/2025 20:08",
    actualizado: "14/07/2025 20:31",
    tags: ["TyC aceptados", "Legajo validado"],
    cadenaSlug: "canal1",
  },
  {
    id: "16546",
    tipo: "Alta de línea en John Deere",
    monto: "12.000.400",
    cliente: "RAPTOR.MAX S.R.L.",
    cuit: "30-71654889-5",
    usuario: "30716548895@yopmail.com",
    estado: "Pendiente de validación",
    accionPendiente: "Espera de documentación de Alta de línea",
    creado: "05/06/2025 11:31",
    actualizado: "05/06/2025 11:41",
    tags: ["TyC aceptados", "Legajo validado"],
    cadenaSlug: "canal1",
  },
  {
    id: "16540",
    tipo: "Cheque Avalado BIND",
    monto: "5.500.000",
    cliente: "AGROPECUARIA DEL SUR S.A.",
    cuit: "30-65432110-1",
    usuario: "brunetti@yopmail.com",
    estado: "Aprobada",
    accionPendiente: "Lista para monetizar",
    creado: "14/05/2025 12:08",
    actualizado: "15/05/2025 18:21",
    tags: ["Garantía Digital"],
    cadenaSlug: "default",
  },
  {
    id: "16538",
    tipo: "Pagaré Bursátil USD",
    monto: "250.000",
    moneda: "U$D",
    cliente: "TECH INNOVA S.R.L.",
    cuit: "30-88776655-2",
    usuario: "finanzas@techinnova.com",
    estado: "Rechazada",
    accionPendiente: "Falta de cupo crediticio",
    creado: "10/05/2025 09:15",
    actualizado: "11/05/2025 14:00",
    tags: ["Requiere revisión"],
    cadenaSlug: "default",
  },
];

const opcionesEstado = [
  { value: "todos", label: "Todos los estados" },
  { value: "pendiente", label: "Pendiente" },
  { value: "aprobada", label: "Aprobada" },
  { value: "rechazada", label: "Rechazada" },
];

const opcionesOrden = [
  { value: "desc", label: "Más Recientes (N° Desc)" },
  { value: "asc", label: "Más Antiguas (N° Asc)" },
];

export default function Dashboard() {
  const { cadenaSlug } = useParams();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [orden, setOrden] = useState("desc");

  // Detalle Modal
  const [solicitudDetalle, setSolicitudDetalle] = useState(null);
  const [solicitudCda, setSolicitudCda] = useState(null);
  const { isRestricted } = useAdminRestrictions();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      try {
        const targetCadenaId = Number(cadenaSlug) || 0;
        
        if (!targetCadenaId) {
          setSolicitudes(solicitudesIniciales);
          setLoading(false);
          return;
        }

        const resLimites = await api.get("api/TipoLimiteSocio");
        const listLimites = resLimites.data || [];

        const resSocios = await api.get("api/Socios");
        const listSocios = resSocios.data || [];

        const sociosMap = new Map();
        listSocios.forEach((s) => {
          if (s.socioid) sociosMap.set(s.socioid, s);
        });

        const matchedLimites = listLimites.filter((l) => l.cadenavalorid === targetCadenaId);

        const seen = new Set();
        const deduplicatedLimites = [];
        matchedLimites.forEach((l) => {
          const key = `${l.solicitudid}-${l.tipolimiteid}`;
          if (l.solicitudid > 0) {
            if (!seen.has(key)) {
              seen.add(key);
              deduplicatedLimites.push(l);
            }
          } else {
            deduplicatedLimites.push(l);
          }
        });

        const mapped = deduplicatedLimites.map((l) => {
          let socio = l.socioid ? sociosMap.get(l.socioid) : null;
          if (!socio) {
            socio = listSocios.find((s) => s.denominacion) || null;
          }

          const estadoText =
            l.tipolimiteestadoid === 2
              ? "Aprobada"
              : l.tipolimiteestadoid === 3
                ? "Rechazada"
                : "Pendiente de validación";

          const accionText =
            l.tipolimiteestadoid === 2
              ? "Aprobada por Administrador"
              : l.tipolimiteestadoid === 3
                ? "Rechazada por Administrador"
                : "Espera de documentación de Alta de línea";

          return {
            id: l.tipolimitesocioid?.toString() || Math.random().toString(),
            tipo:
              l.tipolimiteid === 1
                ? "Alta de línea (Cheque)"
                : l.tipolimiteid === 2
                  ? "Alta de línea (Préstamo)"
                  : "Alta de línea (Pagaré)",
            monto: l.importelimite
              ? new Intl.NumberFormat("es-AR").format(l.importelimite)
              : "0",
            moneda: l.monedaid === 2 ? "U$D" : "$",
            cliente: socio?.denominacion || "SANTA ANGELINA S.A.",
            cuit: socio?.cuit || "30-68052476-5",
            usuario: socio?.email || "pruebabind19@yopmail.com",
            estado: estadoText,
            accionPendiente: accionText,
            creado: l.fchvigenciadesde
              ? new Date(l.fchvigenciadesde).toLocaleString("es-AR")
              : "Reciente",
            actualizado: l.fchvigenciahasta
              ? new Date(l.fchvigenciahasta).toLocaleString("es-AR")
              : "Reciente",
            tags: ["Canal Activo", "Legajo validado"],
            cadenaSlug: cadenaSlug,
          };
        });

        setSolicitudes(mapped);
      } catch (e) {
        console.error("Error al cargar datos del dashboard de admin:", e);
        toast.error("Error al cargar solicitudes reales.");
        setSolicitudes(solicitudesIniciales);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [cadenaSlug]);

  const solicitudesCanal = solicitudes;

  const handleAceptar = (id) => {
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              estado: "Aprobada",
              accionPendiente: "Aprobada por Administrador",
            }
          : s,
      ),
    );
    toast.success(`Solicitud N°${id} Aprobada exitosamente`, {
      description: "Los fondos o cupos han sido habilitados para el cliente.",
    });
  };

  const handleRechazar = (id) => {
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              estado: "Rechazada",
              accionPendiente: "Rechazada por Administrador",
            }
          : s,
      ),
    );
    toast.error(`Solicitud N°${id} Rechazada`, {
      description: "Se ha notificado al cliente el rechazo de la operación.",
    });
  };

  const filtradas = solicitudesCanal
    .filter((s) => {
      const matchTexto =
        s.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.cuit.includes(busqueda) ||
        s.id.includes(busqueda) ||
        s.usuario.toLowerCase().includes(busqueda.toLowerCase());

      if (filtroEstado === "todos") return matchTexto;
      return (
        matchTexto &&
        s.estado.toLowerCase().includes(filtroEstado.toLowerCase())
      );
    })
    .sort((a, b) => {
      if (orden === "desc") return b.id.localeCompare(a.id);
      return a.id.localeCompare(b.id);
    });

  const totalMonto = solicitudesCanal.reduce((acc, curr) => {
    const val = parseFloat(curr.monto.replace(/\./g, "")) || 0;
    return acc + (curr.moneda === "U$D" ? val * 1500 : val);
  }, 0);

  return (
    <div className={styles.dashboardContainer}>
      {/* Header and top KPI widgets */}
      <div className={styles.headerTitle}>
        <div>
          <h1>Panel General de Control</h1>
          <p>
            Supervisión global de todas las líneas y solicitudes activas en el
            sistema.
          </p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <TarjetaMetrica
          className={styles.kpiCard}
          labelClassName={styles.kpiLabel}
          valueClassName={styles.kpiValue}
          icon={FiBriefcase}
          label="Líneas Totales"
          value={solicitudesCanal.length}
          footer={<div className={styles.kpiFooter}>En cartera activa</div>}
        />
        <TarjetaMetrica
          className={styles.kpiCard}
          labelClassName={styles.kpiLabel}
          valueClassName={styles.kpiValue}
          icon={FiTrendingUp}
          label="Volumen Gestionado (Aprox)"
          value={`$ ${(totalMonto / 1000000).toFixed(1)}M`}
          footer={<div className={styles.kpiFooter}>Pesos consolidados (1 USD = $1500)</div>}
        />
        <TarjetaMetrica
          className={styles.kpiCard}
          labelClassName={styles.kpiLabel}
          valueClassName={styles.kpiValueWarning}
          icon={FiClock}
          label="Pendientes de Validación"
          value={solicitudesCanal.filter((s) => s.estado.includes("Pendiente")).length}
          footer={<div className={styles.kpiFooter}>Requieren acción inmediata</div>}
        />
        <TarjetaMetrica
          className={styles.kpiCard}
          labelClassName={styles.kpiLabel}
          valueClassName={styles.kpiValueSuccess}
          icon={FiCheckCircle}
          label="Aprobadas"
          value={solicitudesCanal.filter((s) => s.estado === "Aprobada").length}
          footer={<div className={styles.kpiFooter}>Listas para operar</div>}
        />
      </div>

      {/* Controls & Filter toolbar */}
      <div className={styles.toolbarCard}>
        <div className={styles.searchWrap}>
          <FiSearch className={styles.iconSearch} />
          <input
            type="text"
            placeholder="Buscar por Cliente, CUIT, Usuario o N° Solicitud..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className={styles.inputSearch}
          />
        </div>

        <div className={styles.filtersGroup}>
          <div className={styles.customSelectWrapper}>
            <Select
              value={filtroEstado}
              onChange={setFiltroEstado}
              options={opcionesEstado}
              placeholder="Estado"
              isSearchable={false}
              hideErrorSpace
              size="sm"
            />
          </div>

          <div className={styles.customSelectWrapper}>
            <Select
              value={orden}
              onChange={setOrden}
              options={opcionesOrden}
              placeholder="Orden"
              isSearchable={false}
              hideErrorSpace
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Main Operations List mimicking user screenshot */}
      <div className={styles.listWrapper}>
        {loading ? (
          <div className={styles.emptyState}>Cargando solicitudes reales...</div>
        ) : filtradas.length === 0 ? (
          <SinResultados
            className={styles.emptyState}
            message="No se encontraron solicitudes que coincidan con los criterios de búsqueda."
          />
        ) : (
          filtradas.map((item) => {
            const isAprobada = item.estado === "Aprobada";
            const isRechazada = item.estado === "Rechazada";
            const isPendiente = !isAprobada && !isRechazada;

            return (
              <div
                key={item.id}
                className={`${styles.itemRow} ${
                  isAprobada
                    ? styles.rowApproved
                    : isRechazada
                      ? styles.rowRejected
                      : styles.rowPending
                }`}
              >
                <div className={styles.rowMain}>
                  {/* Left Column: Data Info */}
                  <div className={styles.infoCol}>
                    <div className={styles.rowHeaderInfo}>
                      <span className={styles.tipoText}>{item.tipo}</span>
                      <div className={styles.tagsWrap}>
                        {item.tags?.map((t) => (
                          <Badge key={t} className={styles.tagBadge}>
                            {t}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <h2 className={styles.solicitudHeading}>
                      Solicitud N°{item.id} por{" "}
                      <span className={styles.montoHighlight}>
                        {item.moneda || "$"} {item.monto}
                      </span>
                    </h2>

                    <div className={styles.detailsGrid}>
                      <div>
                        <span className={styles.detailLabel}>Cliente:</span>{" "}
                        <span className={styles.detailStrong}>
                          {item.cliente} ({item.cuit})
                        </span>
                      </div>
                      <div>
                        <span className={styles.detailLabel}>Usuario:</span>{" "}
                        <span className={styles.detailText}>
                          {item.usuario}
                        </span>
                      </div>
                      <div>
                        <span className={styles.detailLabel}>Estado:</span>{" "}
                        <Badge
                          className={`${styles.statusPill} ${
                            isAprobada
                              ? styles.pillApproved
                              : isRechazada
                                ? styles.pillRejected
                                : styles.pillPending
                          }`}
                        >
                          {item.estado}
                        </Badge>
                      </div>
                      <div className={styles.fullSpan}>
                        <span className={styles.detailLabel}>
                          Acción pendiente:
                        </span>{" "}
                        <span className={styles.actionHighlight}>
                          {item.accionPendiente}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Actions & Timestamps */}
                  <div className={styles.actionCol}>
                    <div className={styles.timestamps}>
                      <div>Creado: {item.creado}</div>
                      <div>Actualizado: {item.actualizado}</div>
                    </div>

                    <div className={styles.buttonsWrap}>
                      {isRestricted ? (
                        <>
                          <Button
                            onClick={() => setSolicitudCda(item)}
                            variant="outlineBlue"
                            size="sm"
                            className={styles.btnCdaCustom}
                          >
                            <FiList /> CRITERIOS
                          </Button>
                          <Button
                            onClick={() => setSolicitudDetalle(item)}
                            variant="outline"
                            size="sm"
                            className={styles.btnDetailCustom}
                          >
                            <FiEye /> VER DETALLE
                          </Button>
                        </>
                      ) : (
                        <>
                          {isPendiente && (
                            <div className={styles.quickDecisions}>
                              <Button
                                onClick={() => handleAceptar(item.id)}
                                variant="success"
                                size="xs"
                                className={styles.btnAcceptCustom}
                                title="Aprobar Solicitud"
                              >
                                <FiCheck /> ACEPTAR
                              </Button>
                              <Button
                                onClick={() => handleRechazar(item.id)}
                                variant="danger"
                                size="xs"
                                className={styles.btnRejectCustom}
                                title="Rechazar Solicitud"
                              >
                                <FiX /> RECHAZAR
                              </Button>
                            </div>
                          )}

                          <Button
                            onClick={() => {
                              toast.info(
                                `Continuando flujo de gestión N°${item.id}`,
                              );
                            }}
                            variant="primary"
                            size="sm"
                            className={styles.btnContinueCustom}
                          >
                            CONTINUAR <FiArrowRight />
                          </Button>

                          <Button
                            onClick={() => setSolicitudDetalle(item)}
                            variant="outline"
                            size="sm"
                            className={styles.btnDetailCustom}
                          >
                            <FiEye /> VER DETALLE
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mock Detail Modal */}
      <Modal
        isOpen={!!solicitudDetalle}
        onClose={() => setSolicitudDetalle(null)}
        title="DETALLE DE SOLICITUD"
        maxWidth="40rem"
        variant="blue"
      >
        {solicitudDetalle && (
          <>
            <div className={styles.modalBodyCustom}>
              {/* Solicitud Hero Card */}
              <div className={styles.solicitudHeroCard}>
                <div className={styles.solicitudAvatar}>
                  <FiFileText size={20} />
                </div>
                <div className={styles.solicitudHeaderDetails}>
                  <div className={styles.solicitudMeta}>
                    <span className={styles.solicitudNumber}>SOLICITUD N°{solicitudDetalle.id}</span>
                    <span className={`${styles.solicitudStatusBadge} ${
                      solicitudDetalle.estado === "Aprobada" ? styles.badgeAproved :
                      solicitudDetalle.estado === "Rechazada" ? styles.badgeRejected : styles.badgePending
                    }`}>
                      {solicitudDetalle.estado}
                    </span>
                  </div>
                  <h3 className={styles.solicitudProduct}>{solicitudDetalle.tipo}</h3>
                </div>
                <div className={styles.solicitudAmount}>
                  <span className={styles.amountLabel}>Monto Solicitado</span>
                  <strong className={styles.amountValue}>
                    {solicitudDetalle.moneda || "$"} {solicitudDetalle.monto}
                  </strong>
                </div>
              </div>

              {/* Grid with 2 columns */}
              <div className={styles.detailsGridSplit}>
                <div className={styles.detailsBlock}>
                  <h4 className={styles.detailsBlockTitle}>Datos del Solicitante</h4>
                  <div className={styles.detailFields}>
                    <div className={styles.detailField}>
                      <span className={styles.fieldLabel}>Razón Social</span>
                      <span className={styles.fieldValue}>{solicitudDetalle.cliente}</span>
                    </div>
                    <div className={styles.detailField}>
                      <span className={styles.fieldLabel}>CUIT / Identificador</span>
                      <span className={styles.fieldValue}>{solicitudDetalle.cuit}</span>
                    </div>
                    <div className={styles.detailField}>
                      <span className={styles.fieldLabel}>Email Operador</span>
                      <span className={styles.fieldValue}>{solicitudDetalle.usuario}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.detailsBlock}>
                  <h4 className={styles.detailsBlockTitle}>Detalle de la Operación</h4>
                  <div className={styles.detailFields}>
                    <div className={styles.detailField}>
                      <span className={styles.fieldLabel}>Línea / Producto</span>
                      <span className={styles.fieldValue}>{solicitudDetalle.tipo}</span>
                    </div>
                    <div className={styles.detailField}>
                      <span className={styles.fieldLabel}>Último Hito de Control</span>
                      <span className={styles.fieldValueHighlight}>{solicitudDetalle.accionPendiente}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom metadata banner */}
              <div className={styles.trazabilidadBanner}>
                <div className={styles.trazabilidadItem}>
                  <span className={styles.trazabilidadLabel}>Carga Inicial:</span>
                  <span className={styles.trazabilidadValue}>{solicitudDetalle.creado}</span>
                </div>
                <div className={styles.trazabilidadItem}>
                  <span className={styles.trazabilidadLabel}>Última Modificación:</span>
                  <span className={styles.trazabilidadValue}>{solicitudDetalle.actualizado}</span>
                </div>
                <div className={styles.trazabilidadItem}>
                  <span className={styles.trazabilidadLabel}>Canal Origen:</span>
                  <span className={styles.trazabilidadValue}>BIND Garantías Portal Web</span>
                </div>
              </div>
            </div>
            <div className={styles.modalFootCustom}>
              <Button
                variant="outlineBlue"
                size="sm"
                onClick={() => setSolicitudDetalle(null)}
              >
                Cerrar
              </Button>
            </div>
          </>
        )}
      </Modal>

      <CriteriosAceptacionModal
        isOpen={!!solicitudCda}
        onClose={() => setSolicitudCda(null)}
        solicitud={solicitudCda}
      />
    </div>
  );
}
