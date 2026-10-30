import React from "react";
import { FiChevronRight, FiCheckCircle, FiClock, FiXCircle, FiSlash, FiPlus } from "react-icons/fi";
import { obtenerInicialesEmpresa } from "../../../../utils/empresaAvatar";
import styles from "./SeleccionarEmpresa.module.css";

const tonoDesde = (estado) => {
  const e = String(estado || "").toLowerCase();
  if (e.includes("aprob")) return { tono: styles.tonoAprobada, Icono: FiCheckCircle };
  if (e.includes("rechaz")) return { tono: styles.tonoRechazada, Icono: FiXCircle };
  if (e.includes("cancel") || e.includes("venc")) return { tono: styles.tonoCancelada, Icono: FiSlash };
  return { tono: styles.tonoEnCurso, Icono: FiClock };
};

const alTeclado = (accion) => (e) => {
  if (e.target !== e.currentTarget) return;
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    accion();
  }
};

const sinPropagar = (accion) => (e) => {
  e.stopPropagation();
  accion();
};

// Solicitud de cualquiera de las empresas del vendor. Toda la fila entra a la
// empresa; "Ver detalle" y "Cancelar" (solo en curso) no lo disparan.
export function FilaSolicitudVendor({ solicitud, onEntrar, onVerDetalle, onCancelar }) {
  const { tono, Icono } = tonoDesde(solicitud.estado);
  const entrar = () => onEntrar(solicitud);

  return (
    <article
      className={`${styles.fila} ${tono}`}
      role="button"
      tabIndex={0}
      aria-label={`Entrar a ${solicitud.empresaNombre}`}
      onClick={entrar}
      onKeyDown={alTeclado(entrar)}
    >
      <span className={styles.avatar} aria-hidden="true">
        {obtenerInicialesEmpresa(solicitud.empresaNombre || "?")}
      </span>

      <div className={styles.filaInfo}>
        <div className={styles.filaTitulo}>
          <h3 className={styles.filaNombre}>{solicitud.empresaNombre}</h3>
          <span className={`${styles.pill} ${styles.pillEscritorio}`}>
            <Icono aria-hidden="true" />
            {solicitud.estado}
          </span>
        </div>
        <span className={styles.filaMeta}>
          {solicitud.tipo || "Operación"} · N° {solicitud.id}
          <span className={styles.metaFecha}> · {solicitud.fecha || "-"}</span>
        </span>
      </div>

      <span className={styles.lado}>
        <span className={styles.monto}>
          <span className={styles.moneda}>{solicitud.moneda}</span> {solicitud.monto}
        </span>
        <span className={`${styles.pill} ${styles.pillMovil}`}>
          <Icono aria-hidden="true" />
          {solicitud.estado}
        </span>
      </span>

      <div className={styles.filaAcciones}>
        {onCancelar && (
          <button type="button" className={styles.btnCancelar} onClick={sinPropagar(() => onCancelar(solicitud))}>
            Cancelar
          </button>
        )}
        <button
          type="button"
          className={styles.btnDetalle}
          onClick={sinPropagar(() => onVerDetalle(solicitud))}
          aria-label={`Ver detalle de la solicitud N° ${solicitud.id}`}
        >
          Ver detalle <FiChevronRight aria-hidden="true" />
        </button>
      </div>

      <FiChevronRight className={styles.filaChevron} aria-hidden="true" />
    </article>
  );
}

// Empresa vinculada. Toda la fila entra a la empresa; "Iniciar operación"
// la elige y abre directamente el alta de una operación.
export function FilaEmpresaVendor({ empresa, cantidadEnCurso, cantidadTotal, onAbrir, onVerSolicitud, onIniciarOperacion }) {
  const abrir = () => onAbrir(empresa);
  const enCurso = cantidadEnCurso > 0;
  const nueva = cantidadTotal === 0;
  // Tres estados que se distinguen a simple vista: con solicitud en curso
  // (franja, avatar y etiqueta ámbar; la acción es verla), sin ninguna
  // solicitud todavía (etiqueta neutra) y con solicitudes ya cerradas.
  // La etiqueta ya dice el estado: abajo solo lo que agrega información.
  const detalle = enCurso
    ? cantidadEnCurso > 1
      ? `${cantidadEnCurso} en curso`
      : ""
    : nueva
      ? ""
      : `${cantidadTotal} ${cantidadTotal === 1 ? "solicitud cerrada" : "solicitudes cerradas"}`;

  return (
    <article
      className={`${styles.fila} ${styles.filaEmpresa} ${enCurso ? `${styles.tonoEnCurso} ${styles.empresaEnCurso}` : ""}`}
      role="button"
      tabIndex={0}
      aria-label={`Entrar a ${empresa.nombre}`}
      onClick={abrir}
      onKeyDown={alTeclado(abrir)}
    >
      <span className={styles.avatar} aria-hidden="true">
        {obtenerInicialesEmpresa(empresa.nombre || "?")}
      </span>

      <div className={styles.filaInfo}>
        <div className={styles.filaTitulo}>
          <h3 className={styles.filaNombre}>{empresa.nombre || "Cargando…"}</h3>
          {enCurso && (
            <span className={styles.pill}>
              <FiClock aria-hidden="true" />
              Solicitud en curso
            </span>
          )}
          {nueva && <span className={`${styles.pill} ${styles.pillNueva}`}>Sin solicitudes</span>}
        </div>
        <span className={styles.filaMeta}>
          {[empresa.cuit && `CUIT ${empresa.cuit}`, detalle].filter(Boolean).join(" · ")}
        </span>
      </div>

      <div className={styles.filaAcciones}>
        {enCurso ? (
          <button type="button" className={styles.btnVer} onClick={sinPropagar(() => onVerSolicitud(empresa))}>
            <span className={styles.btnIniciarLargo}>Ver solicitud</span>
            <span className={styles.btnIniciarCorto}>Ver</span>
          </button>
        ) : (
          <button
            type="button"
            className={styles.btnIniciar}
            onClick={sinPropagar(() => onIniciarOperacion(empresa))}
          >
            <FiPlus aria-hidden="true" />
            <span className={styles.btnIniciarLargo}>Iniciar operación</span>
            <span className={styles.btnIniciarCorto}>Iniciar</span>
          </button>
        )}
      </div>

      <FiChevronRight className={styles.filaChevronSiempre} aria-hidden="true" />
    </article>
  );
}
