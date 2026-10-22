import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiUser, FiPlus, FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";
import s from "../TerceroCard/TerceroCard.module.css";
import { TerceroCard, TerceroEmpty, TerceroSkeleton } from "../TerceroCard/TerceroCard";
import { ordenarPendientesPrimero } from "../TerceroCard/terceroCardUtils";
import { RepresentanteModal } from "../../../RepresentanteModal/RepresentanteModal";
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
  evitarCoincidenciaCon,
  cadenaValorId,
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [expandedItem, setExpandedItem] = useState(null);
  const portalTarget = usePortalTarget("socios-header-action-portal");
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");

  const { data: estadoCdaMap } = useEstadoCdaTerceros(items.map((r) => r.id), cadenaValorId);

  const entradas = ordenarPendientesPrimero(
    items.map((item) => ({
      item,
      faltantes: calcularFaltantes(item),
      cdaRechazado: estadoCdaMap?.get(Number(item.id)) === "rechazado",
    })),
  );

  const abrirModal = (item = null) => {
    setEditItem(item);
    setModalOpen(true);
  };
  const cerrarModal = () => {
    setModalOpen(false);
    setEditItem(null);
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
              title={`Agregar ${titulo}`}
            >
              <FiPlus size={14} />
              <span className={styles.addButtonLabel}>Agregar {titulo}</span>
            </button>,
            portalTarget
          )}

          {items.length === 0 ? (
            <TerceroEmpty
              icon={<FiUser size={20} />}
              titulo={`Todavía no cargaste a nadie como ${titulo}`}
              hint={`Usá «Agregar ${titulo}» para dar de alta el primero.`}
            />
          ) : (
            <div className={s.lista}>
              {entradas.map(({ item, faltantes, cdaRechazado }) => (
                <TerceroCard
                  key={item.id}
                  nombre={item.nombre}
                  detalle={`CUIT ${item.cuit}`}
                  faltantes={faltantes}
                  cdaRechazado={cdaRechazado}
                  isAdmin={isAdmin}
                  expanded={expandedItem === item.id}
                  onToggle={() =>
                    setExpandedItem(expandedItem === item.id ? null : item.id)
                  }
                  onEdit={() => abrirModal(item)}
                  onDelete={() => handleEliminarRelacion(item)}
                  editTitle={`Editar ${titulo}`}
                  deleteTitle={`Eliminar ${titulo}`}
                >
                  {cdaRechazado && !isAdmin && <AvisoRevisionTercero />}
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
                    <TerceroCdaEstado terceroId={item.id} socioIdActivo={socioIdActivo} />
                  )}
                </TerceroCard>
              ))}
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
        evitarCoincidenciaCon={evitarCoincidenciaCon}
        itemsExistentes={items}
      />
    </div>
  );
}
