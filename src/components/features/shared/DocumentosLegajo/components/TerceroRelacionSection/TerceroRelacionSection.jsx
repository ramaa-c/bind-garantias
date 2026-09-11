import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  FiUser,
  FiPlus,
  FiChevronDown,
  FiEdit2,
  FiTrash2,
  FiMail,
  FiPhone,
  FiMapPin,
  FiAlertCircle,
  FiXCircle,
} from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";
import { RepresentanteModal } from "../../../RepresentanteModal/RepresentanteModal";
import { TerceroCdaEstado } from "../TerceroCdaEstado/TerceroCdaEstado";
import { Spinner } from "../../../../../ui/Spinner/Spinner";
import { useEstadoCdaTerceros } from "../../../../../../hooks/useTerceros";

// Versión genérica de RepresentantesSection/ApoderadosSection: misma lógica
// de carga (contacto + domicilio, sin DNI ni campos propios de accionista o
// agente de bolsa - ver RepresentanteModal), pero parametrizada por
// `tipoRelacionSocioId` + `titulo` en vez de tener el rol fijo en el código.
// La usa SociosLegajo.jsx para cualquier relación que el admin haya
// activado en /admin/tipos-relacion-socio más allá de las 4 con sección
// propia de siempre.
export function TerceroRelacionSection({
  loadingSocios,
  items,
  titulo,
  tipoRelacionSocioId,
  handleEliminarRelacion,
  cargarSocios,
  socioIdActivo,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const [portalTarget, setPortalTarget] = useState(null);
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");

  const { data: estadoCdaMap } = useEstadoCdaTerceros(items.map((r) => r.id));

  const abrirModal = (item = null) => {
    setEditItem(item);
    setModalOpen(true);
  };
  const cerrarModal = () => {
    setModalOpen(false);
    setEditItem(null);
  };

  useEffect(() => {
    setPortalTarget(document.getElementById("socios-header-action-portal"));
  }, []);

  return (
    <div className={styles.sociosContainer}>
      {loadingSocios ? (
        <div className={styles.emptySlot} style={{ display: "flex", flexDirection: "column", gap: "0.875rem", padding: "2rem" }}>
          <Spinner size={36} />
          <p className={styles.emptyTitle} style={{ margin: 0 }}>
            Cargando {titulo.toLowerCase()}...
          </p>
        </div>
      ) : (
        <div className={styles.sectionBlock}>
          {portalTarget && createPortal(
            <button
              type="button"
              className={`${styles.addButton} ${isAdmin ? styles.addButtonAdmin : ""}`}
              onClick={() => abrirModal()}
              title={`Agregar ${titulo}`}
            >
              <FiPlus size={14} />
              <span className={styles.addButtonLabel}>Agregar {titulo}</span>
            </button>,
            portalTarget
          )}

          {items.length === 0 ? (
            <div
              className={styles.emptySlot}
              style={{ minHeight: "6rem", padding: "1.5rem" }}
            >
              <p className={styles.emptyTitle}>No hay registros de {titulo} cargados</p>
              <span className={styles.emptyText}>
                Haga click en "Agregar {titulo}" para dar de alta.
              </span>
            </div>
          ) : (
            <div className={styles.sociosList}>
              {items.map((item) => {
                const faltantes = [];
                const sEmail = item.email || item.mail || item.Mail || "";
                const sCel = item.celular || item.telefono || item.Telefono || "";
                const sDir = item.direccion || item.calle || "";
                const sProv = item.provincia || item.provinciaid || "";

                if (!sEmail) faltantes.push("Email");
                if (!sCel) faltantes.push("Teléfono");
                if (!sDir || !sProv) faltantes.push("Domicilio completo");

                const cuitLimpio = String(item.cuit || "").replace(/\D/g, "");
                if (!cuitLimpio) faltantes.push("CUIT válido");

                const cdaRechazado = estadoCdaMap?.get(Number(item.id)) === "rechazado";

                return (
                <div key={item.id} className={`${styles.socioCard} ${cdaRechazado ? styles.socioCardRejected : faltantes.length > 0 ? styles.socioCardWarning : styles.socioCardSuccess}`}>
                  {cdaRechazado && (
                    <div className={styles.socioRejectedBanner}>
                      <FiXCircle size={14} />
                      <span>Esta persona no superó las validaciones de aceptación correspondientes. Comunicate con nosotros para que la revisemos.</span>
                    </div>
                  )}
                  <div className={styles.socioCardHeaderRow}>
                    <button
                      type="button"
                      className={styles.socioCardBtn}
                      onClick={() =>
                        setExpandedItem(expandedItem === item.id ? null : item.id)
                      }
                    >
                      {faltantes.length > 0 && (
                        <div className={styles.socioWarningWrapper}>
                          <FiAlertCircle className={styles.socioWarningIcon} />
                          <div className={styles.socioWarningTooltip}>
                            <strong>Faltan datos obligatorios:</strong>
                            <ul>
                              {faltantes.map((f, i) => (
                                <li key={i}>{f}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}
                      <div className={styles.socioAvatar}>
                        <FiUser size={16} />
                      </div>
                      <div className={styles.socioMainInfo}>
                        <span className={styles.socioName}>{item.nombre}</span>
                        <span className={styles.socioCuit}>
                          CUIT: {item.cuit}
                        </span>
                        <span
                          className={`${styles.roleBadge} ${styles.roleBadgeMobile} ${styles.roleGenerico}`}
                        >
                          {titulo}
                        </span>
                      </div>
                      <span
                        className={`${styles.roleBadge} ${styles.roleBadgeDesktop} ${styles.roleGenerico}`}
                      >
                        {titulo}
                      </span>
                      <FiChevronDown
                        className={`${styles.socioChevron} ${expandedItem === item.id ? styles.socioChevronOpen : ""}`}
                      />
                    </button>
                    <div
                      className={styles.socioHeaderActions}
                      style={{ paddingRight: "1rem" }}
                    >
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnEdit} ${isAdmin ? styles.actionBtnEditAdmin : ""}`}
                        onClick={() => abrirModal(item)}
                        title={`Editar ${titulo}`}
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                        onClick={() => handleEliminarRelacion(item)}
                        title={`Eliminar ${titulo}`}
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`${styles.socioExpand} ${expandedItem === item.id ? styles.socioExpandOpen : ""}`}
                  >
                    <div className={styles.socioDetailGrid}>
                      {item.email && (
                        <div className={styles.socioDetail}>
                          <FiMail className={styles.socioDetailIcon} />
                          <div>
                            <span className={styles.socioDetailLabel}>
                              Email
                            </span>
                            <span className={styles.socioDetailVal}>
                              {item.email}
                            </span>
                          </div>
                        </div>
                      )}
                      {item.telefono && (
                        <div className={styles.socioDetail}>
                          <FiPhone className={styles.socioDetailIcon} />
                          <div>
                            <span className={styles.socioDetailLabel}>
                              Celular / Teléfono
                            </span>
                            <span className={styles.socioDetailVal}>
                              {item.telefono}
                            </span>
                          </div>
                        </div>
                      )}
                      {item.direccion && (
                        <div className={styles.socioDetail}>
                          <FiMapPin className={styles.socioDetailIcon} />
                          <div>
                            <span className={styles.socioDetailLabel}>
                              Dirección
                            </span>
                            <span className={styles.socioDetailVal}>
                              {item.direccion}
                              {item.codpos ? ` (${item.codpos})` : ""}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    {isAdmin && (
                      <TerceroCdaEstado
                        terceroId={item.id}
                        socioIdActivo={socioIdActivo}
                      />
                    )}
                  </div>
                </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <RepresentanteModal
        isOpen={modalOpen}
        onClose={cerrarModal}
        onSuccess={() => cargarSocios()}
        representante={editItem}
        socioIdActivo={socioIdActivo}
        tipoRelacionSocioId={tipoRelacionSocioId}
        etiquetaRol={titulo}
      />
    </div>
  );
}
