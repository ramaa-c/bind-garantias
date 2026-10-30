import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiUser, FiPlus, FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";
import s from "../TerceroCard/TerceroCard.module.css";
import { TerceroCard, TerceroEmpty, TerceroSkeleton } from "../TerceroCard/TerceroCard";
import { ordenarPendientesPrimero, sugerenciasPara } from "../TerceroCard/terceroCardUtils";
import { RepresentanteLegalModal } from "../../../RepresentanteLegalModal/RepresentanteLegalModal";
import { TerceroCdaEstado } from "../TerceroCdaEstado/TerceroCdaEstado";
import { useEstadoCdaTerceros } from "../../../../../../hooks/useTerceros";
import { usePortalTarget } from "../../../../../../hooks/usePortalTarget";
import { AvisoRevisionTercero } from "../EstadoRevisionChip/EstadoRevisionChip";

// Contacto + domicilio + CUIT (sin DNI: ver el comentario de la sección).
const calcularFaltantes = (t) => {
  const faltantes = [];
  const sEmail = t.email || t.mail || t.Mail || "";
  const sCel = t.celular || t.telefono || t.Telefono || "";
  const sDir = t.direccion || t.calle || "";
  const sProv = t.provincia || t.provinciaid || "";

  if (!sEmail) faltantes.push("Email");
  if (!sCel) faltantes.push("Teléfono");
  if (!sDir || !sProv) faltantes.push("Domicilio completo");

  const cuitLimpio = String(t.cuit || "").replace(/\D/g, "");
  if (!cuitLimpio) faltantes.push("CUIT válido");
  return faltantes;
};

// Solo Representante Legal (TipoRelacionSocioID 230, persona jurídica) -
// Apoderado tiene su propia pestaña/sección (ver ApoderadosSection), no
// aparece más acá. No pide DNI frente/dorso (a diferencia de Accionistas):
// este modal no tiene forma de cargarlo, ver useValidacionLegajo.
export function RepresentantesSection({
  loadingSocios,
  representantes,
  handleEliminarRelacion,
  cargarSocios,
  socioIdActivo,
  cadenaValorId,
  personasLegajo = [],
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editRepresentante, setEditRepresentante] = useState(null);
  const [expandedRep, setExpandedRep] = useState(null);
  const portalTarget = usePortalTarget("socios-header-action-portal");
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");

  const { data: estadoCdaMap } = useEstadoCdaTerceros(representantes.map((r) => r.id), cadenaValorId);

  const entradas = ordenarPendientesPrimero(
    representantes.map((rep) => ({
      rep,
      faltantes: calcularFaltantes(rep),
      cdaRechazado: estadoCdaMap?.get(Number(rep.id)) === "rechazado",
      cdaPendiente: estadoCdaMap?.get(Number(rep.id)) === "pendiente",
    })),
  );

  const abrirModal = (rep = null) => {
    setEditRepresentante(rep);
    setModalOpen(true);
  };
  const cerrarModal = () => {
    setModalOpen(false);
    setEditRepresentante(null);
  };

  return (
    <div className={styles.sociosContainer}>
      {loadingSocios ? (
        <TerceroSkeleton />
      ) : (
        <div className={styles.sectionBlock}>
          {portalTarget && createPortal(
            <button
              type="button"
              className={`${styles.addButton} ${isAdmin ? styles.addButtonAdmin : ""}`}
              onClick={() => abrirModal()}
            >
              <FiPlus size={14} /> Agregar Representante Legal
            </button>,
            portalTarget
          )}

          {representantes.length === 0 ? (
            <TerceroEmpty
              icon={<FiUser size={20} />}
              titulo="Todavía no cargaste representantes legales"
              hint="Sumá a quienes representan legalmente a tu empresa."
            />
          ) : (
            <div className={s.lista}>
              {entradas.map(({ rep, faltantes, cdaRechazado, cdaPendiente }) => (
                <TerceroCard
                  key={rep.id}
                  nombre={rep.nombre}
                  detalle={`CUIT ${rep.cuit}`}
                  faltantes={faltantes}
                  cdaRechazado={cdaRechazado}
                  cdaPendiente={cdaPendiente}
                  isAdmin={isAdmin}
                  expanded={expandedRep === rep.id}
                  onToggle={() =>
                    setExpandedRep(expandedRep === rep.id ? null : rep.id)
                  }
                  onEdit={() => abrirModal(rep)}
                  onDelete={() => handleEliminarRelacion(rep)}
                  editTitle="Editar Representante Legal"
                  deleteTitle="Eliminar Representante Legal"
                >
                  {cdaRechazado && !isAdmin && <AvisoRevisionTercero />}
                  <div className={styles.socioDetailGrid}>
                    {rep.email && (
                      <div className={styles.socioDetail}>
                        <FiMail className={styles.socioDetailIcon} />
                        <div>
                          <span className={styles.socioDetailLabel}>
                            Email
                          </span>
                          <span className={styles.socioDetailVal}>
                            {rep.email}
                          </span>
                        </div>
                      </div>
                    )}
                    {rep.telefono && (
                      <div className={styles.socioDetail}>
                        <FiPhone className={styles.socioDetailIcon} />
                        <div>
                          <span className={styles.socioDetailLabel}>
                            Celular / Teléfono
                          </span>
                          <span className={styles.socioDetailVal}>
                            {rep.telefono}
                          </span>
                        </div>
                      </div>
                    )}
                    {rep.direccion && (
                      <div className={styles.socioDetail}>
                        <FiMapPin className={styles.socioDetailIcon} />
                        <div>
                          <span className={styles.socioDetailLabel}>
                            Dirección
                          </span>
                          <span className={styles.socioDetailVal}>
                            {rep.direccion}
                            {rep.codpos ? ` (${rep.codpos})` : ""}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                  {isAdmin && (
                    <TerceroCdaEstado terceroId={rep.id} socioIdActivo={socioIdActivo} />
                  )}
                </TerceroCard>
              ))}
            </div>
          )}
        </div>
      )}

      <RepresentanteLegalModal
        sugerencias={sugerenciasPara(personasLegajo, representantes)}
        isOpen={modalOpen}
        onClose={cerrarModal}
        onSuccess={() => cargarSocios()}
        representante={editRepresentante}
        socioIdActivo={socioIdActivo}
      />
    </div>
  );
}
