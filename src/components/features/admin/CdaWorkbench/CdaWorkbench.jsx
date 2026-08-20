import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { useCrearCda, useActualizarCda, useProbarCda } from "../../../../hooks/useCda";
import { useUsuarioWebIdActual } from "../../../../hooks/useUsuario";
import { INTEGRACIONES_MOCKS } from "../../../../utils/integracionesMocks";
import { Button } from "../../../ui/Button/Button";
import { InputSimple } from "../../../ui/InputSimple/InputSimple";
import { SelectSimple } from "../../../ui/SelectSimple/SelectSimple";
import { ConfirmacionModal } from "../../shared/ConfirmacionModal/ConfirmacionModal";
import { FiCheck, FiChevronDown, FiArrowLeft, FiTrash2, FiX, FiInfo } from "react-icons/fi";
// Reutiliza el mismo módulo de estilos que CdasGlobales.jsx: es el mismo
// workbench de alta/edición de CDA, extraído acá para que la lógica delicada
// (ver comentarios abajo, buena parte documenta bugs reales ya resueltos)
// viva en un solo lugar en vez de en el medio de CdasGlobales.jsx.
import styles from "../../../../pages/admin/cdas/CdasGlobales.module.css";

// Prefijos para cada integración según el formato esperado por el backend
const INTEGRACION_PREFIXES = {
  ARCA: "afip.",
  CASFOG: "casfog.",
  LUFE: "lufe.",
  NOSIS: "nosis.",
  SGRPLUS: "sgrplus."
};

// Estrategias de casing (mayúsculas/minúsculas) requeridas por cada integración
const INTEGRACION_CASING_STRATEGY = {
  ARCA: "UPPERCASE",   // ARCA (AFIP) requiere mayúsculas
  LUFE: "PRESERVE",    // LUFE requiere conservar el formato exacto del JSON
  NOSIS: "PRESERVE",   // NOSIS requiere conservar el formato exacto del JSON
  CASFOG: "PRESERVE",
  SGRPLUS: "PRESERVE"
};

// El motor de CDAs espera valores numéricos y fechas (YYYY-MM-DD) sin
// comillas; el texto va entre comillas simples. Ojo: esto se decide por el
// TIPO REAL del campo elegido, no por si el valor tipeado "parece" un
// número — un campo de texto (ej. CodPostal) puede tener contenido
// numérico ("5710") y el motor lo rompe igual si se lo manda sin comillas
// (confirmado en vivo). Ver esCampoNumericoActual/valorDebeIrSinComillas
// dentro del componente, que sí conocen el tipo real del campo.
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Interpreta el status HTTP de `cda/execute:test` (ver docs del motor de CDAs)
// para diferenciar con claridad "la expresión está mal escrita" (400/500) de
// "la expresión es válida pero da falso" (406), y no perder esa distinción
// bajo un genérico "ERROR".
const getResultadoPrueba = (status, styles) => {
  switch (status) {
    case 202:
      return {
        badgeClass: styles.badgeSuccess,
        label: "202 · VERDADERO",
        descripcion: "El criterio es válido y la condición se cumple para el CUIT ingresado.",
      };
    case 406:
      return {
        badgeClass: styles.badgeWarning,
        label: "406 · FALSO",
        descripcion: "El criterio es válido, pero la condición no se cumple (da falso) para el CUIT ingresado.",
      };
    case 400:
      return {
        badgeClass: styles.badgeDanger,
        label: "400 · CDA INEXISTENTE",
        descripcion: "El backend no encuentra este criterio. Puede que la expresión no se haya guardado o esté mal referenciada.",
      };
    case 409:
      return {
        badgeClass: styles.badgeDanger,
        label: "409 · DATO FALTANTE",
        descripcion: "Falta un dato necesario para evaluar la expresión (revisá que el campo exista para este CUIT).",
      };
    case 500:
      return {
        badgeClass: styles.badgeDanger,
        label: "500 · EXPRESIÓN INVÁLIDA",
        descripcion: "La expresión tiene un error de sintaxis o formato. Esto no significa que dé falso: hay que corregir cómo está escrita.",
      };
    case "network":
      return {
        badgeClass: styles.badgeDanger,
        label: "SIN CONEXIÓN",
        descripcion: "No se pudo contactar al servidor para ejecutar la prueba.",
      };
    default:
      return {
        badgeClass: styles.badgeDanger,
        label: `${status} · ERROR`,
        descripcion: "Ocurrió un error inesperado al ejecutar la prueba.",
      };
  }
};

const applyCasingStrategy = (val, integrationName) => {
  if (!val) return val;
  const strategy = INTEGRACION_CASING_STRATEGY[integrationName] || "PRESERVE";
  if (strategy === "UPPERCASE") {
    return val.toUpperCase();
  }
  if (strategy === "LOWERCASE") {
    return val.toLowerCase();
  }
  return val;
};

