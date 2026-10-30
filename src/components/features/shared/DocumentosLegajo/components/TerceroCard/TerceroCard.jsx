import React, { useId } from "react";
import { FiCheck, FiChevronDown, FiEdit2, FiTrash2 } from "react-icons/fi";
import s from "./TerceroCard.module.css";
import { inicialesDe } from "./terceroCardUtils";
import { EstadoRevisionChip } from "../EstadoRevisionChip/EstadoRevisionChip";
import { Skeleton } from "../../../../../ui/Skeleton/Skeleton";

// Cuántos faltantes se nombran en el chip antes de resumir con "+N": con la
// lista completa (hasta 6 en Accionistas) el chip ocupaba más que el nombre.
// El detalle entero queda en el title.
const FALTANTES_VISIBLES = 2;

const textoFaltantes = (faltantes) => {
  const visibles = faltantes.slice(0, FALTANTES_VISIBLES).join(", ");
  const resto = faltantes.length - FALTANTES_VISIBLES;
  return resto > 0 ? `${visibles} +${resto}` : visibles;
};

/**
 * Tarjeta de un tercero (accionista, representante, apoderado, agente de
 * bolsa o relación genérica). Cada sección sigue calculando sus propios
 * `faltantes`; acá solo se decide cómo se ven.
 *
 * - `validado={false}` para entidades sin chequeo de datos (agentes de bolsa):
 *   tarjeta neutra, sin chip de estado.
 * - `children` es el detalle desplegable; sin children la tarjeta no se expande.
 * - `participacion` + `colorParticipacion` solo los pasa Accionistas.
 */
export function TerceroCard({
  nombre,
  detalle,
  faltantes = [],
  cdaRechazado = false,
  isAdmin = false,
  validado = true,
  participacion,
  colorParticipacion,
  expanded = false,
  onToggle,
  onEdit,
  onDelete,
  editTitle,
  deleteTitle,
  children,
}) {
  const detalleId = useId();
  const expandible = Boolean(children);
  const tieneFaltantes = faltantes.length > 0;

  // El CDA rechazado manda sobre faltantes/completo (mismo criterio que la
  // tarjeta anterior). El cliente lo ve como "en revisión" en azul: no es
  // algo que pueda resolver solo, así que no lo pintamos como alerta.
  const estado = cdaRechazado
    ? isAdmin
      ? s.estadoRechazado
      : s.estadoRevision
    : !validado
      ? ""
      : tieneFaltantes
        ? s.estadoPendiente
        : s.estadoCompleto;

  const contenidoPrincipal = (
    <>
      <span className={s.avatar} aria-hidden="true">
        {inicialesDe(nombre)}
      </span>
      <span className={s.info}>
        <span className={s.nameRow}>
          <span className={s.name}>{nombre}</span>
          {cdaRechazado && (
            <span className={isAdmin ? s.revisionSlot : `${s.revisionSlot} ${s.revisionCliente}`}>
              <EstadoRevisionChip isAdmin={isAdmin} />
            </span>
          )}
          {validado && tieneFaltantes && (
            <span
              className={`${s.chip} ${s.chipFalta}`}
              title={`Faltan datos obligatorios: ${faltantes.join(", ")}`}
            >
              Falta: {textoFaltantes(faltantes)}
            </span>
          )}
          {validado && !tieneFaltantes && !cdaRechazado && (
            <span className={`${s.chip} ${s.chipOk}`}>
              <FiCheck size={11} strokeWidth={3} aria-hidden="true" /> Completo
            </span>
          )}
        </span>
        {detalle && <span className={s.sub}>{detalle}</span>}
      </span>
      {participacion !== undefined && (
        <span className={s.pct}>
          <i className={s.pctDot} style={{ background: colorParticipacion }} aria-hidden="true" />
          {participacion}%
        </span>
      )}
    </>
  );

  return (
    <div className={`${s.card} ${estado}`}>
      <div className={s.header}>
        {expandible ? (
          <button
            type="button"
            className={`${s.main} ${s.mainClickable}`}
            onClick={onToggle}
            aria-expanded={expanded}
            aria-controls={detalleId}
          >
            {contenidoPrincipal}
          </button>
        ) : (
          <div className={s.main}>{contenidoPrincipal}</div>
        )}

        <div className={s.actions}>
          {tieneFaltantes ? (
            <button type="button" className={s.btnEditarPendiente} onClick={onEdit} title={editTitle}>
              <FiEdit2 size={13} aria-hidden="true" /> Editar
              <span className={s.btnEditarDot} aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              className={`${s.iconBtn} ${isAdmin ? s.iconBtnEditAdmin : s.iconBtnEdit}`}
              onClick={onEdit}
              title={editTitle}
              aria-label={editTitle}
            >
              <FiEdit2 size={13} />
            </button>
          )}
          <button
            type="button"
            className={`${s.iconBtn} ${s.iconBtnDelete}`}
            onClick={onDelete}
            title={deleteTitle}
            aria-label={deleteTitle}
          >
            <FiTrash2 size={13} />
          </button>
          {expandible && (
            <button
              type="button"
              className={`${s.iconBtn} ${s.chevronBtn}`}
              onClick={onToggle}
              aria-expanded={expanded}
              aria-controls={detalleId}
              aria-label={expanded ? `Ocultar detalle de ${nombre}` : `Ver detalle de ${nombre}`}
            >
              <FiChevronDown size={15} className={`${s.chevron} ${expanded ? s.chevronOpen : ""}`} />
            </button>
          )}
        </div>
      </div>

      {expandible && (
        <div id={detalleId} className={`${s.expand} ${expanded ? s.expandOpen : ""}`} inert={!expanded}>
          <div className={s.expandInner}>
            <div className={s.expandBody}>{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// Estado vacío compartido: la acción de alta sigue viviendo en el botón del
// header (portal), acá solo se explica qué falta.
export function TerceroEmpty({ icon, titulo, hint }) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon} aria-hidden="true">
        {icon}
      </span>
      <p className={s.emptyTitle}>{titulo}</p>
      {hint && <span className={s.emptyHint}>{hint}</span>}
    </div>
  );
}

// Carga inicial de la lista: tarjetas fantasma con la misma forma que
// TerceroCard (regla de Skeleton: el Spinner queda para acciones en curso).
// `conResumen` agrega el bloque de participación de Accionistas.
export function TerceroSkeleton({ conResumen = false, cantidad = 3 }) {
  return (
    <div className={s.lista} aria-busy="true" aria-label="Cargando">
      {conResumen && (
        <div className={s.skeletonResumen}>
          <div className={s.skeletonFila}>
            <Skeleton width="10rem" height="0.8rem" radius="0.4rem" />
            <Skeleton width="6rem" height="0.8rem" radius="0.4rem" />
          </div>
          <Skeleton width="100%" height="0.5rem" radius="pill" />
        </div>
      )}
      {Array.from({ length: cantidad }).map((_, i) => (
        <div key={i} className={s.skeletonCard}>
          <Skeleton width="2.25rem" height="2.25rem" radius="0.7rem" />
          <div className={s.skeletonTexto}>
            <Skeleton width={i % 2 ? "45%" : "60%"} height="0.85rem" radius="0.4rem" />
            <Skeleton width="30%" height="0.7rem" radius="0.4rem" />
          </div>
          <Skeleton width="2rem" height="2rem" radius="0.6rem" />
          <Skeleton width="2rem" height="2rem" radius="0.6rem" />
        </div>
      ))}
    </div>
  );
}
