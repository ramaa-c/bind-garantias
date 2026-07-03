import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCrearCda, useActualizarCda, useObtenerTodosCdas, useProbarCda } from "../../hooks/useCda";
import { cadenaValorService } from "../../services/cadenaValorService";
import { INTEGRACIONES_MOCKS } from "../../utils/integracionesMocks";
import { Button } from "../../components/ui/Button/Button";
import { InputSimple } from "../../components/ui/InputSimple/InputSimple";
import { SelectSimple } from "../../components/ui/SelectSimple/SelectSimple";
import { ConfirmacionModal } from "../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { FiPlus, FiTrash2, FiCheck, FiChevronDown, FiChevronRight, FiSearch, FiArrowLeft, FiAlertTriangle, FiInbox } from "react-icons/fi";
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

// Catálogo de variables de NOSIS extraídas del JSON real
const NOSIS_VARIABLES_CATALOG = [
  { value: "CDA", label: "CDA (Criterio de Aceptación General)" },
  { value: "CDA_DICT", label: "CDA_DICT (Dictamen)" },
  { value: "CDA_AF", label: "CDA_AF (Identidad Válida)" },
  { value: "CDA_VI.EDAD", label: "CDA_VI.EDAD (Edad)" },
  { value: "CDA_VI.FCS", label: "CDA_VI.FCS (Fecha Contrato Social)" },
  { value: "CDA_VI.ACT", label: "CDA_VI.ACT (Actividades)" },
  { value: "CDA_AP", label: "CDA_AP (Aportes Patronales)" },
  { value: "CDA_CI", label: "CDA_CI (Bureau de Crédito del BCRA)" },
  { value: "CDA_OJ", label: "CDA_OJ (Oficios Judiciales)" },
  { value: "CDA_HC", label: "CDA_HC (Cheques Rechazados del BCRA)" },
  { value: "CDA_DE", label: "CDA_DE (Deudores Entidades Liquidadas)" },
  { value: "CDA_QU.1", label: "CDA_QU.1 (Concurso o Quiebra)" },
  { value: "CDA_QU.2", label: "CDA_QU.2 (Pedido Quiebra)" },
  { value: "CDA_QU.3", label: "CDA_QU.3 (Juicios - Demandado)" },
  { value: "CDA_BC", label: "CDA_BC (Comunicaciones del BCRA)" },
  { value: "CDA_RC.P", label: "CDA_RC.P (Referencias Comerciales Propias)" },
  { value: "CDA_RC.T", label: "CDA_RC.T (Referencias Comerciales de Terceros)" },
  { value: "CDA_FA", label: "CDA_FA (Facturas Apócrifas)" },
  { value: "CDA_LD", label: "CDA_LD (Laudos Incumplidos)" },
  { value: "CDA_DF", label: "CDA_DF (Antecedentes Fiscales)" },
  { value: "CDA_DC", label: "CDA_DC (Documentos Cuestionados)" },
  { value: "CDA_DP", label: "CDA_DP (Deudores Previsionales)" },
  { value: "CDA_SCO", label: "CDA_SCO (Score - Estado)" },
  { value: "CDA_Valor.SCO", label: "CDA_Valor.SCO (Score - Valor)" },
  { value: "CDA_NSE", label: "CDA_NSE (Facturación Estimada - Estado)" },
  { value: "CDA_Valor.NSE", label: "CDA_Valor.NSE (Facturación Estimada - Nivel)" },
  { value: "CDA_COMPMENSUALES", label: "CDA_COMPMENSUALES (Compromisos Mensuales)" },
];

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

