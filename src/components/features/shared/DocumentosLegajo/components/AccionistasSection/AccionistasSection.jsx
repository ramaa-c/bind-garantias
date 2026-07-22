import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { FiUsers, FiPlus, FiAlertCircle, FiUser, FiChevronDown, FiEdit2, FiTrash2, FiMail, FiPhone, FiMapPin, FiPercent } from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";
import { SocioAccionistaModal } from "../SocioAccionistaModal/SocioAccionistaModal";
import { TerceroCdaEstado } from "../TerceroCdaEstado/TerceroCdaEstado";
import { Spinner } from "../../../../../ui";

const normalizarTexto = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

export function AccionistasSection({
  loadingSocios,
  totalParticipacion,
  accionistas,
  handleEliminarRelacion,
  cargarSocios,
  socioIdActivo,
  archivosBackend,
  dniTerceros,
}) {
  const [modalAccionistaOpen, setModalAccionistaOpen] = useState(false);
  const [editAccionista, setEditAccionista] = useState(null);
  const [expandedSocio, setExpandedSocio] = useState(null);
  const [portalTarget, setPortalTarget] = useState(null);
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");

  useEffect(() => {
    setPortalTarget(document.getElementById("socios-header-action-portal"));
  }, []);

  return (
    <div className={styles.sociosContainer}>
      {loadingSocios ? (
        <div className={styles.emptySlot} style={{ display: "flex", flexDirection: "column", gap: "0.875rem", padding: "2rem" }}>
          <Spinner size={36} />
          <p className={styles.emptyTitle} style={{ margin: 0 }}>
            Cargando composición accionaria...
          </p>
        </div>
      ) : (
        <div className={styles.sectionBlock}>
          {portalTarget && createPortal(
            <button
              type="button"
              className={`${styles.addButton} ${isAdmin ? styles.addButtonAdmin : ""}`}
              onClick={() => {
                setEditAccionista(null);
                setModalAccionistaOpen(true);
              }}
              disabled={totalParticipacion >= 100}
            >
              <FiPlus size={14} /> Agregar Accionista
            </button>,
            portalTarget
          )}

          <div className={styles.progressContainer}>
            <div className={styles.progressLabelRow}>
              <span>Total Participación</span>
              <span
                style={{
                  color: totalParticipacion === 100 ? "#4caf50" : "#ff9800",
                }}
              >
                {totalParticipacion}% / 100%
              </span>
            </div>
            <div className={styles.progressTrack}>
              <div
                className={styles.progressBar}
                style={{
                  width: `${Math.min(totalParticipacion, 100)}%`,
                  backgroundColor:
                    totalParticipacion === 100 ? "#4caf50" : "#ff9800",
                }}
              />
            </div>
          </div>



          {accionistas.length === 0 ? (
            <div
              className={styles.emptySlot}
              style={{ minHeight: "6rem", padding: "1.5rem" }}
            >
              <p className={styles.emptyTitle}>Sin accionistas registrados</p>
              <span className={styles.emptyText}>
                Haga click en "Agregar Accionista" para dar de alta.
              </span>
            </div>
          ) : (
            <div className={styles.sociosList}>
              {accionistas.map((socio) => {
                const faltantes = [];
                const sEmail = socio.email || socio.mail || socio.Mail || "";
                const sCel = socio.celular || socio.telefono || socio.Telefono || "";
                const sDir = socio.direccion || socio.calle || "";
                const sProv = socio.provincia || socio.provinciaid || "";

                if (!sEmail) faltantes.push("Email");
                if (!sCel) faltantes.push("Teléfono");
                if (!sDir || !sProv) faltantes.push("Domicilio completo");

                const cuitLimpio = String(socio.cuit || "").replace(/\D/g, "");
                if (!cuitLimpio) {
                  faltantes.push("CUIT válido");
                } else {
                  const nombreNorm = normalizarTexto(socio.nombre);
                  const tieneDniFrente = (archivosBackend || []).some((a) => {
                    if (a.tipodocumentoarchivoid !== 8) return false;
                    const descNorm = normalizarTexto(a.descripcion);
                    return descNorm.includes(cuitLimpio) || (nombreNorm && descNorm.includes(nombreNorm));
                  });
                  const tieneDniDorso = (archivosBackend || []).some((a) => {
                    if (a.tipodocumentoarchivoid !== 9) return false;
                    const descNorm = normalizarTexto(a.descripcion);
                    return descNorm.includes(cuitLimpio) || (nombreNorm && descNorm.includes(nombreNorm));
                  });

                  if (!tieneDniFrente) faltantes.push("Foto DNI Frente");
                  if (!tieneDniDorso) faltantes.push("Foto DNI Dorso");
                }

                return (
                <div key={socio.id} className={`${styles.socioCard} ${faltantes.length > 0 ? styles.socioCardWarning : styles.socioCardSuccess}`}>
                  <div className={styles.socioCardHeaderRow}>
                    <button
                      type="button"
                      className={styles.socioCardBtn}
                      onClick={() =>
                        setExpandedSocio(
                          expandedSocio === socio.id ? null : socio.id,
                        )
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
                        <span className={styles.socioName}>{socio.nombre}</span>
                        <span className={styles.socioCuit}>
                          CUIT: {socio.cuit}
                        </span>
                      </div>
                      <span className={styles.socioPct}>
                        {socio.participacion}%
                      </span>
                      <FiChevronDown
                        className={`${styles.socioChevron} ${expandedSocio === socio.id ? styles.socioChevronOpen : ""}`}
                      />
                    </button>
                    <div
                      className={styles.socioHeaderActions}
                      style={{ paddingRight: "1rem" }}
                    >
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnEdit} ${isAdmin ? styles.actionBtnEditAdmin : ""}`}
                        onClick={() => {
                          setEditAccionista(socio);
                          setModalAccionistaOpen(true);
                        }}
                        title="Editar Accionista"
                      >
                        <FiEdit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className={`${styles.actionBtn} ${styles.actionBtnDelete}`}
                        onClick={() => handleEliminarRelacion(socio)}
                        title="Eliminar Accionista"
                      >
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </div>

                  <div
                    className={`${styles.socioExpand} ${expandedSocio === socio.id ? styles.socioExpandOpen : ""}`}
                  >
                    <div className={styles.socioDetailGrid}>
                      {socio.email && (
                        <div className={styles.socioDetail}>
                          <FiMail className={styles.socioDetailIcon} />
                          <div>
                            <span className={styles.socioDetailLabel}>
                              Email
                            </span>
                            <span className={styles.socioDetailVal}>
                              {socio.email}
                            </span>
                          </div>
                        </div>
                      )}
                      {socio.telefono && (
                        <div className={styles.socioDetail}>
                          <FiPhone className={styles.socioDetailIcon} />
                          <div>
                            <span className={styles.socioDetailLabel}>
                              Teléfono
                            </span>
                            <span className={styles.socioDetailVal}>
                              {socio.telefono}
                            </span>
                          </div>
                        </div>
                      )}
                      {socio.direccion && (
                        <div className={styles.socioDetail}>
                          <FiMapPin className={styles.socioDetailIcon} />
                          <div>
                            <span className={styles.socioDetailLabel}>
                              Dirección
                            </span>
                            <span className={styles.socioDetailVal}>
                              {socio.direccion}{" "}
                              {socio.codpos ? ` (${socio.codpos})` : ""}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className={styles.socioDetail}>
                        <FiPercent className={styles.socioDetailIcon} />
                        <div>
                          <span className={styles.socioDetailLabel}>
                            Participación
                          </span>
                          <span className={styles.socioDetailVal}>
                            {socio.participacion}%
                          </span>
                        </div>
                      </div>
                    </div>
                    {isAdmin && (
                      <TerceroCdaEstado
                        terceroId={socio.id}
                        cuit={socio.cuit}
                        socioIdActivo={socioIdActivo}
                      />
                    )}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      )}

      <SocioAccionistaModal
        isOpen={modalAccionistaOpen}
        onClose={() => {
          setModalAccionistaOpen(false);
          setEditAccionista(null);
        }}
        onSuccess={() => cargarSocios()}
        socio={editAccionista}
        socioIdActivo={socioIdActivo}
        archivosBackend={archivosBackend}
        accionistas={accionistas}
        dniTerceros={dniTerceros}
      />
    </div>
  );
}
