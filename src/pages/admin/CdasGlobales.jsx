import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCrearCda, useProbarCda } from "../../hooks/useCda";
import { cadenaValorService } from "../../services/cadenaValorService";
import { INTEGRACIONES_MOCKS } from "../../utils/integracionesMocks";
import { Button } from "../../components/ui/Button/Button";
import { InputSimple } from "../../components/ui/InputSimple/InputSimple";
import { SelectSimple } from "../../components/ui/SelectSimple/SelectSimple";
import { FiPlus, FiTrash2, FiCheck } from "react-icons/fi";
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

export default function CdasGlobales() {
  const queryClient = useQueryClient();
  const { mutateAsync: crearCda, isPending: isCreando } = useCrearCda();
  const { mutateAsync: probarCda, isPending: isTesting } = useProbarCda();

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
  const [mensajerechazo, setMensajerechazo] = useState("");
  const [vinculadefaultcv, setVinculadefaultcv] = useState(true);
  const [validationError, setValidationError] = useState("");
  const [expresionLog, setExpresionLog] = useState("");
  const [userEditedExpresionLog, setUserEditedExpresionLog] = useState(false);

  // Estado para vinculación automática a pantalla
  const [vincularPantalla, setVincularPantalla] = useState("");

  // Estados para laboratorio de pruebas de CDAs
  const [testCuit, setTestCuit] = useState("30714430048");
  const [testResult, setTestResult] = useState(null);

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

  const handleSave = async (e) => {
    e.preventDefault();
    if (!descripcion.trim() || !expresion.trim() || !mensajerechazo.trim()) {
      setValidationError("Por favor completá todos los campos obligatorios.");
      return;
    }
    if (!integracion) {
      setValidationError("Debés seleccionar una integración.");
      return;
    }
    
    setValidationError("");
    setIsProcesando(true);

    // Saneamos el valor de comparación para evitar almacenar comillas externas en la DB
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

    try {
      const response = await crearCda({
        cdaID: 0,
        descripcion: descripcion.trim(),
        expresion: expresion.trim(),
        simboloComparacion: cdaMode === "compuesto" ? "" : simbolocomparacion,
        valorComparacion: cdaMode === "compuesto" ? "" : valorSaneado,
        vinculaDefaultCV: vinculadefaultcv ? "1" : "0",
        expresionLog: expresionLog.trim(),
        mensajeRechazo: mensajerechazo.trim()
      });

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
              
              const getCdaId = (c) => c.cdaid !== undefined ? c.cdaid : (c.CdaId !== undefined ? c.CdaId : c.CdaID);
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

      // Vincular a pantalla seleccionada si corresponde
      if (vincularPantalla && newCdaId) {
        toast.info(`Vinculando criterio a la pantalla ${vincularPantalla}...`);
        
        let listacda = [];
        let expresionAgrupacionActual = "";
        
        try {
          const currentConfig = await cdaService.obtenerPantallaGrupoCda(vincularPantalla, 0);
          if (currentConfig) {
            expresionAgrupacionActual = currentConfig.ExpresionAgrupacion || currentConfig.expresionAgrupacion || "";
            const currentList = currentConfig.ListaCda || currentConfig.listaCda || [];
            listacda = currentList.map(c => {
              if (typeof c === "object" && c !== null) {
                return c.cdaid || c.CdaId || c.CdaID || c.id;
              }
              return Number(c);
            }).filter(Boolean);
          }
        } catch (fetchErr) {
          console.warn("No se pudo obtener la configuración existente de la pantalla (puede que no exista aún):", fetchErr);
        }
        
        try {
          if (!listacda.includes(Number(newCdaId))) {
            listacda.push(Number(newCdaId));
          }

          let nuevaExpresion = "";
          if (expresionAgrupacionActual.trim()) {
            nuevaExpresion = `(${expresionAgrupacionActual.trim()}) and cda${newCdaId}`;
          }

          await cdaService.vincularPantallaCda({
            Pantalla: vincularPantalla,
            ExpresionAgrupacion: nuevaExpresion,
            ListaCda: listacda
          });

          toast.success(`Criterio vinculado exitosamente a ${vincularPantalla}`);
        } catch (linkScreenErr) {
          console.error("Error al vincular a la pantalla seleccionada:", linkScreenErr);
          toast.error(`No se pudo vincular automáticamente a la pantalla ${vincularPantalla}`);
        }
      }

      await queryClient.invalidateQueries({ queryKey: ['cda'] });
      await queryClient.invalidateQueries({ queryKey: ["cda", "pantallaGrupo"] });
      await queryClient.invalidateQueries({ queryKey: ['cadenaValor'] });
      toast.success("Criterio de Aceptación Global creado exitosamente");
      
      // Limpiar formulario excepto integración
      setDescripcion("");
      setExpresion("");
      setExpresionLog("");
      setUserEditedExpresionLog(false);
      setSimbolocomparacion(">");
      setValorcomparacion("");
      setMensajerechazo("");
      setVinculadefaultcv(true);
      setVincularPantalla("");
      setConditions([
        { id: Date.now(), variable: "CDA_Valor.SCO", operador: ">", valor: "500" }
      ]);
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error al guardar el CDA.");
    } finally {
      setIsProcesando(false);
    }
  };

  const currentJsonData = integracion ? INTEGRACIONES_MOCKS[integracion] : null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>Criterios de Aceptación Globales</h1>
          <p>Definí las reglas base (CDA) seleccionando campos directamente desde las integraciones disponibles.</p>
        </div>
      </div>

      <div className={styles.mainLayout}>
        {/* COLUMNA IZQUIERDA: Selector e Interfaz JSON */}
        <div className={styles.leftColWrapper}>
          <div className={styles.leftCol}>
          <div>
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
              placeholder="-- Seleccioná una integración --"
              variant="admin"
              disabled={isCreando || isProcesando}
              hideErrorSpace={true}
            />
          </div>

          {integracion === "NOSIS" && (
            <div className={styles.modeToggleContainer}>
              <button
                type="button"
                className={`${styles.modeTab} ${cdaMode === "simple" ? styles.modeTabActive : ""}`}
                onClick={() => setCdaMode("simple")}
              >
                Vista Simple (Árbol JSON)
              </button>
              <button
                type="button"
                className={`${styles.modeTab} ${cdaMode === "compuesto" ? styles.modeTabActive : ""}`}
                onClick={() => setCdaMode("compuesto")}
              >
                Creador de Reglas Nosis (Compuestas)
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
                  disabled={isCreando || isProcesando}
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
                      disabled={isCreando || isProcesando}
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
                      disabled={isCreando || isProcesando}
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
                      disabled={isCreando || isProcesando}
                    />

                    {conditions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => {
                          setConditions(conditions.filter(c => c.id !== cond.id));
                        }}
                        className={styles.btnDelete}
                        title="Eliminar condición"
                        disabled={isCreando || isProcesando}
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
                disabled={isCreando || isProcesando}
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
        </div>

        {/* COLUMNA DERECHA: Formulario de Creación */}
        <div className={styles.rightCol}>
          <h2 className={styles.formSectionTitle}>Definición de Regla</h2>
          
          <form onSubmit={handleSave} className={styles.formSection}>
            {validationError && (
              <div className={styles.validationError}>
                {validationError}
              </div>
            )}

            <InputSimple
              label="Descripción del CDA"
              value={descripcion}
              onChange={setDescripcion}
              disabled={isCreando || isProcesando}
              variant="admin"
              hideErrorSpace={true}
            />

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
              disabled={isCreando || isProcesando || cdaMode === "compuesto"}
              variant="admin"
              hideErrorSpace={true}
            />

            <InputSimple
              label="Expresión de Retorno para Logs (Opcional)"
              type="textarea"
              value={expresionLog}
              onChange={(val) => {
                setExpresionLog(val);
                setUserEditedExpresionLog(true);
              }}
              disabled={isCreando || isProcesando}
              variant="admin"
              hideErrorSpace={true}
            />
            <p className={styles.helperText} style={{ marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
              Por defecto se autocompleta con el campo a evaluar. Podés ingresar múltiples campos de retorno separados por coma.
            </p>

            {cdaMode === "compuesto" ? (
              <div className={styles.rightColInfoBox} style={{ marginTop: "-0.5rem", marginBottom: "0.75rem" }}>
                ℹ️ <strong>Regla Compuesta Activa:</strong> El operador y el valor se definen a partir de las condiciones en el constructor de la izquierda.
              </div>
            ) : (
              <div style={{ display: "flex", gap: "1rem" }}>
                <div style={{ flex: 1 }}>
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
                    disabled={isCreando || isProcesando}
                    variant="admin"
                  />
                </div>

                <div style={{ flex: 2 }}>
                  <InputSimple
                    label="Valor de Comparación"
                    value={valorcomparacion}
                    onChange={setValorcomparacion}
                    disabled={isCreando || isProcesando}
                    variant="admin"
                    hideErrorSpace={true}
                  />
                  <p className={styles.helperText} style={{ marginTop: "0.25rem" }}>
                    Si querés comparar por vacío, dejá este campo vacío.
                  </p>
                </div>
              </div>
            )}

            <InputSimple
              label="Mensaje de Rechazo Global"
              value={mensajerechazo}
              onChange={setMensajerechazo}
              disabled={isCreando || isProcesando}
              variant="admin"
              hideErrorSpace={true}
            />

            <SelectSimple
              label="Vincular a Pantalla al crear (Opcional)"
              value={vincularPantalla}
              onChange={setVincularPantalla}
              options={[
                { value: "", label: "-- No vincular --" },
                { value: "PANTALLA_INGRESO_CUIT", label: "PANTALLA_INGRESO_CUIT (Validación inicial de CUIT)" },
                { value: "PANTALLA_SOCIOS", label: "PANTALLA_SOCIOS (Validación de Socios y Representantes)" }
              ]}
              placeholder="-- Seleccioná una pantalla --"
              variant="admin"
              disabled={isCreando || isProcesando}
              hideErrorSpace={true}
            />

            {/* Checkbox Vincular por defecto (Premium e Interactivo) */}
            <div 
              className={styles.customCheckboxContainer} 
              onClick={() => { if (!isCreando && !isProcesando) setVinculadefaultcv(!vinculadefaultcv); }}
            >
              <div className={`${styles.customCheckbox} ${vinculadefaultcv ? styles.checkboxChecked : ""}`}>
                {vinculadefaultcv && <FiCheck size={12} className={styles.checkmarkIcon} />}
              </div>
              <span className={styles.checkboxLabel}>
                Vincular por defecto a nuevas Cadenas de Valor
              </span>
            </div>

            {/* Laboratorio de Pruebas (Opcional) */}
            {integracion && expresion.trim() && (
              <div className={styles.sandboxContainer}>
                <h3 className={styles.sandboxTitle}>Laboratorio de Pruebas (Opcional)</h3>
                <p className={styles.sandboxIntro}>
                  Probá el criterio en tiempo real contra los datos de un CUIT antes de guardarlo.
                </p>
                
                <div style={{ display: "flex", gap: "1rem", alignItems: "flex-end", marginBottom: "0.25rem" }}>
                  <div style={{ flex: 1 }}>
                    <InputSimple
                      label="CUIT para la prueba"
                      value={testCuit}
                      onChange={setTestCuit}
                      disabled={isTesting || isCreando || isProcesando}
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
                      disabled={isCreando || isProcesando}
                    >
                      Probar Expresión
                    </Button>
                  </div>
                </div>

                {testResult && (
                  <div className={styles.testResultBox}>
                    <div className={styles.testResultHeader}>
                      <span>Resultado de Validación:</span>
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
            )}

            <div className={styles.formActions}>
              <Button
                type="submit"
                variant="blue"
                size="md"
                isLoading={isCreando || isProcesando}
              >
                Crear Criterio Global
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
