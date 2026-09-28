import React, { useState } from "react";
import {
  FiType,
  FiHash,
  FiList,
  FiToggleLeft,
  FiCalendar,
  FiZap,
  FiCompass,
  FiChevronDown,
  FiAlertTriangle,
  FiCheckCircle,
} from "react-icons/fi";
import styles from "./ReglaAsistente.module.css";
import { VALORES_SUGERIDOS } from "../../../../utils/reglaAsistente";

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const NUMERO_REGEX = /^-?\d+([.,]\d+)?$/;

const OPERADORES = {
  "=": "es igual a",
  "<>": "es distinto de",
  ">": "es mayor que",
  "<": "es menor que",
  ">=": "es mayor o igual que",
  "<=": "es menor o igual que",
};

const TIPOS = {
  texto: {
    label: "Texto",
    icono: FiType,
    como: "Escribí la palabra tal cual. Las comillas se agregan solas.",
  },
  numero: {
    label: "Número",
    icono: FiHash,
    como: "Solo dígitos, sin comillas ni separador de miles.",
  },
  cantidad: {
    label: "Cantidad",
    icono: FiList,
    como: "Cuenta cuántos elementos hay en la lista. Usá un número entero.",
  },
  booleano: {
    label: "Sí / No",
    icono: FiToggleLeft,
    como: "Escribí true o false, sin comillas.",
  },
  fecha: {
    label: "Fecha",
    icono: FiCalendar,
    como: "Formato AAAA-MM-DD, sin comillas.",
  },
  funcion: {
    label: "Función",
    icono: FiZap,
    como: "No lleva operador ni valor: da verdadero o falso según el CUIT.",
  },
};

const GUIA_GENERAL = [
  { tipo: "texto", ejemplo: "= JURIDICA" },
  { tipo: "numero", ejemplo: "> 500" },
  { tipo: "cantidad", ejemplo: "> 0" },
  { tipo: "booleano", ejemplo: "= true" },
  { tipo: "fecha", ejemplo: "> 2026-01-01" },
];

const hoyISO = () => new Date().toLocaleDateString("sv-SE");

const nombreCorto = (expresion) => {
  const ultimo = expresion.split(".").filter(Boolean).pop() || expresion;
  return ultimo;
};

const armarSugerencias = ({ tipo, expresion, integracion, ejemplo }) => {
  const path = expresion.trim().toLowerCase();
  if (tipo === "cantidad") {
    return [
      { simbolo: ">", valor: "0", etiqueta: "Tiene al menos uno" },
      { simbolo: "=", valor: "0", etiqueta: "No tiene ninguno" },
      { simbolo: ">=", valor: "2", etiqueta: "Tiene dos o más" },
    ];
  }
  if (tipo === "booleano") {
    return [
      { simbolo: "=", valor: "true", etiqueta: "Se cumple" },
      { simbolo: "=", valor: "false", etiqueta: "No se cumple" },
    ];
  }
  if (tipo === "fecha") {
    const hoy = hoyISO();
    return [
      { simbolo: ">", valor: hoy, etiqueta: "Posterior a hoy" },
      { simbolo: "<", valor: hoy, etiqueta: "Anterior a hoy" },
    ];
  }
  if (tipo === "numero") {
    const sugerencias = [
      { simbolo: ">", valor: "0", etiqueta: "Mayor que cero" },
      { simbolo: "=", valor: "0", etiqueta: "Igual a cero" },
    ];
    if (ejemplo !== undefined && ejemplo !== null && NUMERO_REGEX.test(String(ejemplo))) {
      sugerencias.push({ simbolo: "=", valor: String(ejemplo), etiqueta: `Igual al ejemplo (${ejemplo})` });
    }
    return sugerencias;
  }
  if (tipo === "texto") {
    const conocidos = VALORES_SUGERIDOS[path];
    if (conocidos) {
      return conocidos.map((valor) => ({ simbolo: "=", valor, etiqueta: `Es ${valor}` }));
    }
    if (ejemplo && String(ejemplo).trim() !== "" && String(ejemplo).length <= 30) {
      const valor = integracion === "ARCA" ? String(ejemplo).toUpperCase() : String(ejemplo);
      return [
        { simbolo: "=", valor, etiqueta: `Igual al ejemplo (${valor})` },
        { simbolo: "<>", valor, etiqueta: "Distinto del ejemplo" },
      ];
    }
  }
  return [];
};

const armarAdvertencia = ({ tipo, simbolo, valor, comparaPorVacio }) => {
  if (!tipo || tipo === "funcion") return null;
  const limpio = String(valor ?? "").trim();
  if (comparaPorVacio || limpio === "") return null;
  if ((tipo === "numero" || tipo === "cantidad") && !NUMERO_REGEX.test(limpio)) {
    return "Este campo es numérico: el valor tiene que ser un número.";
  }
  if (tipo === "booleano" && !/^(true|false)$/i.test(limpio)) {
    return "Este campo es de tipo sí/no: el valor tiene que ser true o false.";
  }
  if (tipo === "fecha" && !FECHA_REGEX.test(limpio)) {
    return "Este campo es una fecha: usá el formato AAAA-MM-DD.";
  }
  if (tipo === "texto" && [">", "<", ">=", "<="].includes(simbolo)) {
    return "Con texto conviene usar = o <>; los demás operadores comparan orden alfabético.";
  }
  return null;
};

