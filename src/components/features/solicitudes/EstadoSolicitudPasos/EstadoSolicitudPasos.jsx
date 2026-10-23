import React from "react";
import { FiCheck, FiX, FiMinus } from "react-icons/fi";
import styles from "./EstadoSolicitudPasos.module.css";

const normalizarEstado = (estado) => {
  const e = String(estado || "").toLowerCase();
  if (e.includes("aprob")) return "aprobada";
  if (e.includes("rechaz")) return "rechazada";
  if (e.includes("cancel")) return "cancelada";
  if (e.includes("venc")) return "vencida";
  return "pendiente";
};

const armarPasosSolicitud = (estado, fecha) => {
  const actual = normalizarEstado(estado);
  const enviada = {
    key: "enviada",
    label: "Solicitud enviada",
    ayuda: fecha ? `El ${fecha}` : "Recibimos tu pedido",
    tono: "hecho",
  };

  if (actual === "cancelada" || actual === "vencida") {
    return [
      enviada,
      {
        key: "cierre",
        label: actual === "cancelada" ? "Cancelada" : "Vencida",
        ayuda: actual === "cancelada" ? "La cancelaste antes de que se resolviera" : "Pasó el plazo sin resolverse",
        tono: "cancelado",
      },
    ];
  }

  if (actual === "rechazada") {
    return [
      enviada,
      { key: "evaluacion", label: "Evaluada", ayuda: "BIND Garantías revisó tu solicitud", tono: "hecho" },
      { key: "resultado", label: "Rechazada", ayuda: "Mirá el motivo en el detalle", tono: "error" },
    ];
  }

  const aprobada = actual === "aprobada";
  return [
    enviada,
    {
      key: "evaluacion",
      label: aprobada ? "Evaluada" : "En evaluación",
      ayuda: aprobada ? "BIND Garantías revisó tu solicitud" : "BIND Garantías está revisando tu solicitud",
      tono: aprobada ? "hecho" : "actual",
    },
    {
      key: "aprobada",
      label: "Aprobada",
      ayuda: aprobada ? "Tu línea fue aprobada" : "Te avisamos cuando se resuelva",
      tono: aprobada ? "hecho" : "pendiente",
    },
    {
      key: "activa",
      label: "Línea activa",
      ayuda: aprobada ? "Estamos dejándola lista para operar" : "Lista para operar",
      tono: aprobada ? "actual" : "pendiente",
    },
  ];
};

const IconoPaso = ({ tono, numero }) => {
  if (tono === "hecho") return <FiCheck />;
  if (tono === "error") return <FiX />;
  if (tono === "neutro" || tono === "cancelado") return <FiMinus />;
  return <span>{numero}</span>;
};

export const EstadoSolicitudPasos = ({ estado, fecha, orientacion = "horizontal", className = "" }) => {
  const pasos = armarPasosSolicitud(estado, fecha);
  const cerrada = pasos[pasos.length - 1]?.tono === "cancelado";

  return (
    <ol
      className={`${styles.pasos} ${orientacion === "vertical" ? styles.vertical : styles.horizontal} ${cerrada ? styles.cerrada : ""} ${className}`}
      aria-label="Estado de la solicitud"
    >
      {pasos.map((paso, i) => (
        <li
          key={paso.key}
          className={`${styles.paso} ${styles[`tono_${paso.tono}`]}`}
          aria-current={paso.tono === "actual" ? "step" : undefined}
        >
          <span className={styles.marcador} aria-hidden="true">
            <IconoPaso tono={paso.tono} numero={i + 1} />
          </span>
          <span className={styles.texto}>
            <span className={styles.label}>{paso.label}</span>
            <span className={styles.ayuda}>{paso.ayuda}</span>
          </span>
        </li>
      ))}
    </ol>
  );
};

export default EstadoSolicitudPasos;