export default function CdasGlobales() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutateAsync: crearCda, isPending: isCreando } = useCrearCda();
  const { mutateAsync: actualizarCda, isPending: isActualizando } = useActualizarCda();
  const { data: todosCdasData, isLoading: isLoadingLista } = useObtenerTodosCdas();
  const { mutateAsync: probarCda, isPending: isTesting } = useProbarCda();

  // "lista": listado de CDAs existentes. "formulario": alta/edición (misma pantalla para ambos casos).
  const [vista, setVista] = useState("lista");
  const [cdaEditando, setCdaEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [isProcesando, setIsProcesando] = useState(false);
  const [integracion, setIntegracion] = useState("");
  const [cdaMode, setCdaMode] = useState("simple"); // "simple" o "compuesto"
  const [conditions, setConditions] = useState([
    { id: 1, variable: "CDA_Valor.SCO", operador: ">", valor: "500" }
  ]);
  const [connector, setConnector] = useState("AND");

  const [descripcion, setDescripcion] = useState("");
  const [expresion, setExpresion] = useState("");
  const [simbolocomparacion, setSimbolocomparacion] = useState(">");
  const [valorcomparacion, setValorcomparacion] = useState("");
  const [comparaPorVacio, setComparaPorVacio] = useState(false);
  const [mensajerechazo, setMensajerechazo] = useState("");
  const [vinculadefaultcv, setVinculadefaultcv] = useState(true);
  const [validationError, setValidationError] = useState("");
  const [intentoEnviar, setIntentoEnviar] = useState(false);
  const [expresionLog, setExpresionLog] = useState("");
  const [userEditedExpresionLog, setUserEditedExpresionLog] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [postSaveModalOpen, setPostSaveModalOpen] = useState(false);
  const [mostrarExpresionLog, setMostrarExpresionLog] = useState(false);

  // Estados para laboratorio de pruebas de CDAs
  const [testCuit, setTestCuit] = useState("30714430048");
  const [testResult, setTestResult] = useState(null);

  const todosCdasList = Array.isArray(todosCdasData) ? todosCdasData : todosCdasData?.items || todosCdasData?.data || [];

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
    
    const isNumeric = !isNaN(cleanVal) && cleanVal !== "";
    if (isNumeric) {
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
    const isNumericVal = !isNaN(valorSaneado) && valorSaneado !== "";
    if (!isNumericVal && valorSaneado !== "") {
      valorSaneado = applyCasingStrategy(valorSaneado, integracion);
    }
    const valorParaLog = formatValorParaLog(valorSaneado);

    const fullExpression = cdaMode === "compuesto" 
      ? expresion.trim() 
      : `${expresion.trim()} ${simbolocomparacion} ${valorParaLog}`;

    try {
      const res = await probarCda({
        cuit: testCuit.trim(),
        expresion: fullExpression
      });

      setTestResult({
        status: res.status,
        message: res.data?.message || res.data || ""
      });
    } catch (err) {
      console.error(err);
      setTestResult({
        status: 500,
        message: "Error de red o servidor al ejecutar la prueba."
      });
    }
  };

  const handleIntegracionChange = (val) => {
    setIntegracion(val);
    setExpresion(""); // reset expression when changing integration
    setExpresionLog("");
    setUserEditedExpresionLog(false);
    if (val !== "NOSIS") {
      setCdaMode("simple");
    }
  };

  // Generar expresión lógica a partir de las condiciones compuestas
  const generateCompoundExpression = (conds, conn) => {
    if (!conds || conds.length === 0) return "";
    return conds
      .map(c => {
        const val = c.valor.trim();
        const isNum = !isNaN(val) && val !== "";
        const casedVal = applyCasingStrategy(val, integracion);
        const formattedVal = isNum ? val : (casedVal === "" ? "''" : `'${casedVal}'`);
        return `nosis.Variables(${c.variable}) ${c.operador} ${formattedVal}`;
      })
      .join(` ${conn} `);
  };

  useEffect(() => {
    if (integracion === "NOSIS" && cdaMode === "compuesto") {
      const expr = generateCompoundExpression(conditions, connector);
      setExpresion(expr);
      setSimbolocomparacion("");
      setValorcomparacion("");
      if (!userEditedExpresionLog) {
        setExpresionLog(expr);
      }
    }
  }, [conditions, connector, cdaMode, integracion, userEditedExpresionLog]);

  const handleSelectField = (fieldPath) => {
    const prefix = INTEGRACION_PREFIXES[integracion] || "";
    const fullPath = `${prefix}${fieldPath}`;
    setExpresion(fullPath);
    if (!userEditedExpresionLog) {
      setExpresionLog(fullPath);
    }
  };

  const resetFormulario = () => {
    setCdaEditando(null);
    setIntegracion("");
    setCdaMode("simple");
    setConditions([{ id: Date.now(), variable: "CDA_Valor.SCO", operador: ">", valor: "500" }]);
    setConnector("AND");
    setDescripcion("");
    setExpresion("");
    setExpresionLog("");
    setUserEditedExpresionLog(false);
    setSimbolocomparacion(">");
    setValorcomparacion("");
    setComparaPorVacio(false);
    setMensajerechazo("");
    setVinculadefaultcv(true);
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
    setCdaMode("simple");
    setDescripcion(getCdaProp(cda, "descripcion") || "");
    setExpresion(expr);
    setExpresionLog(exprLog || expr);
    setUserEditedExpresionLog(!!exprLog && exprLog !== expr);
    setSimbolocomparacion(simbolo || "=");
    setValorcomparacion(valor);
    setComparaPorVacio(valor.trim() === "");
    setMensajerechazo(getCdaProp(cda, "mensajerechazo") || "");
    setVinculadefaultcv(defaultCv === "" ? true : (defaultCv === "1" || defaultCv.toUpperCase() === "S"));
    setValidationError("");
    setIntentoEnviar(false);
    setTestResult(null);
    setVista("formulario");
  };

  const errorDescripcion = intentoEnviar && !descripcion.trim();
  const errorExpresion = intentoEnviar && cdaMode !== "compuesto" && !expresion.trim();
  const errorValor = intentoEnviar && cdaMode !== "compuesto" && !comparaPorVacio && !valorcomparacion.trim();
  const errorMensaje = intentoEnviar && !mensajerechazo.trim();

  const handleSave = (e) => {
    e.preventDefault();

    const faltaAlgunCampo =
      !descripcion.trim() ||
      (cdaMode !== "compuesto" && !expresion.trim()) ||
      (cdaMode !== "compuesto" && !comparaPorVacio && !valorcomparacion.trim()) ||
      !mensajerechazo.trim();

    if (faltaAlgunCampo) {
      setIntentoEnviar(true);
      return;
    }

    setIntentoEnviar(false);
    setValidationError("");
    setConfirmOpen(true);
  };

  const confirmarCreacion = async () => {
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

    const isNumericVal = !isNaN(valorSaneado) && valorSaneado !== "";
    if (!isNumericVal && valorSaneado !== "") {
      valorSaneado = applyCasingStrategy(valorSaneado, integracion);
    }

    const valorParaLog = formatValorParaLog(valorSaneado);
    const fullExpression = cdaMode === "compuesto"
      ? expresion.trim()
      : `${expresion.trim()} ${simbolocomparacion} ${valorParaLog}`;

    try {
      const resValida = await probarCda({
        cuit: testCuit.trim() || "30714430048",
        expresion: fullExpression
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
      simboloComparacion: cdaMode === "compuesto" ? "" : simbolocomparacion,
      valorComparacion: cdaMode === "compuesto" ? "" : valorSaneado,
      vinculaDefaultCV: vinculadefaultcv ? "1" : "0",
      expresionLog: expresionLog.trim(),
      mensajeRechazo: mensajerechazo.trim()
    };

    try {
      if (esEdicion) {
        await actualizarCda(payloadCda);
        await queryClient.invalidateQueries({ queryKey: ['cda'] });
        toast.success("Criterio de Aceptación actualizado exitosamente.");
        resetFormulario();
        setVista("lista");
        setPostSaveModalOpen(true);
      } else {
        const response = await crearCda(payloadCda);
        const newCdaId = response?.CdaID || response?.cdaID || response?.cdaid || response?.id;

        if (vinculadefaultcv && newCdaId) {
          toast.info("Vinculando criterio de aceptación global a todas las cadenas de valor existentes...");
          try {
            const todasCadenas = await cadenaValorService.obtenerTodasWeb();
            const cadenasList = Array.isArray(todasCadenas) ? todasCadenas : todasCadenas?.items || todasCadenas?.data || [];

            let linkedCount = 0;
            for (const cadena of cadenasList) {
              const cadenaId = cadena.cadenavalorid || cadena.CadenaValorID;
              if (!cadenaId) continue;

              try {
                const linkedCdas = await cadenaValorService.obtenerCdasPorCadenaId(cadenaId);
                const linkedCdasList = Array.isArray(linkedCdas) ? linkedCdas : linkedCdas?.items || linkedCdas?.data || [];

                const yaVinculado = linkedCdasList.some(c => getCdaId(c) === newCdaId);

                if (!yaVinculado) {
                  const listacda = linkedCdasList.map(c => ({
                    cdaid: getCdaId(c),
                    valorcomparacion: c.valorcomparacion !== undefined ? c.valorcomparacion : (c.ValorComparacion !== undefined ? c.ValorComparacion : "")
                  }));

                  listacda.push({
                    cdaid: newCdaId,
                    valorcomparacion: valorSaneado
                  });

                  await cadenaValorService.vincularCdas({
                    cadenavalorid: Number(cadenaId),
                    listacda: listacda
                  });
                  linkedCount++;
                }
              } catch (linkErr) {
                console.error(`Error al vincular CDA default a la cadena ${cadenaId}:`, linkErr);
              }
            }
            if (linkedCount > 0) {
              toast.success(`Vinculado con éxito a ${linkedCount} cadenas de valor.`);
            }
          } catch (chainErr) {
            console.error("Error al obtener cadenas de valor para vinculación automática:", chainErr);
            toast.error("El CDA se creó, pero no se pudo vincular automáticamente a las cadenas existentes.");
          }
        }

        await queryClient.invalidateQueries({ queryKey: ['cda'] });
        await queryClient.invalidateQueries({ queryKey: ["cda", "pantallaGrupo"] });
        await queryClient.invalidateQueries({ queryKey: ['cadenaValor'] });
        toast.success("Criterio de Aceptación Global creado exitosamente.");
        resetFormulario();
        setVista("lista");
        setPostSaveModalOpen(true);
      }
    } catch (err) {
      console.error(err);
      toast.error(esEdicion ? "Ocurrió un error al actualizar el CDA." : "Ocurrió un error al guardar el CDA.");
    } finally {
      setIsProcesando(false);
      setConfirmOpen(false);
    }
  };

  const currentJsonData = integracion ? INTEGRACIONES_MOCKS[integracion] : null;

  const previewSimple = cdaMode !== "compuesto" && expresion.trim()
    ? `${expresion.trim()} ${simbolocomparacion} ${formatValorParaLog(valorcomparacion)}`
    : "";

  const reglaActual = cdaMode === "compuesto" ? expresion.trim() : previewSimple;

  const postSaveModal = (
    <ConfirmacionModal
      isOpen={postSaveModalOpen}
      onClose={() => setPostSaveModalOpen(false)}
      onConfirm={() => { setPostSaveModalOpen(false); navigate("/admin/cdas-pantalla"); }}
      titulo="Vincular a una Pantalla"
      mensaje='El criterio se guardó correctamente, pero todavía no está activo. ¿Querés ir ahora a "CDAs por Pantalla" para vincularlo?'
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
              { value: "CASFOG", label: "CASFOG" },
              { value: "LUFE", label: "LUFE" },
              { value: "NOSIS", label: "NOSIS" },
              { value: "SGRPLUS", label: "SGRPLUS" }
            ]}
            placeholder="-- Seleccioná una integración (opcional) --"
            variant="admin"
            disabled={isCreando || isActualizando || isProcesando}
            hideErrorSpace={true}
          />
          <p className={styles.helperText}>
            Es opcional: solo se usa para navegar la estructura del JSON y armar la expresión con clics. También podés escribirla manualmente sin seleccionar ninguna.
          </p>

          {integracion === "NOSIS" && (
            <div className={styles.modeToggleContainer}>
              <button
                type="button"
                className={`${styles.modeTab} ${cdaMode === "simple" ? styles.modeTabActive : ""}`}
                onClick={() => setCdaMode("simple")}
              >
                Árbol JSON
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${cdaMode === "compuesto" ? styles.modeTabActive : ""}`}
                onClick={() => setCdaMode("compuesto")}
              >
                Reglas Compuestas
              </button>
            </div>
          )}

          {cdaMode === "compuesto" && integracion === "NOSIS" ? (
            <div className={styles.builderContainer}>
              <p className={styles.builderIntro}>
                Combiná múltiples variables del reporte de Nosis para crear reglas de validación complejas.
              </p>

              <div className={styles.connectorWrapper}>
                <span className={styles.connectorLabel}>Conector Lógico:</span>
                <select
                  value={connector}
                  onChange={(e) => setConnector(e.target.value)}
                  className={styles.connectorSelect}
                  disabled={isCreando || isActualizando || isProcesando}
                >
                  <option value="AND">AND (Y)</option>
                  <option value="OR">OR (O)</option>
                </select>
              </div>

              <div className={styles.conditionsList}>
                {conditions.map((cond, idx) => (
                  <div key={cond.id} className={styles.conditionRow}>
                    <select
                      value={cond.variable}
                      onChange={(e) => {
                        const newConds = [...conditions];
                        newConds[idx].variable = e.target.value;
                        setConditions(newConds);
                      }}
                      className={styles.variableSelect}
                      disabled={isCreando || isActualizando || isProcesando}
                    >
                      {NOSIS_VARIABLES_CATALOG.map(item => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={cond.operador}
                      onChange={(e) => {
                        const newConds = [...conditions];
                        newConds[idx].operador = e.target.value;
                        setConditions(newConds);
                      }}
                      className={styles.opSelect}
                      disabled={isCreando || isActualizando || isProcesando}
                    >
                      <option value="=">=</option>
                      <option value=">">&gt;</option>
                      <option value="<">&lt;</option>
                      <option value=">=">&gt;=</option>
                      <option value="<=">&lt;=</option>
                      <option value="<>">&lt;&gt;</option>
                    </select>

                    <input
                      type="text"
                      value={cond.valor}
                      onChange={(e) => {
                        const newConds = [...conditions];
                        newConds[idx].valor = e.target.value;
                        setConditions(newConds);
                      }}
                      placeholder="Valor"
                      className={styles.valInput}
                      disabled={isCreando || isActualizando || isProcesando}
                    />

                    {conditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setConditions(conditions.filter(c => c.id !== cond.id));
                        }}
                        className={styles.btnDelete}
                        title="Eliminar condición"
                        disabled={isCreando || isActualizando || isProcesando}
                      >
                        <FiTrash2 size={14} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  setConditions([
                    ...conditions,
                    { id: Date.now(), variable: "CDA_Valor.SCO", operador: ">", valor: "" }
                  ]);
                }}
                className={styles.btnAddCondition}
                disabled={isCreando || isActualizando || isProcesando}
              >
                <FiPlus size={14} /> Agregar Condición
              </button>

              <div className={styles.previewCard}>
                <div className={styles.previewTitle}>Regla Lógica Generada:</div>
                <div className={styles.previewCode}>
                  {expresion || "(Agregá condiciones para visualizar)"}
                </div>
              </div>
            </div>
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

          <div className={styles.colScroll}>
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
                  disabled={isCreando || isActualizando || isProcesando || cdaMode === "compuesto"}
                  variant="admin"
                  hideErrorSpace={cdaMode === "compuesto"}
                  error={errorExpresion ? "Campo obligatorio" : undefined}
                />
              </div>

              {cdaMode === "compuesto" ? (
                <div className={styles.rightColInfoBox}>
                  ℹ️ <strong>Regla Compuesta Activa:</strong> el operador y el valor se definen desde el constructor de la columna 1.
                </div>
              ) : (
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
                      <span className={styles.valorErrorText}>
                        {errorValor ? "Campo obligatorio" : ""}
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
                        <span className={styles.vacioCheckLabel}>Comparar contra vacío</span>
                        <div className={`${styles.customCheckbox} ${comparaPorVacio ? styles.checkboxChecked : ""}`}>
                          {comparaPorVacio && <FiCheck size={10} className={styles.checkmarkIcon} />}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

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

          {/* Laboratorio de Pruebas: arriba, zona fija */}
          <div className={styles.sandboxContainer}>
            <h3 className={styles.sandboxTitle}>Laboratorio de Pruebas</h3>

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
                  disabled={isCreando || isActualizando || isProcesando || !reglaActual}
                >
                  Probar
                </Button>
              </div>
            </div>

            {testResult && (
              <div className={styles.testResultBox}>
                <div className={styles.testResultHeader}>
                  <span>Resultado:</span>
                  {testResult.status === 202 ? (
                    <span className={styles.badgeSuccess}>202 - VERDADERO</span>
                  ) : testResult.status === 406 ? (
                    <span className={styles.badgeWarning}>406 - FALSO</span>
                  ) : (
                    <span className={styles.badgeDanger}>{testResult.status} - ERROR</span>
                  )}
                </div>
                <div className={styles.testResultMessage}>
                  {testResult.status === 202 && "El criterio es válido y la condición se cumple para el CUIT ingresado."}
                  {testResult.status === 406 && "El criterio es válido, pero la condición no se cumple (da falso) para el CUIT ingresado."}
                  {testResult.status !== 202 && testResult.status !== 406 && (testResult.message || "Error al compilar la expresión o datos faltantes.")}
                </div>
              </div>
            )}
          </div>

          <div className={styles.colDivider} />

          <div className={styles.colScroll}>
            <div className={styles.screenWarningBox}>
              <FiAlertTriangle className={styles.screenWarningIcon} size={20} />
              <div className={styles.screenWarningText}>
                <strong>¡Atención!</strong> Este criterio no se va a aplicar hasta que lo vincules a una pantalla desde <strong>CDAs por Pantalla</strong>.
              </div>
            </div>

            <div
              className={`${styles.defaultCvBox} ${vinculadefaultcv ? styles.defaultCvBoxActive : ""}`}
              onClick={() => { if (!isCreando && !isActualizando && !isProcesando) setVinculadefaultcv(!vinculadefaultcv); }}
            >
              <div className={styles.customCheckboxContainer}>
                <div className={`${styles.customCheckboxLg} ${vinculadefaultcv ? styles.checkboxChecked : ""}`}>
                  {vinculadefaultcv && <FiCheck size={14} className={styles.checkmarkIcon} />}
                </div>
                <div className={styles.checkboxTextGroup}>
                  <span className={styles.checkboxLabelLg}>
                    Marcar como CDA por Defecto
                  </span>
                  <span className={styles.checkboxDescription}>
                    Los CDAs por defecto se vinculan automáticamente a todas las cadenas de valor: a las existentes en el momento de crearlo, y también a las que se creen en el futuro.
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className={styles.formActions}>
            <Button
              type="submit"
              variant="blue"
              size="md"
              isLoading={isCreando || isActualizando || isProcesando}
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

      {postSaveModal}
    </div>
  );
}