// Componente recursivo para renderizar el JSON de forma interactiva
const JsonViewer = ({ data, parentKey = "", onSelectField }) => {
  if (data === null) {
    return <span className={styles.jsonValueNull}>null</span>;
  }

  if (typeof data !== "object") {
    const isNumber = typeof data === "number";
    const isString = typeof data === "string";
    const valueClass = isNumber
      ? styles.jsonValueNumber
      : typeof data === "boolean"
        ? styles.jsonValueBoolean
        : styles.jsonValueString;

    // En vez del valor de ejemplo del mock (que confunde: "string" o "0" no
    // dicen nada del campo real), mostramos el TIPO — es lo único que importa
    // para armar bien la expresión (con o sin comillas, ver
    // esCampoNumericoActual/valorDebeIrSinComillas).
    const displayText = isNumber ? "NUMÉRICO" : isString ? "CADENA" : String(data);

    return (
      <span
        className={`${valueClass} ${styles.jsonFieldHover}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectField(parentKey);
        }}
        title={`Seleccionar campo: ${parentKey}`}
      >
        {displayText}
      </span>
    );
  }

  const isArray = Array.isArray(data);
  const keys = Object.keys(data);

  return (
    <span>
      {isArray ? "[" : "{"}
      <div className={styles.jsonNode}>
        {keys.map((key, index) => {
          const currentPath = parentKey ? (isArray ? `${parentKey}[${key}]` : `${parentKey}.${key}`) : key;
          const isLast = index === keys.length - 1;
          const isValArray = Array.isArray(data[key]);

          return (
            <div key={key}>
              {!isArray && (
                <>
                  <span
                    className={`${styles.jsonKey} ${styles.jsonFieldHover}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Si el valor es un array, sugerimos la propiedad .Count
                      const path = isValArray ? `${currentPath}.Count` : currentPath;
                      onSelectField(path);
                    }}
                    title={`Seleccionar campo: ${isValArray ? `${currentPath}.Count` : currentPath}`}
                  >
                    "{key}"
                  </span>
                  <span>: </span>
                </>
              )}
              <JsonViewer
                data={data[key]}
                parentKey={currentPath}
                onSelectField={onSelectField}
              />
              {!isLast && ","}
            </div>
          );
        })}
      </div>
      {isArray ? "]" : "}"}
    </span>
  );
};

