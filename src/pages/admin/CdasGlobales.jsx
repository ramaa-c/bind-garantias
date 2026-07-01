import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCrearCda } from "../../hooks/useCda";
import { cadenaValorService } from "../../services/cadenaValorService";
import { INTEGRACIONES_MOCKS } from "../../utils/integracionesMocks";
import { Button } from "../../components/ui/Button/Button";
import { InputSimple } from "../../components/ui/InputSimple/InputSimple";
import { SelectSimple } from "../../components/ui/SelectSimple/SelectSimple";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import styles from "./CdasGlobales.module.css";

// Prefijos para cada integración según el formato esperado por el backend
const INTEGRACION_PREFIXES = {
  ARCA: "afip.",
  CASFOG: "casfog.",
  LUFE: "lufe.",
  NOSIS: "nosis.",
  SGRPLUS: "sgrplus."
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

  const handleIntegracionChange = (val) => {
    setIntegracion(val);
    setExpresion(""); // reset expression when changing integration
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
        const formattedVal = isNum ? val : (val === "" ? "''" : `'${val.toLowerCase()}'`);
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
    }
  }, [conditions, connector, cdaMode, integracion]);

  const handleSelectField = (fieldPath) => {
    const prefix = INTEGRACION_PREFIXES[integracion] || "";
    setExpresion(`${prefix}${fieldPath}`);
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

    // Si no es numérico, convertimos el valor a minúsculas
    const isNumericVal = !isNaN(valorSaneado) && valorSaneado !== "";
    if (!isNumericVal && valorSaneado !== "") {
      valorSaneado = valorSaneado.toLowerCase();
    }

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
      
      return `'${cleanVal.toLowerCase()}'`;
    };

    const valorParaLog = formatValorParaLog(valorSaneado);

    try {
      const response = await crearCda({
        cdaID: 0,
        descripcion: descripcion.trim(),
        expresion: expresion.trim(),
        simboloComparacion: cdaMode === "compuesto" ? "" : simbolocomparacion,
        valorComparacion: cdaMode === "compuesto" ? "" : valorSaneado,
        vinculaDefaultCV: vinculadefaultcv ? "1" : "0",
        expresionLog: cdaMode === "compuesto" 
          ? expresion.trim() 
          : `${expresion.trim()} ${simbolocomparacion} ${valorParaLog}`,
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

      await queryClient.invalidateQueries({ queryKey: ['cda'] });
      await queryClient.invalidateQueries({ queryKey: ['cadenaValor'] });
      toast.success("Criterio de Aceptación Global creado exitosamente");
      
      // Limpiar formulario excepto integración
      setDescripcion("");
      setExpresion("");
      setSimbolocomparacion(">");
      setValorcomparacion("");
      setMensajerechazo("");
      setVinculadefaultcv(true);
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
            />

            <InputSimple
              label="Expresión (Campo a evaluar)"
              type="textarea"
              value={expresion}
              onChange={setExpresion}
              disabled={isCreando || isProcesando || cdaMode === "compuesto"}
              variant="admin"
              hideErrorSpace={true}
            />

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
                  />
                  <p className={styles.helperText}>
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
            />

            <div className={styles.formFieldCheck}>
              <input
                id="cda-default"
                type="checkbox"
                checked={vinculadefaultcv}
                onChange={(e) => setVinculadefaultcv(e.target.checked)}
                disabled={isCreando || isProcesando}
              />
              <label htmlFor="cda-default">
                Vincular por defecto a nuevas Cadenas de Valor
              </label>
            </div>

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
