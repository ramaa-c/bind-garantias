import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCrearCda, useActualizarCda, useObtenerTodosCdas, useProbarCda } from "../../../hooks/useCda";
import { useUsuarioWebIdActual } from "../../../hooks/useUsuario";
import { cadenaValorService } from "../../../services/cadenaValorService";
import { INTEGRACIONES_MOCKS } from "../../../utils/integracionesMocks";
import { esCdaActivo, esCdaActivoEstricto } from "../../../utils/cdaUtils";
import { resolverGrupoCda } from "../../../utils/grupoCdaUtils";
import { PANTALLAS_CDA } from "../../../utils/pantallasCda";
import { Button } from "../../../components/ui/Button/Button";
import { InputSimple } from "../../../components/ui/InputSimple/InputSimple";
import { SelectSimple } from "../../../components/ui/SelectSimple/SelectSimple";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { FiPlus, FiCheck, FiChevronDown, FiChevronRight, FiSearch, FiArrowLeft, FiInbox, FiX, FiTrash2, FiInfo } from "react-icons/fi";
import styles from "./CdasGlobales.module.css";

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

// Colores distintivos por integración, usados como badges en el listado
const INTEGRACION_COLORS = {
  ARCA: { bg: "rgba(88, 166, 255, 0.12)", color: "#58a6ff", border: "rgba(88, 166, 255, 0.35)" },
  NOSIS: { bg: "rgba(179, 136, 255, 0.12)", color: "#b388ff", border: "rgba(179, 136, 255, 0.35)" },
  LUFE: { bg: "rgba(221, 155, 32, 0.12)", color: "#dd9b20", border: "rgba(221, 155, 32, 0.35)" },
  CASFOG: { bg: "rgba(255, 121, 198, 0.12)", color: "#ff79c6", border: "rgba(255, 121, 198, 0.35)" },
  SGRPLUS: { bg: "rgba(56, 161, 105, 0.12)", color: "#38a169", border: "rgba(56, 161, 105, 0.35)" },
};
const INTEGRACION_COLOR_DEFAULT = { bg: "rgba(139, 148, 158, 0.12)", color: "#8b949e", border: "rgba(139, 148, 158, 0.3)" };