// Selector de variables de NOSIS: en vez de navegar el JSON crudo, se arma la
// expresión (nosis.<Nombre>) a partir del mismo listado de variables que devuelve
// la integración, para que siempre coincida con el nombre que espera el backend.
const NosisVariablePicker = ({ variables, searchTerm, onSearchChange, selectedExpresion, onSelect }) => {
  const term = searchTerm.trim().toLowerCase();
  const filtradas = term
    ? variables.filter(
      (v) =>
        String(v.Nombre || "").toLowerCase().includes(term) ||
        String(v.Descripcion || "").toLowerCase().includes(term)
    )
    : variables;

  return (
    <div className={styles.nosisPickerContainer}>
      <input
        type="text"
        placeholder="Buscar variable por nombre o descripción..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className={styles.nosisSearchInput}
      />
      <div className={styles.nosisVarListScroll}>
        {filtradas.length === 0 ? (
          <div className={styles.nosisVarEmpty}>No se encontraron variables.</div>
        ) : (
          filtradas.map((v) => {
            const activa = selectedExpresion.trim() === `nosis.${v.Nombre}`;
            return (
              <div
                key={v.Nombre}
                className={`${styles.nosisVarRow} ${activa ? styles.nosisVarRowActive : ""}`}
                onClick={() => onSelect(v.Nombre)}
                title={`Usar nosis.${v.Nombre} en la expresión`}
              >
                <div className={styles.nosisVarHead}>
                  <span className={styles.nosisVarName}>nosis.{v.Nombre}</span>
                  {v.Tipo && <span className={styles.nosisVarType}>{v.Tipo}</span>}
                </div>
                {v.Descripcion && <span className={styles.nosisVarDesc}>{v.Descripcion}</span>}
                {v.Valor !== undefined && v.Valor !== null && (
                  <span className={styles.nosisVarExample}>Ejemplo: {String(v.Valor)}</span>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

// Fila compacta para las opciones de vinculación (columna 3): switch chico +
// nombre corto + ícono de info con la descripción larga en un tooltip, para
// que entren varias opciones sin que cada una ocupe una tarjeta completa.
// El tooltip se renderiza en un portal con posición fija: la columna tiene
// overflow-y:auto, así que un tooltip absoluto quedaría recortado.
export const ToggleOptionRow = ({ label, description, checked, onToggle, disabled }) => {
  const infoRef = useRef(null);
  const [tooltipPos, setTooltipPos] = useState(null);

  const mostrarTooltip = () => {
    const rect = infoRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTooltipPos({ top: rect.top - 8, right: window.innerWidth - rect.right - 6 });
  };
  const ocultarTooltip = () => setTooltipPos(null);

  return (
    <div className={styles.toggleOptionRow}>
      <label className={styles.miniSwitch}>
        <input type="checkbox" checked={checked} onChange={onToggle} disabled={disabled} />
        <span className={styles.miniSlider} />
      </label>
      <span className={styles.toggleOptionLabel} title={label}>{label}</span>
      <div
        ref={infoRef}
        className={styles.toggleOptionInfoWrapper}
        tabIndex={0}
        onMouseEnter={mostrarTooltip}
        onMouseLeave={ocultarTooltip}
        onFocus={mostrarTooltip}
        onBlur={ocultarTooltip}
      >
        <FiInfo className={styles.toggleOptionInfoIcon} size={17} />
      </div>
      {tooltipPos && createPortal(
        <div
          className={styles.toggleOptionTooltip}
          role="tooltip"
          style={{ top: tooltipPos.top, right: tooltipPos.right }}
        >
          {description}
        </div>,
        document.body
      )}
    </div>
  );
};

const getCdaProp = (c, propName) => {
  if (!c) return "";
  const pascal = propName.charAt(0).toUpperCase() + propName.slice(1);
  const val = c[propName] !== undefined ? c[propName] : c[pascal];
  return val !== undefined && val !== null ? val : "";
};

const getCdaId = (c) => {
  if (!c) return undefined;
  return c.cdaid !== undefined ? c.cdaid : (c.CdaId !== undefined ? c.CdaId : c.CdaID);
};

const detectarIntegracion = (expr) => {
  const e = (expr || "").toLowerCase();
  const found = Object.entries(INTEGRACION_PREFIXES).find(([, prefix]) => e.startsWith(prefix.toLowerCase()));
  return found ? found[0] : "";
};

// Workbench de alta/edición de un Criterio de Aceptación (CDA): 3 columnas
// (fuente de datos → definir regla → probar y publicar). Extraído de
// CdasGlobales.jsx (único lugar donde se crean/editan CDAs - LineasCda.jsx y
// CadenasCda.jsx solo vinculan CDAs ya existentes a una cadena) para poder
// aislar los bugs de motor de CDAs ya resueltos acá (casing por integración,
// comillas según tipo de campo, NOSIS numérico) en un solo componente.
//
// El guardado real (POST/PUT del CDA + cualquier vinculación posterior) NO
// vive acá: `onGuardar(payloadCda, { esEdicion })` lo hace el caller
// (CdasGlobales.jsx vincula a cadenas existentes / propaga valores, por
// pantalla elegida). Debe devolver true si guardó con éxito (y mostrar sus
// propios toasts/errores); el workbench solo orquesta la prueba previa, el
// modal de confirmación y el estado de carga.
export function CdaWorkbench({
  cdaEditando = null,
  onCancel,
  onGuardar,
  onEliminar,
  isEliminando = false,
  titulo,
  subtitulo,
  submitLabel,
  extraToggleOptions,
}) {
  const { mutateAsync: crearCdaBase } = useCrearCda();
  const { mutateAsync: actualizarCdaBase } = useActualizarCda();
  const { mutateAsync: probarCda, isPending: isTesting } = useProbarCda();
  const usuarioWebId = useUsuarioWebIdActual();

  const esEdicion = !!cdaEditando;

  const [integracion, setIntegracion] = useState(() => detectarIntegracion(getCdaProp(cdaEditando, "expresion")));
  const [nosisSearchTerm, setNosisSearchTerm] = useState("");

  const [descripcion, setDescripcion] = useState(() => getCdaProp(cdaEditando, "descripcion") || "");
  const [expresion, setExpresion] = useState(() => getCdaProp(cdaEditando, "expresion") || "");
  const [simbolocomparacion, setSimbolocomparacion] = useState(() => getCdaProp(cdaEditando, "simbolocomparacion") || ">");
  const [valorcomparacion, setValorcomparacion] = useState(() => String(getCdaProp(cdaEditando, "valorcomparacion") ?? ""));
  // Ojo: getCdaProp(null, ...) devuelve "" (ver su implementación), así que
  // sin el guard de cdaEditando esto quedaba en true también al CREAR (nada
  // tipeado todavía "parece" vacío) y el checkbox arrancaba tildado por
  // error. Solo tiene sentido inferirlo de lo guardado cuando SÍ hay un CDA
  // real que editar.
  const [comparaPorVacio, setComparaPorVacio] = useState(
    () => !!cdaEditando && String(getCdaProp(cdaEditando, "valorcomparacion") ?? "").trim() === ""
  );
  const [mensajerechazo, setMensajerechazo] = useState(() => getCdaProp(cdaEditando, "mensajerechazo") || "");
  const [vinculadefaultcv, setVinculadefaultcv] = useState(() => {
    const defaultCv = String(getCdaProp(cdaEditando, "vinculadefaultcv"));
    return defaultCv === "" ? true : (defaultCv === "1" || defaultCv.toUpperCase() === "S");
  });
  const [validationError, setValidationError] = useState("");
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [expresionLog, setExpresionLog] = useState(() => {
    const exprLog = getCdaProp(cdaEditando, "expresionlog") || "";
    const expr = getCdaProp(cdaEditando, "expresion") || "";
    return exprLog || expr;
  });
  const [userEditedExpresionLog, setUserEditedExpresionLog] = useState(() => {
    const exprLog = getCdaProp(cdaEditando, "expresionlog") || "";
    const expr = getCdaProp(cdaEditando, "expresion") || "";
    return !!exprLog && exprLog !== expr;
  });
  const [mostrarExpresionLog, setMostrarExpresionLog] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isGuardando, setIsGuardando] = useState(false);

  const [testCuit, setTestCuit] = useState("");
  const [testResult, setTestResult] = useState(null);

  const currentJsonData = integracion ? INTEGRACIONES_MOCKS[integracion] : null;
  const nosisVariables = INTEGRACIONES_MOCKS?.NOSIS?.Contenido?.Datos?.Variables || [];

  // El motor de CDAs no maneja bien comparar un campo numérico contra el
  // literal vacío (''): si el campo es un número real explota (500), y si
  // es un texto que numéricamente "parece" un número (ej. NOSIS manda DNI/
  // CUIT como string aunque el contenido sea todo dígitos) da un resultado
  // incorrecto en silencio. Comparar contra 0 en vez de '' funciona igual en
  // ambos casos (confirmado en vivo) — así que si detectamos que el campo
  // elegido es numérico, "Comparar contra vacío" manda "0" en vez de "".
  //
  // Para NOSIS el "Tipo" declarado no alcanza (VI_DNI dice "TEXTO" pero su
  // contenido real es solo dígitos, y ahí rompe igual): si ya se corrió el
  // Laboratorio de Pruebas para este mismo campo, se usa el valor real que
  // devolvió esa prueba en vez de confiar en el ejemplo estático del mock.
  const TIPOS_NOSIS_NUMERICOS = ["ENTERO", "NUMERO", "DECIMAL", "IMPORTE", "MONTO", "DOCUMENTO"];
  const esCampoNumericoActual = () => {
    const path = expresion.trim();
    if (!path) return false;
    if (integracion === "NOSIS") {
      const testeoCoincide = testResult && (expresionLog.trim() || path) === path;
      if (testeoCoincide && testResult.log !== undefined && testResult.log !== "") {
        return !isNaN(testResult.log);
      }
      const nombre = path.replace(/^nosis\./i, "");
      const variable = nosisVariables.find((v) => v.Nombre === nombre);
      if (variable?.Tipo && TIPOS_NOSIS_NUMERICOS.includes(variable.Tipo.toUpperCase())) return true;
      const val = variable?.Valor;
      return val !== undefined && val !== null && val !== "" && !isNaN(val);
    }
    if (integracion === "ARCA") {
      const segments = path.replace(/^afip\./i, "").split(".").filter(Boolean);
      let node = INTEGRACIONES_MOCKS.ARCA;
      for (const key of segments) {
        if (node === null || typeof node !== "object") return false;
        node = node[key.toLowerCase()];
      }
      return typeof node === "number";
    }
    return false;
  };

  // Reemplaza al viejo "debeIrSinComillas": las fechas van sin comillas por
  // el formato del valor tipeado (eso no depende del campo), pero para todo
  // lo demás lo que importa es si el CAMPO elegido es numérico de verdad, no
  // si el valor que escribió el admin "parece" un número.
  const valorDebeIrSinComillas = (val) => FECHA_REGEX.test(val) || esCampoNumericoActual();

  // Determina si el valor es numérico o no, para agregarle comillas simples si no las tiene
  const formatValorParaLog = (val) => {
    const trimmed = val.trim();
    if (trimmed === "") return "''";

    let cleanVal = trimmed;
    if (
      (cleanVal.startsWith('"') && cleanVal.endsWith('"')) ||
      (cleanVal.startsWith("'") && cleanVal.endsWith("'"))
    ) {
      cleanVal = cleanVal.slice(1, -1);
    }

    if (cleanVal === "") return "''";

    if (valorDebeIrSinComillas(cleanVal)) {
      return cleanVal;
    }

    const casedCleanVal = applyCasingStrategy(cleanVal, integracion);
    return `'${casedCleanVal}'`;
  };

  const reglaActual = expresion.trim()
    ? `${expresion.trim()} ${simbolocomparacion} ${formatValorParaLog(valorcomparacion)}`
    : "";

  const handleIntegracionChange = (val) => {
    setIntegracion(val);
    setExpresion(""); // reset expression when changing integration
    setExpresionLog("");
    setUserEditedExpresionLog(false);
    setNosisSearchTerm("");
  };

  const handleSelectField = (fieldPath) => {
    const prefix = INTEGRACION_PREFIXES[integracion] || "";
    const fullPath = `${prefix}${fieldPath}`;
    setExpresion(fullPath);
    if (!userEditedExpresionLog) {
      setExpresionLog(fullPath);
    }
  };

  const handleSelectNosisVariable = (nombre) => {
    const fullPath = `nosis.${nombre}`;
    setExpresion(fullPath);
    if (!userEditedExpresionLog) {
      setExpresionLog(fullPath);
    }
  };

  const sanearValor = (val, integracionActual) => {
    let valorSaneado = comparaPorVacio
      ? (esCampoNumericoActual() ? "0" : "")
      : val.trim();
    if (
      valorSaneado === '""' ||
      valorSaneado === "''" ||
      (valorSaneado.startsWith('"') && valorSaneado.endsWith('"')) ||
      (valorSaneado.startsWith("'") && valorSaneado.endsWith("'"))
    ) {
      if (valorSaneado === '""' || valorSaneado === "''") {
        valorSaneado = "";
      } else {
        valorSaneado = valorSaneado.slice(1, -1);
      }
    }
    if (!valorDebeIrSinComillas(valorSaneado) && valorSaneado !== "") {
      valorSaneado = applyCasingStrategy(valorSaneado, integracionActual);
    }
    return valorSaneado;
  };

  const handleTestExpression = async (e) => {
    e.preventDefault();
    if (!testCuit.trim()) {
      toast.error("Por favor ingresá un CUIT para la prueba.");
      return;
    }
    if (!expresion.trim()) {
      toast.error("La expresión a evaluar está vacía.");
      return;
    }

    setTestResult(null);
    const valorSaneado = sanearValor(valorcomparacion, integracion);
    const valorParaLog = formatValorParaLog(valorSaneado);
    const fullExpression = `${expresion.trim()} ${simbolocomparacion} ${valorParaLog}`;

    try {
      const res = await probarCda({
        cuit: testCuit.trim(),
        expresion: fullExpression,
        expresionLog: expresionLog.trim()
      });

      const data = res.data;
      setTestResult({
        status: res.status,
        message: typeof data === "string" ? data : (data?.mensaje || data?.Mensaje || ""),
        log: data?.valor ?? data?.Valor ?? ""
      });
    } catch (err) {
      console.error(err);
      setTestResult({
        status: "network",
        message: "Error de red o servidor al ejecutar la prueba. Verificá tu conexión (VPN)."
      });
    }
  };

  const errorDescripcion = intentoEnviar && !descripcion.trim();
  const errorExpresion = intentoEnviar && !expresion.trim();
  const errorValor = intentoEnviar && !comparaPorVacio && !valorcomparacion.trim();
  const errorMensaje = intentoEnviar && !mensajerechazo.trim();

  const handleSave = (e) => {
    e.preventDefault();

    const faltaAlgunCampo =
      !descripcion.trim() ||
      !expresion.trim() ||
      (!comparaPorVacio && !valorcomparacion.trim()) ||
      !mensajerechazo.trim();

    if (faltaAlgunCampo) {
      setIntentoEnviar(true);
      return;
    }

    setIntentoEnviar(false);
    setValidationError("");
    setConfirmOpen(true);
  };

  const confirmarGuardado = async () => {
    if (!usuarioWebId) {
      toast.error("No se pudo identificar al usuario logueado; recargá la página e intentá de nuevo.");
      setConfirmOpen(false);
      return;
    }
    setIsGuardando(true);

    const valorSaneado = sanearValor(valorcomparacion, integracion);
    const valorParaLog = formatValorParaLog(valorSaneado);
    const fullExpression = `${expresion.trim()} ${simbolocomparacion} ${valorParaLog}`;

    try {
      const resValida = await probarCda({
        cuit: testCuit.trim() || "30714430048",
        expresion: fullExpression,
        expresionLog: expresionLog.trim()
      });

      if (resValida.status === 500) {
        setValidationError(`Formato de expresión inválido: ${resValida.message || resValida.data?.message || resValida.data || "Error de sintaxis"}`);
        setIsGuardando(false);
        setConfirmOpen(false);
        return;
      }
    } catch (valErr) {
      console.warn("Fallo la verificación previa de sintaxis, pero se continuará guardando:", valErr);
    }

    const payloadCda = {
      cdaID: esEdicion ? (getCdaId(cdaEditando) ?? 0) : 0,
      descripcion: descripcion.trim(),
      expresion: expresion.trim(),
      simboloComparacion: simbolocomparacion,
      // El motor de CDAs espera los valores de texto entre comillas simples
      // (ej. 'REINA') y los numéricos/fechas sin comillas: mismo criterio
      // que ya usa el Laboratorio de Pruebas (formatValorParaLog).
      valorComparacion: valorParaLog,
      vinculaDefaultCV: vinculadefaultcv ? "1" : "0",
      expresionLog: expresionLog.trim(),
      mensajeRechazo: mensajerechazo.trim(),
      activo: "1",
      usuariowebid: usuarioWebId
    };

    let response;
    try {
      const guardarBase = esEdicion ? actualizarCdaBase : crearCdaBase;
      response = await guardarBase(payloadCda);
    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.message || err.response?.data?.Message || (typeof err.response?.data === "string" ? err.response.data : null);
      toast.error(backendMessage || (esEdicion ? "Ocurrió un error al actualizar el CDA." : "Ocurrió un error al guardar el CDA."));
      setIsGuardando(false);
      setConfirmOpen(false);
      return;
    }

    // El CDA en sí ya se guardó acá arriba - lo que haga onGuardar (vincular
    // a una cadena, propagar un valor, etc.) es un paso posterior. Si falla,
    // no corresponde mostrar "error al guardar el CDA" (sería engañoso, el
    // CDA sí se guardó): cada caller es responsable de mostrar su propio
    // toast si ese paso extra no sale bien.
    try {
      const ok = await onGuardar(payloadCda, {
        esEdicion,
        cdaId: esEdicion ? getCdaId(cdaEditando) : (response?.CdaID || response?.cdaID || response?.cdaid || response?.id),
        response,
        valorParaLog,
      });
      if (ok !== false && onCancel) {
        onCancel();
      }
    } catch (err) {
      console.error("[CdaWorkbench] onGuardar falló después de guardar el CDA base:", err);
    } finally {
      setIsGuardando(false);
      setConfirmOpen(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          {onCancel && (
            <button type="button" className={styles.backButton} onClick={onCancel}>
              <FiArrowLeft /> Volver
            </button>
          )}
          <h1>{titulo || (esEdicion ? "Editar Criterio de Aceptación" : "Criterios de Aceptación Globales")}</h1>
          <p>{subtitulo || (esEdicion ? "Modificá los datos del criterio seleccionado." : "Definí las reglas base (CDA) seleccionando campos directamente desde las integraciones disponibles.")}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className={styles.workbench}>
        {/* COLUMNA 1: Fuente de Datos */}
        <div className={styles.col}>
          <div className={styles.colHeader}>
            <span className={styles.colStepBadge}>1</span>
            <div>
              <h2 className={styles.colTitle}>Fuente de Datos</h2>
              <p className={styles.colSubtitle}>Elegí la integración y el campo a evaluar</p>
            </div>
          </div>

          <SelectSimple
            label="Seleccionar Integración"
            value={integracion}
            onChange={handleIntegracionChange}
            options={[
              { value: "ARCA", label: "ARCA" },
              { value: "NOSIS", label: "NOSIS" },
              { value: "LUFE", label: "LUFE" },
              { value: "CASFOG", label: "CASFOG" },
              { value: "SGRPLUS", label: "SGR+" }
            ]}
            placeholder="Seleccioná una integración"
            variant="admin"
            disabled={isGuardando}
            hideErrorSpace={true}
          />
          <p className={styles.helperText}>
            Es opcional: podés armar la expresión con clics o escribirla manualmente sin seleccionar nada.
          </p>

          {integracion === "NOSIS" ? (
            <NosisVariablePicker
              variables={nosisVariables}
              searchTerm={nosisSearchTerm}
              onSearchChange={setNosisSearchTerm}
              selectedExpresion={expresion}
              onSelect={handleSelectNosisVariable}
            />
          ) : (
            <div className={styles.jsonViewerContainer}>
              {currentJsonData ? (
                <JsonViewer data={currentJsonData} onSelectField={handleSelectField} />
              ) : (
                <div className={styles.jsonViewerMessage}>
                  Seleccioná una integración arriba para ver su estructura de datos.
                  <br /><br />
                  Podrás hacer clic en cualquier valor para usar su campo en la regla.
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUMNA 2: Definir la Regla */}
        <div className={styles.col}>
          <div className={styles.colHeader}>
            <span className={styles.colStepBadge}>2</span>
            <div>
              <h2 className={styles.colTitle}>Definí la Regla</h2>
              <p className={styles.colSubtitle}>Condición, mensaje y datos del criterio</p>
            </div>
          </div>

          <div className={`${styles.colScroll} ${styles.colScrollTight}`}>
            {validationError && (
              <div className={styles.validationError}>
                {validationError}
              </div>
            )}

            <div className={styles.sectionGroup}>
              <h3 className={styles.sectionLabel}>Descripción</h3>
              <InputSimple
                label="Descripción del CDA"
                value={descripcion}
                onChange={setDescripcion}
                disabled={isGuardando}
                variant="admin"
                error={errorDescripcion ? "Campo obligatorio" : undefined}
              />
            </div>

            <div className={styles.sectionGroup}>
              <h3 className={styles.sectionLabel}>Armá tu Regla</h3>

              <div className={styles.compactField}>
                <InputSimple
                  label="Expresión (Campo a evaluar)"
                  type="textarea"
                  value={expresion}
                  onChange={(val) => {
                    setExpresion(val);
                    if (!userEditedExpresionLog) {
                      setExpresionLog(val);
                    }
                  }}
                  disabled={isGuardando}
                  variant="admin"
                  error={errorExpresion ? "Campo obligatorio" : undefined}
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.fieldOperador}>
                  <SelectSimple
                    label="Operador"
                    value={simbolocomparacion}
                    onChange={setSimbolocomparacion}
                    options={[
                      { value: "=", label: "=" },
                      { value: ">", label: ">" },
                      { value: "<", label: "<" },
                      { value: ">=", label: ">=" },
                      { value: "<=", label: "<=" },
                      { value: "<>", label: "<>" }
                    ]}
                    disabled={isGuardando}
                    variant="admin"
                  />
                </div>

                <div className={styles.fieldValorComparacion}>
                  <InputSimple
                    label="Valor de Comparación"
                    value={valorcomparacion}
                    onChange={setValorcomparacion}
                    disabled={isGuardando || comparaPorVacio}
                    variant="admin"
                    hideErrorSpace={true}
                    error={errorValor ? true : undefined}
                  />
                  <div className={styles.valorBelowRow}>
                    <span className={errorValor ? styles.valorErrorText : styles.valorHintText}>
                      {errorValor ? "Campo obligatorio" : "Fechas: AAAA-MM-DD"}
                    </span>
                    <div
                      className={styles.vacioCheckRow}
                      onClick={() => {
                        if (isGuardando) return;
                        const next = !comparaPorVacio;
                        setComparaPorVacio(next);
                        if (next) setValorcomparacion(esCampoNumericoActual() ? "0" : "");
                      }}
                      title={
                        comparaPorVacio && esCampoNumericoActual()
                          ? "Este campo es numérico: el motor de CDAs no puede comparar un número contra vacío ('') sin fallar, así que se compara contra 0 en su lugar."
                          : "Marcá esto si el criterio compara contra un texto vacío."
                      }
                    >
                      <div className={`${styles.customCheckbox} ${comparaPorVacio ? styles.checkboxChecked : ""}`}>
                        {comparaPorVacio && <FiCheck size={11} className={styles.checkmarkIcon} />}
                      </div>
                      <span className={styles.vacioCheckLabel}>
                        {comparaPorVacio && esCampoNumericoActual() ? "Comparar contra vacío (campo numérico → se usa 0)" : "Comparar contra vacío"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="button"
                className={styles.advancedToggle}
                onClick={() => setMostrarExpresionLog((prev) => !prev)}
                aria-expanded={mostrarExpresionLog}
              >
                <FiChevronDown className={`${styles.advancedToggleIcon} ${mostrarExpresionLog ? styles.advancedToggleIconOpen : ""}`} />
                Personalizar expresión de log
                <span className={styles.advancedToggleHint}>(opcional)</span>
              </button>

              {mostrarExpresionLog && (
                <div className={styles.compactField}>
                  <InputSimple
                    label="Expresión de Retorno para Logs (Opcional)"
                    type="textarea"
                    value={expresionLog}
                    onChange={(val) => {
                      setExpresionLog(val);
                      setUserEditedExpresionLog(true);
                    }}
                    disabled={isGuardando}
                    variant="admin"
                    hideErrorSpace={true}
                  />
                  <p className={styles.helperText}>
                    Podés agregar más de una, separándolas con coma, o dejarlo vacío si no lo necesitás.
                  </p>
                </div>
              )}
            </div>

            <div className={styles.sectionGroup}>
              <h3 className={styles.sectionLabel}>Mensaje</h3>
              <InputSimple
                label="Mensaje de Rechazo Global"
                value={mensajerechazo}
                onChange={setMensajerechazo}
                disabled={isGuardando}
                variant="admin"
                error={errorMensaje ? "Campo obligatorio" : undefined}
              />
            </div>
          </div>
        </div>

        {/* COLUMNA 3: Probar y Publicar */}
        <div className={styles.col}>
          <div className={styles.colHeader}>
            <span className={styles.colStepBadge}>3</span>
            <div>
              <h2 className={styles.colTitle}>Probá y Publicá</h2>
              <p className={styles.colSubtitle}>Vinculación por defecto, prueba en vivo y guardado</p>
            </div>
          </div>

          {/* Laboratorio de Pruebas: zona fija arriba. El resultado se superpone
              a este mismo contenedor (overlay), así que nunca crece ni empuja
              a la vinculación de abajo. */}
          <div className={styles.sandboxContainer}>
            <h3 className={styles.sandboxTitle}>Laboratorio de Pruebas</h3>

            <div className={styles.sandboxBody}>
              {reglaActual ? (
                <p className={styles.sandboxRulePreview}>
                  La regla actual que diseñaste es: <code>{reglaActual}</code>
                </p>
              ) : (
                <p className={styles.sandboxRulePreview}>
                  Definí una regla en el paso 2 para poder probarla acá.
                </p>
              )}

              <div style={{ display: "flex", gap: "0.75rem", alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <InputSimple
                    label="CUIT para la prueba"
                    value={testCuit}
                    onChange={setTestCuit}
                    disabled={isTesting || isGuardando}
                    variant="admin"
                    hideErrorSpace={true}
                  />
                </div>
                <div>
                  <Button
                    type="button"
                    variant="outlineBlue"
                    size="md"
                    onClick={handleTestExpression}
                    isLoading={isTesting}
                    disabled={isGuardando || !reglaActual || !testCuit.trim()}
                  >
                    Probar
                  </Button>
                </div>
              </div>
            </div>

            {testResult && (() => {
              const resultado = getResultadoPrueba(testResult.status, styles);
              return (
                <div className={styles.testResultBox}>
                  <div className={styles.testResultHeader}>
                    <span>Resultado:</span>
                    <div className={styles.testResultHeaderRight}>
                      <span className={resultado.badgeClass}>{resultado.label}</span>
                      <button
                        type="button"
                        className={styles.testResultCloseBtn}
                        onClick={() => setTestResult(null)}
                        title="Cerrar resultado"
                        aria-label="Cerrar resultado"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  </div>
                  <div className={styles.testResultMessage}>{resultado.descripcion}</div>
                  {testResult.message && (
                    <div className={styles.testResultLog}>
                      <span className={styles.testResultLogLabel}>Mensaje devuelto por el backend</span>
                      <code className={styles.testResultLogValue}>{testResult.message}</code>
                    </div>
                  )}
                  {testResult.log && (
                    <div className={styles.testResultLog}>
                      <span className={styles.testResultLogLabel}>Valor resuelto</span>
                      <code className={styles.testResultLogValue}>{testResult.log}</code>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div className={styles.colDivider} />

          {/* Vinculación: zona scrolleable, debajo del laboratorio de pruebas */}
          <div className={styles.colScroll}>
            <div className={styles.toggleOptionsPanel}>
              <ToggleOptionRow
                label="CDA por Defecto"
                description="Se vincula automáticamente a las cadenas de valor que se creen de ahora en adelante. No afecta a las cadenas ya existentes."
                checked={vinculadefaultcv}
                onToggle={() => setVinculadefaultcv(!vinculadefaultcv)}
                disabled={isGuardando}
              />
              {extraToggleOptions}
            </div>
          </div>

          <div className={styles.formActions}>
            {onEliminar && (
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={onEliminar}
                disabled={isGuardando || isEliminando}
              >
                <FiTrash2 /> Eliminar
              </Button>
            )}
            <Button
              type="submit"
              variant="blue"
              size="md"
              isLoading={isGuardando}
              disabled={isEliminando}
            >
              {submitLabel || (esEdicion ? "Guardar Cambios" : "Crear Criterio")}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmarGuardado}
        titulo={esEdicion ? "Confirmar Actualización de Criterio" : "Confirmar Criterio de Aceptación"}
        mensaje={
          <>
            {esEdicion
              ? "¿Confirmás guardar los cambios de este criterio de aceptación?"
              : "¿Confirmás la creación de este criterio de aceptación?"}
            {reglaActual && (
              <>
                <br /><br />
                <strong>Regla:</strong>
                <br />
                <code className={styles.confirmModalCode}>{reglaActual}</code>
              </>
            )}
          </>
        }
        variant="blue"
        confirmText={esEdicion ? "GUARDAR CAMBIOS" : "CREAR CRITERIO"}
        cancelText="CANCELAR"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={isGuardando}
      />
    </div>
  );
}

export default CdaWorkbench;
