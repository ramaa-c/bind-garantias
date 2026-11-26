import React, { useState } from "react";
import { createPortal } from "react-dom";
import { FiUsers, FiPlus, FiMail, FiPhone, FiMapPin, FiPercent } from "react-icons/fi";
import styles from "../../DocumentosLegajo.module.css";
import s from "../TerceroCard/TerceroCard.module.css";
import { TerceroCard, TerceroEmpty, TerceroSkeleton } from "../TerceroCard/TerceroCard";
import { colorParticipacion, ordenarPendientesPrimero, sugerenciasPara } from "../TerceroCard/terceroCardUtils";
import { SocioAccionistaModal } from "../SocioAccionistaModal/SocioAccionistaModal";
import { TerceroCdaEstado } from "../TerceroCdaEstado/TerceroCdaEstado";
import { useEstadoCdaTerceros } from "../../../../../../hooks/useTerceros";
import { usePortalTarget } from "../../../../../../hooks/usePortalTarget";
import { AvisoRevisionTercero } from "../EstadoRevisionChip/EstadoRevisionChip";
import { useDocumentacionTerceros } from "../DocumentacionTercero/documentacionTercerosContext";
import { RELACION_ACCIONISTA_ID } from "../../../../../../constants/tiposRelacionSocio";

// Contacto + domicilio + CUIT. La documentación (DNI frente y dorso por
// defecto, más lo que la cadena configure para accionistas) se suma aparte
// con useDocumentacionTerceros.
const calcularFaltantes = (socio) => {
  const faltantes = [];
  const sEmail = socio.email || socio.mail || socio.Mail || "";
  const sCel = socio.celular || socio.telefono || socio.Telefono || "";
  const sDir = socio.direccion || socio.calle || "";
  const sProv = socio.provincia || socio.provinciaid || "";

  if (!sEmail) faltantes.push("Email");
  if (!sCel) faltantes.push("Teléfono");
  if (!sDir || !sProv) faltantes.push("Domicilio completo");

  const cuitLimpio = String(socio.cuit || "").replace(/\D/g, "");
  if (!cuitLimpio) faltantes.push("CUIT válido");
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
  personasLegajo = [],
}) {
  const [modalAccionistaOpen, setModalAccionistaOpen] = useState(false);
  const [editAccionista, setEditAccionista] = useState(null);
  const [expandedSocio, setExpandedSocio] = useState(null);
  // "Editar" abre la pestaña Datos; "Documentación", la pestaña Documentación.
  const [pestanaInicial, setPestanaInicial] = useState("datos");
  const portalTarget = usePortalTarget("socios-header-action-portal");
  const isAdmin =
    typeof window !== "undefined" && window.location.pathname.includes("/admin");

  const { data: estadoCdaMap } = useEstadoCdaTerceros(accionistas.map((a) => a.id), cadenaValorId);

  // De mayor a menor participación: la barra, la leyenda y la lista siguen
  // el mismo orden, y el color se fija por esta posición para que cada
  // tarjeta coincida con su segmento. ordenarPendientesPrimero es estable,
  // así que dentro de "pendientes" y de "completos" se mantiene este orden.
  const accionistasPorParticipacion = [...accionistas].sort(
    (a, b) => (Number(b.participacion) || 0) - (Number(a.participacion) || 0),
  );
  const documentacion = useDocumentacionTerceros(RELACION_ACCIONISTA_ID);
  const entradas = ordenarPendientesPrimero(
    accionistasPorParticipacion.map((socio, i) => {
      const docs = documentacion.resumenDe(socio);
      return {
      socio,
      docs,
      faltantes: [...calcularFaltantes(socio), ...(docs?.faltantes || [])],
      cdaRechazado: estadoCdaMap?.get(Number(socio.id)) === "rechazado",
      cdaPendiente: estadoCdaMap?.get(Number(socio.id)) === "pendiente",
      color: colorParticipacion(i),
      };
    }),
  );

  return (
    <div className={styles.sociosContainer}>
      {loadingSocios ? (
        <TerceroSkeleton conResumen />
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
            accionistas={accionistasPorParticipacion}
          />

          {accionistas.length === 0 ? (
            <TerceroEmpty
              icon={<FiUsers size={20} />}
              titulo="Todavía no cargaste accionistas"
              hint="Sumá a las personas o empresas que tienen participación en tu empresa."
            />
          ) : (
            <div className={s.lista}>
              {entradas.map(({ socio, docs, faltantes, cdaRechazado, cdaPendiente, color }) => (
                <TerceroCard
                  key={socio.id}
                  nombre={socio.nombre}
                  detalle={`CUIT ${socio.cuit}`}
                  faltantes={faltantes}
                  cdaRechazado={cdaRechazado}
                  cdaPendiente={cdaPendiente}
                  isAdmin={isAdmin}
                  participacion={socio.participacion}
                  colorParticipacion={color}
                  expanded={expandedSocio === socio.id}
                  onToggle={() =>
                    setExpandedSocio(expandedSocio === socio.id ? null : socio.id)
                  }
                  onEdit={() => {
                    setEditAccionista(socio);
                    setPestanaInicial("datos");
                    setModalAccionistaOpen(true);
                  }}
                  onDelete={() => handleEliminarRelacion(socio)}
                  documentacion={docs}
                  onDocumentacion={() => {
                    setEditAccionista(socio);
                    setPestanaInicial("documentacion");
                    setModalAccionistaOpen(true);
                  }}
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
        pestanaInicial={pestanaInicial}
        sugerencias={sugerenciasPara(personasLegajo, accionistas)}
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
