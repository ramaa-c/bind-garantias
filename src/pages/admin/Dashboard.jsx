import React, { useState } from "react";
import { FiSearch, FiCheck, FiX, FiEye, FiArrowRight, FiFilter } from "react-icons/fi";
import { toast } from "sonner";
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
  },
];

export default function Dashboard() {
  const [solicitudes, setSolicitudes] = useState(solicitudesIniciales);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [orden, setOrden] = useState("desc");

  // Detalle Modal
  const [solicitudDetalle, setSolicitudDetalle] = useState(null);

  const handleAceptar = (id) => {
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, estado: "Aprobada", accionPendiente: "Aprobada por Administrador" }
          : s
      )
    );
    toast.success(`Solicitud N°${id} Aprobada exitosamente`, {
      description: "Los fondos o cupos han sido habilitados para el cliente.",
    });
  };

  const handleRechazar = (id) => {
    setSolicitudes((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, estado: "Rechazada", accionPendiente: "Rechazada por Administrador" }
          : s
      )
    );
    toast.error(`Solicitud N°${id} Rechazada`, {
      description: "Se ha notificado al cliente el rechazo de la operación.",
    });
  };

  const filtradas = solicitudes
    .filter((s) => {
      const matchTexto =
        s.cliente.toLowerCase().includes(busqueda.toLowerCase()) ||
        s.cuit.includes(busqueda) ||
        s.id.includes(busqueda) ||
        s.usuario.toLowerCase().includes(busqueda.toLowerCase());

      if (filtroEstado === "todos") return matchTexto;
      return matchTexto && s.estado.toLowerCase().includes(filtroEstado.toLowerCase());
    })
    .sort((a, b) => {
      if (orden === "desc") return b.id.localeCompare(a.id);
      return a.id.localeCompare(b.id);
    });

  const totalMonto = solicitudes.reduce((acc, curr) => {
    const val = parseFloat(curr.monto.replace(/\./g, "")) || 0;
    return acc + (curr.moneda === "U$D" ? val * 1200 : val);
  }, 0);

  return (
    <div className={styles.dashboardContainer}>
      {/* Header and top KPI widgets */}
      <div className={styles.headerTitle}>
        <div>
          <h1>Panel General de Control</h1>
          <p>Supervisión global de todas las líneas y solicitudes activas en el sistema.</p>
        </div>
      </div>

      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Líneas Totales</span>
          <span className={styles.kpiValue}>{solicitudes.length}</span>
          <div className={styles.kpiFooter}>En cartera activa</div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Volumen Gestionado (Aprox)</span>
          <span className={styles.kpiValue}>
            $ {(totalMonto / 1000000).toFixed(1)}M
          </span>
          <div className={styles.kpiFooter}>Pesos consolidados</div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Pendientes de Validación</span>
          <span className={styles.kpiValueWarning}>
            {solicitudes.filter((s) => s.estado.includes("Pendiente")).length}
          </span>
          <div className={styles.kpiFooter}>Requieren acción inmediata</div>
        </div>
        <div className={styles.kpiCard}>
          <span className={styles.kpiLabel}>Aprobadas</span>
          <span className={styles.kpiValueSuccess}>
            {solicitudes.filter((s) => s.estado === "Aprobada").length}
          </span>
          <div className={styles.kpiFooter}>Listas para operar</div>
        </div>
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
          <div className={styles.selectBox}>
            <FiFilter className={styles.iconSelect} />
            <select
              value={filtroEstado}
              onChange={(e) => setFiltroEstado(e.target.value)}
              className={styles.customSelect}
            >
              <option value="todos">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="aprobada">Aprobada</option>
              <option value="rechazada">Rechazada</option>
            </select>
          </div>

          <select
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            className={styles.customSelect}
          >
            <option value="desc">Más Recientes (N° Desc)</option>
            <option value="asc">Más Antiguas (N° Asc)</option>
          </select>
        </div>
      </div>

      {/* Main Operations List mimicking user screenshot */}
      <div className={styles.listWrapper}>
        {filtradas.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No se encontraron solicitudes que coincidan con los criterios de búsqueda.</p>
          </div>
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
                          <span key={t} className={styles.tagBadge}>
                            {t}
                          </span>
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
                        <span className={styles.detailText}>{item.usuario}</span>
                      </div>
                      <div>
                        <span className={styles.detailLabel}>Estado:</span>{" "}
                        <span
                          className={`${styles.statusPill} ${
                            isAprobada
                              ? styles.pillApproved
                              : isRechazada
                              ? styles.pillRejected
                              : styles.pillPending
                          }`}
                        >
                          {item.estado}
                        </span>
                      </div>
                      <div className={styles.fullSpan}>
                        <span className={styles.detailLabel}>Acción pendiente:</span>{" "}
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
                      {isPendiente && (
                        <div className={styles.quickDecisions}>
                          <button
                            onClick={() => handleAceptar(item.id)}
                            className={styles.btnAccept}
                            title="Aprobar Solicitud"
                          >
                            <FiCheck /> ACEPTAR
                          </button>
                          <button
                            onClick={() => handleRechazar(item.id)}
                            className={styles.btnReject}
                            title="Rechazar Solicitud"
                          >
                            <FiX /> RECHAZAR
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          toast.info(`Continuando flujo de gestión N°${item.id}`);
                        }}
                        className={styles.btnContinue}
                      >
                        CONTINUAR <FiArrowRight />
                      </button>

                      <button
                        onClick={() => setSolicitudDetalle(item)}
                        className={styles.btnDetail}
                      >
                        <FiEye /> VER DETALLE
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Mock Detail Modal */}
      {solicitudDetalle && (
        <div className={styles.modalBackdrop} onClick={() => setSolicitudDetalle(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHead}>
              <h3>Detalle Avanzado • Solicitud N°{solicitudDetalle.id}</h3>
              <button className={styles.closeModal} onClick={() => setSolicitudDetalle(null)}>
                <FiX size={20} />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.modalSection}>
                <h4>Datos del Solicitante</h4>
                <p><strong>Razón Social:</strong> {solicitudDetalle.cliente}</p>
                <p><strong>CUIT/Identificador:</strong> {solicitudDetalle.cuit}</p>
                <p><strong>Email Operador:</strong> {solicitudDetalle.usuario}</p>
              </div>

              <div className={styles.modalSection}>
                <h4>Información de la Línea / Producto</h4>
                <p><strong>Tipo de Operación:</strong> {solicitudDetalle.tipo}</p>
                <p><strong>Monto Solicitado:</strong> {solicitudDetalle.moneda || "$"} {solicitudDetalle.monto}</p>
                <p><strong>Estado Actual:</strong> {solicitudDetalle.estado}</p>
                <p><strong>Último hito de control:</strong> {solicitudDetalle.accionPendiente}</p>
              </div>

              <div className={styles.modalSection}>
                <h4>Trazabilidad e Historial</h4>
                <p>Carga Inicial: {solicitudDetalle.creado}</p>
                <p>Última Modificación: {solicitudDetalle.actualizado}</p>
                <p>Canal de Origen: BIND Garantías Portal Web</p>
              </div>
            </div>
            <div className={styles.modalFoot}>
              <button
                className={styles.btnOutline}
                onClick={() => setSolicitudDetalle(null)}
              >
                Cerrar Ventana
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
