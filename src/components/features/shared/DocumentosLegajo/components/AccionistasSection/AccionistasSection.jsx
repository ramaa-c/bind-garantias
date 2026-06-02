import React, { useState } from "react";
import { FiUsers, FiPlus, FiAlertCircle, FiUser, FiChevronDown, FiEdit2, FiTrash2, FiMail, FiPhone, FiMapPin, FiPercent } from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";
import { SocioAccionistaModal } from "../SocioAccionistaModal/SocioAccionistaModal";
import { Spinner } from "../../../../../ui";

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
          <div className={styles.sectionHeader}>
            <div className={styles.sectionHeaderLeft}>
              <FiUsers className={styles.sectionIcon} size={18} />
              <h5 className={styles.sectionTitle}>
                Accionistas (Composición Accionaria)
              </h5>
            </div>
            <button
              type="button"
              className={styles.addButton}
              onClick={() => {
                setEditAccionista(null);
                setModalAccionistaOpen(true);
              }}
              disabled={totalParticipacion >= 100}
            >
              <FiPlus size={14} /> Agregar Accionista
            </button>
          </div>

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

          {totalParticipacion !== 100 && (
            <div
              className={`${styles.alertBanner} ${styles.alertBannerWarning}`}
            >
              <FiAlertCircle className={styles.alertIcon} size={16} />
              <p className={styles.alertText}>
                La composición accionaria actual debe sumar exactamente el 100%
                (Actual: {totalParticipacion}%).
              </p>
            </div>
          )}

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
              {accionistas.map((socio) => (
                <div key={socio.id} className={styles.socioCard}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <button
                      type="button"
                      className={styles.socioCardBtn}
                      onClick={() =>
                        setExpandedSocio(
                          expandedSocio === socio.id ? null : socio.id,
                        )
                      }
                    >
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
                        className={`${styles.actionBtn} ${styles.actionBtnEdit}`}
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
                  </div>
                </div>
              ))}
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
