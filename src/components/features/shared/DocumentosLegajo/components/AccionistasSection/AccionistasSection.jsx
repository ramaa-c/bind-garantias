import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiUsers, FiPlus, FiMail, FiPhone, FiMapPin, FiPercent } from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";
import s from "../TerceroCard/TerceroCard.module.css";
import { TerceroCard, TerceroEmpty } from "../TerceroCard/TerceroCard";
import { colorParticipacion, ordenarPendientesPrimero } from "../TerceroCard/terceroCardUtils";
import { SocioAccionistaModal } from "../SocioAccionistaModal/SocioAccionistaModal";
import { TerceroCdaEstado } from "../TerceroCdaEstado/TerceroCdaEstado";
import { Spinner } from "../../../../../ui";
import { useEstadoCdaTerceros } from "../../../../../../hooks/useTerceros";
import { usePortalTarget } from "../../../../../../hooks/usePortalTarget";
import { AvisoRevisionTercero } from "../EstadoRevisionChip/EstadoRevisionChip";

const normalizarTexto = (str) =>
  String(str || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toUpperCase();

// Mismo chequeo que tenía la tarjeta: contacto + domicilio + CUIT y, con CUIT,
// las fotos de DNI frente (tipo 8) y dorso (tipo 9) buscadas por CUIT o nombre
// en la descripción del archivo.
const calcularFaltantes = (socio, archivosBackend) => {
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
  return faltantes;
};

// Barra apilada (un segmento por accionista, mismo color que el cuadradito
// de su tarjeta) en vez de una sola barra de progreso: así se ve de un
// vistazo cómo se reparte el 100%, no solo cuánto falta.
function ParticipacionResumen({ totalParticipacion, accionistas }) {
  const total = Number(totalParticipacion) || 0;
  const completo = total === 100;
  const restante = Math.max(0, 100 - total);

  return (
    <div className={s.resumen}>
      <div className={s.resumenHead}>
        <span className={s.resumenLabel}>Participación asignada</span>
        <span className={s.resumenValor}>
          <strong className={completo ? s.resumenOk : s.resumenPendiente}>{total}%</strong>{" "}
          de 100%{total < 100 ? ` · faltan ${restante}%` : ""}
        </span>
      </div>
      <div
        className={s.barra}
        role="img"
        aria-label={`Participación asignada: ${total}% de 100%`}
      >
        {accionistas.map((socio, i) => {
          const pct = Number(socio.participacion) || 0;
          if (pct <= 0) return null;
          return (
            <span
              key={socio.id}
              className={s.barraSegmento}
              style={{ flexGrow: pct, background: colorParticipacion(i) }}
            />
          );
        })}
        {restante > 0 && <span className={s.barraResto} style={{ flexGrow: restante }} />}
      </div>
      {accionistas.length > 0 && (
        <ul className={s.leyenda}>
          {accionistas.map((socio, i) => (
            <li key={socio.id} className={s.leyendaItem}>
              <i className={s.leyendaSwatch} style={{ background: colorParticipacion(i) }} aria-hidden="true" />
              <span className={s.leyendaNombre}>{socio.nombre}</span>
              <span>{socio.participacion}%</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function AccionistasSection({
  loadingSocios,
  totalParticipacion,
  accionistas,
  handleEliminarRelacion,
  cargarSocios,
  socioIdActivo,
  archivosBackend,
  cargandoArchivos = false,
  dniTerceros,
  cadenaValorId,
}) {
  const [modalAccionistaOpen, setModalAccionistaOpen] = useState(false);
  const [editAccionista, setEditAccionista] = useState(null);
  const [expandedSocio, setExpandedSocio] = useState(null);
  const portalTarget = usePortalTarget("socios-header-action-portal");
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");

  const { data: estadoCdaMap } = useEstadoCdaTerceros(accionistas.map((a) => a.id), cadenaValorId);

  // El color se fija con el índice original (antes de ordenar) para que
  // coincida con el segmento de la barra.
  const entradas = ordenarPendientesPrimero(
    accionistas.map((socio, i) => ({
      socio,
      faltantes: calcularFaltantes(socio, archivosBackend),
      cdaRechazado: estadoCdaMap?.get(Number(socio.id)) === "rechazado",
      color: colorParticipacion(i),
    })),
  );

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

          <ParticipacionResumen
            totalParticipacion={totalParticipacion}
            accionistas={accionistas}
          />

          {accionistas.length === 0 ? (
            <TerceroEmpty
              icon={<FiUsers size={20} />}
              titulo="Todavía no cargaste accionistas"
              hint="Sumá a las personas o empresas que tienen participación en tu empresa."
            />
          ) : (
            <div className={s.lista}>
              {entradas.map(({ socio, faltantes, cdaRechazado, color }) => (
                <TerceroCard
                  key={socio.id}
                  nombre={socio.nombre}
                  detalle={`CUIT ${socio.cuit}`}
                  faltantes={faltantes}
                  cdaRechazado={cdaRechazado}
                  isAdmin={isAdmin}
                  participacion={socio.participacion}
                  colorParticipacion={color}
                  expanded={expandedSocio === socio.id}
                  onToggle={() =>
                    setExpandedSocio(expandedSocio === socio.id ? null : socio.id)
                  }
                  onEdit={() => {
                    setEditAccionista(socio);
                    setModalAccionistaOpen(true);
                  }}
                  onDelete={() => handleEliminarRelacion(socio)}
                  editTitle="Editar Accionista"
                  deleteTitle="Eliminar Accionista"
                >
                  {cdaRechazado && !isAdmin && <AvisoRevisionTercero />}
                  <div className={styles.socioDetailGrid}>
                    {socio.email && (
                      <div className={styles.socioDetail}>
                        <FiMail className={styles.socioDetailIcon} />
                        <div>
                          <span className={styles.socioDetailLabel}>Email</span>
                          <span className={styles.socioDetailVal}>{socio.email}</span>
                        </div>
                      </div>
                    )}
                    {socio.telefono && (
                      <div className={styles.socioDetail}>
                        <FiPhone className={styles.socioDetailIcon} />
                        <div>
                          <span className={styles.socioDetailLabel}>Teléfono</span>
                          <span className={styles.socioDetailVal}>{socio.telefono}</span>
                        </div>
                      </div>
                    )}
                    {socio.direccion && (
                      <div className={styles.socioDetail}>
                        <FiMapPin className={styles.socioDetailIcon} />
                        <div>
                          <span className={styles.socioDetailLabel}>Dirección</span>
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
                        <span className={styles.socioDetailLabel}>Participación</span>
                        <span className={styles.socioDetailVal}>{socio.participacion}%</span>
                      </div>
                    </div>
                  </div>
                  {isAdmin && (
                    <TerceroCdaEstado terceroId={socio.id} socioIdActivo={socioIdActivo} />
                  )}
                </TerceroCard>
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
        cargandoArchivos={cargandoArchivos}
        accionistas={accionistas}
        dniTerceros={dniTerceros}
      />
    </div>
  );
}
