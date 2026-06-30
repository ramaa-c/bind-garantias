import React, { useState } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useCrearCda } from "../../hooks/useCda";
import { INTEGRACIONES_MOCKS } from "../../utils/integracionesMocks";
import { Button } from "../../components/ui/Button/Button";
import { InputSimple } from "../../components/ui/InputSimple/InputSimple";
import { SelectSimple } from "../../components/ui/SelectSimple/SelectSimple";
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

export default function CdasGlobales() {
  const queryClient = useQueryClient();
  const { mutateAsync: crearCda, isPending: isCreando } = useCrearCda();

  const [integracion, setIntegracion] = useState("");
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
  };

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

    // Saneamos el valor de comparación para evitar almacenar comillas literales \"\" en la DB
    let valorSaneado = valorcomparacion.trim();
    if (valorSaneado === '""' || valorSaneado === "''") {
      valorSaneado = "";
    }

    // Para el log de evaluación, si está vacío le ponemos comillas para mantener validez sintáctica
    const valorParaLog = valorSaneado === "" ? '""' : valorSaneado;

    try {
      await crearCda({
        cdaid: 0,
        descripcion: descripcion.trim(),
        expresion: expresion.trim(),
        simbolocomparacion: simbolocomparacion,
        valorcomparacion: valorSaneado,
        vinculadefaultcv: vinculadefaultcv ? "1" : "0",
        expresionlog: `${expresion.trim()} ${simbolocomparacion} ${valorParaLog}`,
        mensajerechazo: mensajerechazo.trim()
      });

      await queryClient.invalidateQueries({ queryKey: ['cda', 'todos_list'] });
      toast.success("Criterio de Aceptación Global creado exitosamente");
      
      // Limpiar formulario excepto integración
      setDescripcion("");
      setExpresion("");
      setSimbolocomparacion(">");
      setValorcomparacion("");
      setMensajerechazo("");
      setVinculadefaultcv(true);
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error al guardar el CDA.");
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
            />
          </div>

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
              disabled={isCreando}
              variant="admin"
            />

            <InputSimple
              label="Expresión (Campo a evaluar)"
              value={expresion}
              onChange={setExpresion}
              disabled={isCreando}
              variant="admin"
            />

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
                  disabled={isCreando}
                  variant="admin"
                />
              </div>

              <div style={{ flex: 2 }}>
                <InputSimple
                  label="Valor de Comparación"
                  value={valorcomparacion}
                  onChange={setValorcomparacion}
                  disabled={isCreando}
                  variant="admin"
                />
                <p className={styles.helperText}>
                  Dejá vacío o escribí <code>""</code> para evaluar un texto vacío.
                </p>
              </div>
            </div>

            <InputSimple
              label="Mensaje de Rechazo Global"
              value={mensajerechazo}
              onChange={setMensajerechazo}
              disabled={isCreando}
              variant="admin"
            />

            <div className={styles.formFieldCheck}>
              <input
                id="cda-default"
                type="checkbox"
                checked={vinculadefaultcv}
                onChange={(e) => setVinculadefaultcv(e.target.checked)}
                disabled={isCreando}
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
                isLoading={isCreando}
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