// Nosis (y en general el motor de CDAs) espera valores numéricos y fechas
// (YYYY-MM-DD) sin comillas; solo el texto va entre comillas simples.
const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const debeIrSinComillas = (val) => (val !== "" && !isNaN(val)) || FECHA_REGEX.test(val);

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
    const isString = typeof data === "string";
    const valueClass =
      typeof data === "number"
        ? styles.jsonValueNumber
        : typeof data === "boolean"
          ? styles.jsonValueBoolean
          : styles.jsonValueString;

    return (
      <span
        className={`${valueClass} ${styles.jsonFieldHover}`}
        onClick={(e) => {
          e.stopPropagation();
          onSelectField(parentKey);
        }}
        title={`Seleccionar campo: ${parentKey}`}
      >
        {isString ? `"${data}"` : String(data)}
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
const NosisVariablePicker = ({ variables, searchTerm, onSearchChange, selectedExpresion, onSelect, styles }) => {
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

const CdaRowSkeleton = ({ styles }) => (
  <tr>
    <td>
      <div className={styles.skeletonBlock} style={{ height: "0.85rem", width: "65%", marginBottom: "0.4rem" }} />
      <div className={styles.skeletonBlock} style={{ height: "0.65rem", width: "35%" }} />
    </td>
    <td><div className={styles.skeletonBlock} style={{ height: "1.2rem", width: "70px", borderRadius: "999px" }} /></td>
    <td><div className={styles.skeletonBlock} style={{ height: "0.8rem", width: "85%" }} /></td>
    <td><div className={styles.skeletonBlock} style={{ height: "0.8rem", width: "70%" }} /></td>
    <td style={{ textAlign: "center" }}><div className={styles.skeletonBlock} style={{ height: "1.2rem", width: "36px", borderRadius: "999px", margin: "0 auto" }} /></td>
    <td></td>
  </tr>
);

// Fila compacta para las opciones de vinculación (columna 3): switch chico +
// nombre corto + ícono de info con la descripción larga en un tooltip, para
// que entren varias opciones sin que cada una ocupe una tarjeta completa.
// El tooltip se renderiza en un portal con posición fija: la columna tiene
// overflow-y:auto, así que un tooltip absoluto quedaría recortado.
const ToggleOptionRow = ({ label, description, checked, onToggle, disabled }) => {
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

export default function CdasGlobales() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutateAsync: crearCda, isPending: isCreando } = useCrearCda();
  const { mutateAsync: actualizarCda, isPending: isActualizando } = useActualizarCda();
  const { data: todosCdasData, isLoading: isLoadingLista } = useObtenerTodosCdas();
  const { mutateAsync: probarCda, isPending: isTesting } = useProbarCda();
  const usuarioWebId = useUsuarioWebIdActual();
  const [isEliminando, setIsEliminando] = useState(false);

  // "lista": listado de CDAs existentes. "formulario": alta/edición (misma pantalla para ambos casos).
  const [vista, setVista] = useState("lista");
  const [cdaEditando, setCdaEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  const [isProcesando, setIsProcesando] = useState(false);
  const [integracion, setIntegracion] = useState("");
  const [nosisSearchTerm, setNosisSearchTerm] = useState("");

  const [descripcion, setDescripcion] = useState("");
  const [expresion, setExpresion] = useState("");
  const [simbolocomparacion, setSimbolocomparacion] = useState(">");
  const [valorcomparacion, setValorcomparacion] = useState("");
  const [comparaPorVacio, setComparaPorVacio] = useState(false);
  const [mensajerechazo, setMensajerechazo] = useState("");
  const [vinculadefaultcv, setVinculadefaultcv] = useState(true);
  const [vincularExistentes, setVincularExistentes] = useState(false);
  const [propagarValorATodasCadenas, setPropagarValorATodasCadenas] = useState(false);
  const [validationError, setValidationError] = useState("");
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [expresionLog, setExpresionLog] = useState("");
  const [userEditedExpresionLog, setUserEditedExpresionLog] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [postSaveModalOpen, setPostSaveModalOpen] = useState(false);
  const [mostrarExpresionLog, setMostrarExpresionLog] = useState(false);

  // Estados para laboratorio de pruebas de CDAs
  const [testCuit, setTestCuit] = useState("");
  const [testResult, setTestResult] = useState(null);

  // A diferencia de esCdaActivo (que tolera "" para no romper la vinculación
  // de CDAs migrados que ya estaban linkeados), esta lista es estricta:
  // solo se muestran los CDA con Activo="1" explícito. Uno en "0" o vacío
  // (dato migrado sin completar) no aparece. Mismo criterio que CdaPanel.
  const todosCdasList = (Array.isArray(todosCdasData) ? todosCdasData : todosCdasData?.items || todosCdasData?.data || []).filter(esCdaActivoEstricto);

  const getCdaId = (c) => {
    if (!c) return undefined;
    return c.cdaid !== undefined ? c.cdaid : (c.CdaId !== undefined ? c.CdaId : c.CdaID);
  };

  const getCdaProp = (c, propName) => {
    if (!c) return "";
    const pascal = propName.charAt(0).toUpperCase() + propName.slice(1);
    const val = c[propName] !== undefined ? c[propName] : c[pascal];
    return val !== undefined && val !== null ? val : "";
  };

  const detectarIntegracion = (expr) => {
    const e = (expr || "").toLowerCase();
    const found = Object.entries(INTEGRACION_PREFIXES).find(([, prefix]) => e.startsWith(prefix.toLowerCase()));
    return found ? found[0] : "";
  };

  const cdasFiltrados = todosCdasList.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      String(getCdaProp(c, "descripcion")).toLowerCase().includes(term) ||
      String(getCdaProp(c, "expresion")).toLowerCase().includes(term)
    );
  });

  // Determinar si el valor es numérico o no, para agregarle comillas simples si no las tiene
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

    if (debeIrSinComillas(cleanVal)) {
      return cleanVal;
    }

    const casedCleanVal = applyCasingStrategy(cleanVal, integracion);
    return `'${casedCleanVal}'`;
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

    let valorSaneado = valorcomparacion.trim();
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
    if (!debeIrSinComillas(valorSaneado) && valorSaneado !== "") {
      valorSaneado = applyCasingStrategy(valorSaneado, integracion);
    }
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

  const resetFormulario = () => {
    setCdaEditando(null);
    setIntegracion("");
    setNosisSearchTerm("");
    setDescripcion("");
    setExpresion("");
    setExpresionLog("");
    setUserEditedExpresionLog(false);
    setSimbolocomparacion(">");
    setValorcomparacion("");
    setComparaPorVacio(false);
    setMensajerechazo("");
    setVinculadefaultcv(true);
    setVincularExistentes(false);
    setPropagarValorATodasCadenas(false);
    setValidationError("");
    setIntentoEnviar(false);
    setTestResult(null);
  };

  const handleCrearNuevo = () => {
    resetFormulario();
    setVista("formulario");
  };

  const handleEditarCda = (cda) => {
    const expr = getCdaProp(cda, "expresion") || "";
    const valor = String(getCdaProp(cda, "valorcomparacion") ?? "");
    const simbolo = getCdaProp(cda, "simbolocomparacion") || "=";
    const exprLog = getCdaProp(cda, "expresionlog") || "";
    const defaultCv = String(getCdaProp(cda, "vinculadefaultcv"));

    setCdaEditando(cda);
    setIntegracion(detectarIntegracion(expr));
    setNosisSearchTerm("");
    setDescripcion(getCdaProp(cda, "descripcion") || "");
    setExpresion(expr);
    setExpresionLog(exprLog || expr);
    setUserEditedExpresionLog(!!exprLog && exprLog !== expr);
    setSimbolocomparacion(simbolo || "=");
    setValorcomparacion(valor);
    setComparaPorVacio(valor.trim() === "");
    setMensajerechazo(getCdaProp(cda, "mensajerechazo") || "");
    setVinculadefaultcv(defaultCv === "" ? true : (defaultCv === "1" || defaultCv.toUpperCase() === "S"));
    setVincularExistentes(false);
    setPropagarValorATodasCadenas(false);
    setValidationError("");
    setIntentoEnviar(false);
    setTestResult(null);
    setVista("formulario");
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

  // Vincula un CDA puntual a todas las cadenas de valor YA EXISTENTES, en
  // ambas pantallas. Es una acción explícita disparada por el checkbox
  // "vincularExistentes": el flag "vinculadefaultcv" solo controla si el
  // backend lo suma automáticamente a las cadenas de valor que se creen de
  // ahora en adelante, no a las actuales.
  const vincularCdaEnCadenasExistentes = async (cdaId, valorParaVincular) => {
    toast.info("Vinculando criterio de aceptación a las cadenas de valor existentes...");
    try {
      const todasCadenas = await cadenaValorService.obtenerTodasWeb();
      const cadenasList = Array.isArray(todasCadenas) ? todasCadenas : todasCadenas?.items || todasCadenas?.data || [];

      let linkedCount = 0;
      for (const cadena of cadenasList) {
        const cadenaId = cadena.cadenavalorid || cadena.CadenaValorID;
        if (!cadenaId) continue;

        for (const pantalla of PANTALLAS_CDA) {
          try {
            const grupo = await resolverGrupoCda(pantalla.value, cadenaId);
            const linkedCdas = await cadenaValorService.obtenerCdasPorGrupo(grupo.grupocdaid);
            const linkedCdasList = Array.isArray(linkedCdas) ? linkedCdas : linkedCdas?.items || linkedCdas?.data || [];

            const yaVinculado = linkedCdasList.some((c) => getCdaId(c) === cdaId);

            if (!yaVinculado) {
              // El POST ahora agrega en vez de reemplazar: alcanza con mandar
              // únicamente el CDA nuevo, no hace falta reenviar los existentes.
              await cadenaValorService.vincularCdasAGrupo({
                grupocdaid: grupo.grupocdaid,
                listacda: [{ cdaid: cdaId, valorcomparacion: valorParaVincular, usuariowebid: usuarioWebId }],
              });
              linkedCount++;
            }
          } catch (linkErr) {
            console.error(`Error al vincular CDA a la cadena ${cadenaId} (${pantalla.value}):`, linkErr);
          }
        }
      }

      if (linkedCount > 0) {
        toast.success(`Vinculado con éxito a ${linkedCount} combinación${linkedCount !== 1 ? "es" : ""} de cadena y pantalla existente${linkedCount !== 1 ? "s" : ""}.`);
      } else {
        toast.info("El criterio ya estaba vinculado a todas las cadenas de valor existentes.");
      }
    } catch (chainErr) {
      console.error("Error al obtener cadenas de valor para vinculación:", chainErr);
      toast.error("El CDA se guardó, pero no se pudo vincular automáticamente a las cadenas existentes.");
    }
  };

  // Sobrescribe el valor por cadena en TODAS las cadenas y pantallas donde
  // este CDA ya está vinculado y activo (no toca las que no lo tienen
  // vinculado: para eso está "vincularExistentes"). Es la acción disparada
  // por el checkbox "propagarValorATodasCadenas" al editar un CDA global.
  const propagarValorATodasLasCadenasActivas = async (cdaId, valorNuevo) => {
    toast.info("Aplicando el nuevo valor en las cadenas donde este criterio está activo...");
    try {
      const todasCadenas = await cadenaValorService.obtenerTodasWeb();
      const cadenasList = Array.isArray(todasCadenas) ? todasCadenas : todasCadenas?.items || todasCadenas?.data || [];

      let actualizadas = 0;
      for (const cadena of cadenasList) {
        const cadenaId = cadena.cadenavalorid || cadena.CadenaValorID;
        if (!cadenaId) continue;

        for (const pantalla of PANTALLAS_CDA) {
          try {
            const grupo = await resolverGrupoCda(pantalla.value, cadenaId);
            const linkedCdas = await cadenaValorService.obtenerCdasPorGrupo(grupo.grupocdaid);
            const linkedCdasList = Array.isArray(linkedCdas) ? linkedCdas : linkedCdas?.items || linkedCdas?.data || [];
            const vinculacion = linkedCdasList.find((c) => getCdaId(c) === cdaId);
            if (!vinculacion || !esCdaActivo(vinculacion)) continue;

            const cdaCadenaValorId = getCdaProp(vinculacion, "cdacadenavalorid");
            if (cdaCadenaValorId === "" || cdaCadenaValorId === undefined) {
              console.warn(`No se encontró CdaCadenaValorID para el CDA ${cdaId} en la cadena ${cadenaId} (${pantalla.value}); se omite.`);
              continue;
            }

            await cadenaValorService.actualizarVinculacionCda({
              cdacadenavalorid: cdaCadenaValorId,
              grupocdaid: grupo.grupocdaid,
              cdaid: cdaId,
              valorcomparacion: valorNuevo,
              usuariowebid: usuarioWebId,
            });
            actualizadas++;
          } catch (linkErr) {
            console.error(`Error al actualizar el valor del CDA en la cadena ${cadenaId} (${pantalla.value}):`, linkErr);
          }
        }
      }

      if (actualizadas > 0) {
        toast.success(`Valor actualizado en ${actualizadas} combinación${actualizadas !== 1 ? "es" : ""} de cadena y pantalla donde el criterio estaba activo.`);
      } else {
        toast.info("Este criterio no estaba activo en ninguna cadena de valor.");
      }
    } catch (chainErr) {
      console.error("Error al obtener cadenas de valor para propagar el valor:", chainErr);
      toast.error("El CDA se guardó, pero no se pudo propagar el valor a las cadenas donde está activo.");
    }
  };

  const confirmarCreacion = async () => {
    if (!usuarioWebId) {
      toast.error("No se pudo identificar al usuario logueado; recargá la página e intentá de nuevo.");
      return;
    }
    setIsProcesando(true);
    const esEdicion = !!cdaEditando;

    // Saneamos el valor de comparación para evitar almacenar comillas externas en la DB
    let valorSaneado = comparaPorVacio ? "" : valorcomparacion.trim();
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

    if (!debeIrSinComillas(valorSaneado) && valorSaneado !== "") {
      valorSaneado = applyCasingStrategy(valorSaneado, integracion);
    }

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
        setIsProcesando(false);
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

    try {
      if (esEdicion) {
        await actualizarCda(payloadCda);

        if (propagarValorATodasCadenas) {
          const cdaId = getCdaId(cdaEditando);
          if (cdaId) await propagarValorATodasLasCadenasActivas(cdaId, valorParaLog);
        }

        await queryClient.invalidateQueries({ queryKey: ['cda'] });
        await queryClient.invalidateQueries({ queryKey: ['cadenaValor'] });
        toast.success("Criterio de Aceptación actualizado exitosamente.");
        resetFormulario();
        setVista("lista");
        setPostSaveModalOpen(true);
      } else {
        const response = await crearCda(payloadCda);
        const newCdaId = response?.CdaID || response?.cdaID || response?.cdaid || response?.id;

        if (vincularExistentes && newCdaId) {
          await vincularCdaEnCadenasExistentes(newCdaId, valorParaLog);
        }

        await queryClient.invalidateQueries({ queryKey: ['cda'] });
        await queryClient.invalidateQueries({ queryKey: ["cda", "pantallaGrupo"] });
        await queryClient.invalidateQueries({ queryKey: ['cadenaValor'] });
        toast.success("Criterio de Aceptación Global creado exitosamente.");
        resetFormulario();
        setVista("lista");
        // El atajo a "CDAs por Cadena" solo tiene sentido si el CDA quedó
        // SIN vincular a ninguna cadena. Si se tildó "vincular a cadenas
        // existentes", ya se vinculó a todas más arriba: mostrar el atajo
        // acá empujaba a vincularlo otra vez a mano y duplicaba la fila.
        if (!vincularExistentes) {
          setPostSaveModalOpen(true);
        }
      }
    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.message || err.response?.data?.Message || (typeof err.response?.data === "string" ? err.response.data : null);
      toast.error(backendMessage || (esEdicion ? "Ocurrió un error al actualizar el CDA." : "Ocurrió un error al guardar el CDA."));
    } finally {
      setIsProcesando(false);
      setConfirmOpen(false);
    }
  };

  const handleEliminarCda = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmEliminarCda = async () => {
    if (!cdaEditando) return;
    if (!usuarioWebId) {
      toast.error("No se pudo identificar al usuario logueado; recargá la página e intentá de nuevo.");
      return;
    }
    setIsEliminando(true);
    try {
      // Ya no existe un DELETE físico: se "elimina" marcando activo="0", que
      // hace que el CDA se filtre de todos los listados como si no existiera.
      await actualizarCda({
        cdaID: getCdaId(cdaEditando) ?? 0,
        descripcion: getCdaProp(cdaEditando, "descripcion") || "",
        expresion: getCdaProp(cdaEditando, "expresion") || "",
        expresionLog: getCdaProp(cdaEditando, "expresionlog") || "",
        simboloComparacion: getCdaProp(cdaEditando, "simbolocomparacion") || "",
        valorComparacion: getCdaProp(cdaEditando, "valorcomparacion") || "",
        vinculaDefaultCV: getCdaProp(cdaEditando, "vinculadefaultcv") || "0",
        mensajeRechazo: getCdaProp(cdaEditando, "mensajerechazo") || "",
        activo: "0",
        usuariowebid: usuarioWebId
      });
      await queryClient.invalidateQueries({ queryKey: ['cda'] });
      await queryClient.invalidateQueries({ queryKey: ["cda", "pantallaGrupo"] });
      await queryClient.invalidateQueries({ queryKey: ['cadenaValor'] });
      toast.success("Criterio de Aceptación eliminado correctamente.");
      resetFormulario();
      setVista("lista");
    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.message || err.response?.data?.Message || (typeof err.response?.data === "string" ? err.response.data : null);
      toast.error(backendMessage || "Ocurrió un error al eliminar el CDA.");
    } finally {
      setIsEliminando(false);
      setDeleteConfirmOpen(false);
    }
  };

  const currentJsonData = integracion ? INTEGRACIONES_MOCKS[integracion] : null;
  const nosisVariables = INTEGRACIONES_MOCKS?.NOSIS?.Contenido?.Datos?.Variables || [];

  const reglaActual = expresion.trim()
    ? `${expresion.trim()} ${simbolocomparacion} ${formatValorParaLog(valorcomparacion)}`
    : "";

  const postSaveModal = (
    <ConfirmacionModal
      isOpen={postSaveModalOpen}
      onClose={() => setPostSaveModalOpen(false)}
      onConfirm={() => { setPostSaveModalOpen(false); navigate("/admin/cadenas-cda"); }}
      titulo="Vincular a una Cadena"
      mensaje='El criterio se guardó correctamente, pero todavía no está activo. ¿Querés ir ahora a "CDAs por Cadena" para vincularlo?'
      variant="blue"
      confirmText="IR AHORA"
      cancelText="MÁS TARDE"
      confirmVariant="blue"
      cancelVariant="outlineBlue"
    />
  );

  if (vista === "lista") {
    return (
      <div className={styles.containerLista}>
        <div className={styles.header}>
          <div className={styles.titleBox}>
            <h1>Criterios de Aceptación Globales</h1>
            <p>Gestioná los criterios de aceptación (CDA) existentes o creá uno nuevo.</p>
          </div>
          <div className={styles.actionsTop}>
            <Button type="button" variant="blue" size="md" onClick={handleCrearNuevo}>
              <FiPlus /> Crear nuevo CDA
            </Button>
          </div>
        </div>

        <div className={styles.filtersCard}>
          <div className={styles.searchWrap}>
            <FiSearch className={styles.iconSearch} />
            <input
              type="text"
              placeholder="Buscar por descripción o expresión..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!isLoadingLista && (
            <span className={styles.listCount}>
              {cdasFiltrados.length} criterio{cdasFiltrados.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Integración</th>
                  <th>Expresión</th>
                  <th>Mensaje de Rechazo</th>
                  <th style={{ textAlign: "center", width: "160px" }}>Vinculación Default</th>
                  <th style={{ width: "2.5rem" }}></th>
                </tr>
              </thead>
              <tbody>
                {isLoadingLista ? (
                  Array.from({ length: 6 }).map((_, i) => <CdaRowSkeleton key={i} styles={styles} />)
                ) : cdasFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <div className={styles.emptyState}>
                        <FiInbox className={styles.emptyStateIcon} />
                        <span>No hay criterios de aceptación cargados todavía.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cdasFiltrados.map((cda) => {
                    const id = getCdaId(cda);
                    const defaultCv = String(getCdaProp(cda, "vinculadefaultcv"));
                    const esDefault = defaultCv === "1" || defaultCv.toUpperCase() === "S";
                    const integ = detectarIntegracion(getCdaProp(cda, "expresion"));
                    const integColor = INTEGRACION_COLORS[integ] || INTEGRACION_COLOR_DEFAULT;
                    return (
                      <tr key={id} className={styles.clickableRow} onClick={() => handleEditarCda(cda)}>
                        <td>
                          <strong>{getCdaProp(cda, "descripcion") || "-"}</strong>
                          <span className={styles.rowIdTag}>ID #{id}</span>
                        </td>
                        <td>
                          <span
                            className={styles.integracionBadge}
                            style={{ background: integColor.bg, color: integColor.color, borderColor: integColor.border }}
                          >
                            {integ || "—"}
                          </span>
                        </td>
                        <td><code className={styles.tableCode}>{getCdaProp(cda, "expresion") || "-"}</code></td>
                        <td>{getCdaProp(cda, "mensajerechazo") || "-"}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className={esDefault ? styles.pillYes : styles.pillNo}>{esDefault ? "Sí" : "No"}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <FiChevronRight className={styles.rowChevron} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {postSaveModal}
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <button type="button" className={styles.backButton} onClick={() => { resetFormulario(); setVista("lista"); }}>
            <FiArrowLeft /> Volver al listado
          </button>
          <h1>{cdaEditando ? "Editar Criterio de Aceptación" : "Criterios de Aceptación Globales"}</h1>
          <p>{cdaEditando ? "Modificá los datos del criterio seleccionado." : "Definí las reglas base (CDA) seleccionando campos directamente desde las integraciones disponibles."}</p>
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
            disabled={isCreando || isActualizando || isProcesando}
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
              styles={styles}
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
                disabled={isCreando || isActualizando || isProcesando}
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
                  disabled={isCreando || isActualizando || isProcesando}
                  variant="admin"
                  error={errorExpresion ? "Campo obligatorio" : undefined}
                />
              </div>

              <div className={styles.fieldRow}>
                <div style={{ flex: "0 0 30%" }}>
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
                    disabled={isCreando || isActualizando || isProcesando}
                    variant="admin"
                  />
                </div>

                <div>
                  <InputSimple
                    label="Valor de Comparación"
                    value={valorcomparacion}
                    onChange={setValorcomparacion}
                    disabled={isCreando || isActualizando || isProcesando || comparaPorVacio}
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
                        if (isCreando || isActualizando || isProcesando) return;
                        const next = !comparaPorVacio;
                        setComparaPorVacio(next);
                        if (next) setValorcomparacion("");
                      }}
                      title="Marcá esto si el criterio compara contra un texto vacío. Si necesitás comparar contra el número 0, escribilo directamente en el campo."
                    >
                      <div className={`${styles.customCheckbox} ${comparaPorVacio ? styles.checkboxChecked : ""}`}>
                        {comparaPorVacio && <FiCheck size={11} className={styles.checkmarkIcon} />}
                      </div>
                      <span className={styles.vacioCheckLabel}>Comparar contra vacío</span>
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
                    disabled={isCreando || isActualizando || isProcesando}
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
                disabled={isCreando || isActualizando || isProcesando}
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
                    disabled={isTesting || isCreando || isActualizando || isProcesando}
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
                    disabled={isCreando || isActualizando || isProcesando || !reglaActual || !testCuit.trim()}
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
                disabled={isCreando || isActualizando || isProcesando}
              />
              {!cdaEditando && (
                <ToggleOptionRow
                  label="Vincular a todas las cadenas existentes"
                  description="Al guardar, este criterio va a pasar a estar activo en todas las cadenas de valor que ya existen, en sus dos pantallas (Ingreso de CUIT y Socios)."
                  checked={vincularExistentes}
                  onToggle={() => setVincularExistentes(!vincularExistentes)}
                  disabled={isCreando || isActualizando || isProcesando}
                />
              )}
              {cdaEditando && (
                <ToggleOptionRow
                  label="Aplicar valor en cadenas activas"
                  description={'Sobrescribe el valor de comparación en cada combinación de cadena y pantalla donde este criterio ya está vinculado y activo (por ejemplo, si en Ingreso de CUIT el score debía ser mayor a 500 y en Socios mayor a 600, en ambas va a quedar el nuevo valor). Después se puede volver a personalizar por cadena y pantalla desde CDAs por Cadena.'}
                  checked={propagarValorATodasCadenas}
                  onToggle={() => setPropagarValorATodasCadenas(!propagarValorATodasCadenas)}
                  disabled={isCreando || isActualizando || isProcesando}
                />
              )}
            </div>
          </div>

          <div className={styles.formActions}>
            {cdaEditando && (
              <Button
                type="button"
                variant="danger"
                size="md"
                onClick={handleEliminarCda}
                disabled={isCreando || isActualizando || isProcesando || isEliminando}
              >
                <FiTrash2 /> Eliminar
              </Button>
            )}
            <Button
              type="submit"
              variant="blue"
              size="md"
              isLoading={isCreando || isActualizando || isProcesando}
              disabled={isEliminando}
            >
              {cdaEditando ? "Guardar Cambios" : "Crear Criterio Global"}
            </Button>
          </div>
        </div>
      </form>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmarCreacion}
        titulo={cdaEditando ? "Confirmar Actualización de Criterio" : "Confirmar Criterio de Aceptación"}
        mensaje={
          <>
            {cdaEditando
              ? "¿Confirmás guardar los cambios de este criterio de aceptación?"
              : "¿Confirmás la creación de este criterio de aceptación global?"}
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
        confirmText={cdaEditando ? "GUARDAR CAMBIOS" : "CREAR CRITERIO"}
        cancelText="CANCELAR"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={isCreando || isActualizando || isProcesando}
      />

      <ConfirmacionModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmEliminarCda}
        titulo="Eliminar Criterio de Aceptación"
        mensaje={
          <>
            ¿Confirmás eliminar el criterio <strong>"{descripcion}"</strong>?
            <br /><br />
            Esta acción borra también su historial y lo desvincula de todas las pantallas y cadenas de valor donde esté en uso. No se puede deshacer.
          </>
        }
        variant="blue"
        tone="danger"
        confirmText="ELIMINAR"
        cancelText="CANCELAR"
        cancelVariant="outlineBlue"
        isLoading={isEliminando}
      />

      {postSaveModal}
    </div>
  );
}