export function ReglaAsistente({
  integracion,
  expresion,
  tipo,
  simbolo,
  valor,
  comparaPorVacio,
  ejemplo,
  descripcion,
  funcionSgrPlus,
  onAplicar,
  disabled,
}) {
  const [abierto, setAbierto] = useState(false);
  const tieneExpresion = expresion.trim() !== "";
  const info = tipo ? TIPOS[tipo] : null;
  const Icono = info?.icono || FiCompass;
  const sugerencias = tipo ? armarSugerencias({ tipo, expresion, integracion, ejemplo }) : [];
  const advertencia = armarAdvertencia({ tipo, simbolo, valor, comparaPorVacio });

  const valorMostrado = comparaPorVacio ? "vacío" : String(valor ?? "").trim();
  const puedeResumir = tipo && tipo !== "funcion" && valorMostrado !== "";

  return (
    <div className={styles.asistente}>
      <button
        type="button"
        className={styles.cabecera}
        onClick={() => setAbierto((prev) => !prev)}
        aria-expanded={abierto}
      >
        <span className={styles.iconoCabecera}>
          <Icono size={15} />
        </span>
        <span className={styles.tituloCabecera}>Guía de la regla</span>
        {info && <span className={styles.badgeTipo}>{info.label}</span>}
        <FiChevronDown
          className={`${styles.chevron} ${abierto ? styles.chevronAbierto : ""}`}
          size={16}
        />
      </button>

      {abierto && (
        <div className={styles.cuerpo}>
          {!tieneExpresion && (
            <>
              <p className={styles.texto}>
                Elegí un campo en el paso 1 o escribí la expresión y te digo cómo completar el operador y el valor.
              </p>
              <ul className={styles.guiaGeneral}>
                {GUIA_GENERAL.map((g) => {
                  const IconoTipo = TIPOS[g.tipo].icono;
                  return (
                    <li key={g.tipo} className={styles.guiaItem}>
                      <IconoTipo size={13} className={styles.guiaIcono} />
                      <span className={styles.guiaTipo}>{TIPOS[g.tipo].label}</span>
                      <code className={styles.codigo}>{g.ejemplo}</code>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {tieneExpresion && tipo === "funcion" && (
            <>
              <p className={styles.texto}>
                {descripcion || info.como}
              </p>
              <p className={styles.textoSuave}>
                Resultado: <strong>202</strong> si la empresa cumple, <strong>406</strong> si no.
                {funcionSgrPlus ? ` Origen de los datos: ${funcionSgrPlus.origen}.` : ""}
              </p>
            </>
          )}

          {tieneExpresion && tipo && tipo !== "funcion" && (
            <>
              <p className={styles.texto}>
                <code className={styles.codigo}>{nombreCorto(expresion)}</code> es de tipo{" "}
                <strong>{info.label.toLowerCase()}</strong>. {info.como}
                {integracion === "ARCA" && tipo === "texto" ? " ARCA compara en MAYÚSCULAS: se convierte solo." : ""}
              </p>
              {descripcion && <p className={styles.textoSuave}>{descripcion}</p>}

              {sugerencias.length > 0 && (
                <div className={styles.bloque}>
                  <span className={styles.etiqueta}>Probá con un ejemplo</span>
                  <div className={styles.fila}>
                    {sugerencias.map((s) => (
                      <button
                        key={`${s.simbolo}-${s.valor}`}
                        type="button"
                        className={styles.chipEjemplo}
                        onClick={() => onAplicar({ simbolo: s.simbolo, valor: s.valor })}
                        disabled={disabled}
                        title={`Completar: ${s.simbolo} ${s.valor}`}
                      >
                        <code>{s.simbolo} {s.valor}</code>
                        <span>{s.etiqueta}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {puedeResumir && !advertencia && (
                <p className={styles.resumen}>
                  <FiCheckCircle size={14} />
                  <span>
                    Se cumple cuando <strong>{nombreCorto(expresion)}</strong> {OPERADORES[simbolo] || simbolo}{" "}
                    <strong>{valorMostrado}</strong>.
                  </span>
                </p>
              )}
            </>
          )}

          {tieneExpresion && !tipo && (
            <>
              <p className={styles.texto}>
                No reconozco este campo (puede que lo hayas escrito a mano). Probalo en el Laboratorio: el
                <strong> Valor resuelto</strong> te muestra qué devuelve y así sabés si es texto, número o fecha.
              </p>
              <ul className={styles.guiaGeneral}>
                {GUIA_GENERAL.map((g) => {
                  const IconoTipo = TIPOS[g.tipo].icono;
                  return (
                    <li key={g.tipo} className={styles.guiaItem}>
                      <IconoTipo size={13} className={styles.guiaIcono} />
                      <span className={styles.guiaTipo}>{TIPOS[g.tipo].label}</span>
                      <code className={styles.codigo}>{g.ejemplo}</code>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {advertencia && (
            <p className={styles.advertencia} role="alert">
              <FiAlertTriangle size={14} />
              <span>{advertencia}</span>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default ReglaAsistente;
