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

// Solicitud de cualquiera de las empresas del vendor. Toda la fila abre el
// detalle; "Cancelar" (solo en curso) no lo dispara.
export function FilaSolicitudVendor({ solicitud, onVerDetalle, onCancelar }) {
  const { tono, Icono } = tonoDesde(solicitud.estado);
  const verDetalle = () => onVerDetalle(solicitud);

  return (
    <article
      className={`${styles.fila} ${tono}`}
      role="button"
      tabIndex={0}
      aria-label={`Ver detalle de la solicitud N° ${solicitud.id} de ${solicitud.empresaNombre}`}
      onClick={verDetalle}
      onKeyDown={alTeclado(verDetalle)}
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
        <span className={styles.btnDetalle} aria-hidden="true">
          Ver detalle <FiChevronRight />
        </span>
      </div>

      <FiChevronRight className={styles.filaChevron} aria-hidden="true" />
    </article>
  );
}

// Empresa vinculada. Toda la fila entra a la empresa; "Iniciar operación"
// la elige y abre directamente el alta de una operación.
export function FilaEmpresaVendor({ empresa, cantidadEnCurso, cantidadTotal, onAbrir, onIniciarOperacion }) {
  const abrir = () => onAbrir(empresa);
  const detalle =
    cantidadEnCurso > 0
      ? `${cantidadEnCurso} en curso`
      : cantidadTotal > 0
        ? `${cantidadTotal} ${cantidadTotal === 1 ? "solicitud cerrada" : "solicitudes cerradas"}`
        : "Sin solicitudes";

  return (
    <article
      className={`${styles.fila} ${styles.filaEmpresa}`}
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
        <h3 className={styles.filaNombre}>{empresa.nombre || "Cargando…"}</h3>
        <span className={styles.filaMeta}>
          {empresa.cuit ? `CUIT ${empresa.cuit} · ` : ""}
          {detalle}
        </span>
      </div>

      <div className={styles.filaAcciones}>
        <button
          type="button"
          className={styles.btnIniciar}
          onClick={sinPropagar(() => onIniciarOperacion(empresa))}
        >
          <FiPlus aria-hidden="true" />
          <span className={styles.btnIniciarLargo}>Iniciar operación</span>
          <span className={styles.btnIniciarCorto}>Iniciar</span>
        </button>
      </div>

      <FiChevronRight className={styles.filaChevronSiempre} aria-hidden="true" />
    </article>
  );
}
