import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiEdit, FiCheck, FiPlus, FiX, FiRotateCcw, FiSave } from "react-icons/fi";
import { toast } from "sonner";
import { useObtenerCdasPorCadenaId, useVincularCdas } from "../../../../hooks/useCadenaValor";
import { useObtenerTodosCdas, useCrearCda } from "../../../../hooks/useCda";
import { InputSimple } from "../../../ui/InputSimple/InputSimple";
import { Button } from "../../../ui/Button/Button";
import { Spinner } from "../../../ui/Spinner/Spinner";
import { Modal } from "../../../ui/Modal/Modal";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import { ConfirmacionModal } from "../../shared/ConfirmacionModal/ConfirmacionModal";
import styles from "./CdaPanel.module.css";

export const CdaPanel = ({ activeItem, onClose }) => {
  const queryClient = useQueryClient();
  const cadenaId = activeItem?.cadenavalorid;

  // 1. Obtener TODOS los CDAs en el sistema
  const { data: todosCdas, isLoading: isLoadingTodos } = useObtenerTodosCdas();

  // 2. Obtener los CDAs vinculados a esta cadena de valor
  const { data: linkedCdas, isLoading: isLoadingLinked } = useObtenerCdasPorCadenaId(cadenaId);

  const { mutateAsync: crearCda, isPending: isCreandoCda } = useCrearCda();
  const { mutateAsync: vincularCda, isPending: isVinculandoCda } = useVincularCdas();

  // cdaid -> { checked: boolean, valorcomparacion: string, simbolocomparacion: string, expresion: string, mensajerechazo: string }
  const [cdaConfigs, setCdaConfigs] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Estados del formulario para agregar CDA
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [expresion, setExpresion] = useState("");
  const [simbolocomparacion, setSimbolocomparacion] = useState(">");
  const [valorcomparacion, setValorcomparacion] = useState("");
  const [mensajerechazo, setMensajerechazo] = useState("");
  const [vinculadefaultcv, setVinculadefaultcv] = useState(false);
  const [validationError, setValidationError] = useState("");

  const allCdasList = Array.isArray(todosCdas) ? todosCdas : todosCdas?.items || todosCdas?.data || [];
  const linkedCdasList = Array.isArray(linkedCdas) ? linkedCdas : linkedCdas?.items || linkedCdas?.data || [];

  // Inicializar estado local a partir de los datos cargados
  useEffect(() => {
    const configs = {};
    allCdasList.forEach(c => {
      configs[c.cdaid] = {
        checked: false,
        valorcomparacion: c.valorcomparacion || "",
        simbolocomparacion: c.simbolocomparacion || "=",
        expresion: c.expresion || "",
        mensajerechazo: c.mensajerechazo || ""
      };
    });
    linkedCdasList.forEach(c => {
      configs[c.cdaid] = {
        checked: true,
        valorcomparacion: c.valorcomparacion || "",
        simbolocomparacion: c.simbolocomparacion || "=",
        expresion: c.expresion || "",
        mensajerechazo: c.mensajerechazo || ""
      };
    });
    setCdaConfigs(configs);
  }, [todosCdas, linkedCdas]);

  const handleToggleCda = (cdaId) => {
    setCdaConfigs(prev => ({
      ...prev,
      [cdaId]: {
        ...prev[cdaId],
        checked: !prev[cdaId]?.checked
      }
    }));
  };

  const handleValueChange = (cdaId, val) => {
    setCdaConfigs(prev => ({
      ...prev,
      [cdaId]: {
        ...prev[cdaId],
        valorcomparacion: val
      }
    }));
  };

  const handleSymbolChange = (cdaId, symbol) => {
    setCdaConfigs(prev => ({
      ...prev,
      [cdaId]: {
        ...prev[cdaId],
        simbolocomparacion: symbol
      }
    }));
  };

  const handleExpressionChange = (cdaId, expr) => {
    setCdaConfigs(prev => ({
      ...prev,
      [cdaId]: {
        ...prev[cdaId],
        expresion: expr
      }
    }));
  };

  const handleRechazoChange = (cdaId, msg) => {
    setCdaConfigs(prev => ({
      ...prev,
      [cdaId]: {
        ...prev[cdaId],
        mensajerechazo: msg
      }
    }));
  };

  // Comparar estado actual vs inicial para habilitar el botón de Guardar
  const hasChanges = () => {
    const currentActiveIds = Object.keys(cdaConfigs)
      .filter(id => cdaConfigs[id]?.checked)
      .map(Number);
    const initialActiveIds = linkedCdasList.map(c => c.cdaid);

    // 1. Ver si cambió la selección de activos/inactivos
    if (currentActiveIds.length !== initialActiveIds.length) return true;
    if (currentActiveIds.some(id => !initialActiveIds.includes(id))) return true;

    // 2. Ver si cambió el valor, el símbolo, la expresión o el mensaje de rechazo en alguno de los activos
    for (const cda of linkedCdasList) {
      const currentConfig = cdaConfigs[cda.cdaid];
      if (!currentConfig) continue;
      if (currentConfig.valorcomparacion !== (cda.valorcomparacion || "")) return true;
      if (currentConfig.simbolocomparacion !== (cda.simbolocomparacion || "=")) return true;
      if (currentConfig.expresion !== (cda.expresion || "")) return true;
      if (currentConfig.mensajerechazo !== (cda.mensajerechazo || "")) return true;
    }

    return false;
  };

  const handleSaveVinculacion = () => {
    setConfirmOpen(true);
  };

  const handleReset = () => {
    const configs = {};
    allCdasList.forEach(c => {
      configs[c.cdaid] = {
        checked: false,
        valorcomparacion: c.valorcomparacion || "",
        simbolocomparacion: c.simbolocomparacion || "=",
        expresion: c.expresion || "",
        mensajerechazo: c.mensajerechazo || ""
      };
    });
    linkedCdasList.forEach(c => {
      configs[c.cdaid] = {
        checked: true,
        valorcomparacion: c.valorcomparacion || "",
        simbolocomparacion: c.simbolocomparacion || "=",
        expresion: c.expresion || "",
        mensajerechazo: c.mensajerechazo || ""
      };
    });
    setCdaConfigs(configs);
    toast.success("CDAs restablecidos a la configuración guardada");
  };

  const confirmSaveVinculacion = async () => {
    try {
      const listacda = Object.entries(cdaConfigs)
        .filter(([_, config]) => config.checked)
        .map(([id, config]) => ({
          cdaid: Number(id),
          valorcomparacion: config.valorcomparacion,
          simbolocomparacion: config.simbolocomparacion,
          expresion: config.expresion,
          mensajerechazo: config.mensajerechazo
        }));

      await vincularCda({
        cadenavalorid: cadenaId,
        listacda: listacda
      });

      await queryClient.invalidateQueries({ queryKey: ['cda', 'todos_list'] });
      await queryClient.invalidateQueries({ queryKey: ['cadenaValor', 'cdas', cadenaId] });
      toast.success("Criterios de aceptación y vinculación actualizados correctamente");
      setConfirmOpen(false);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error al guardar los cambios");
      setConfirmOpen(false);
    }
  };

  const handleCreateAndLinkCda = async (e) => {
    e.preventDefault();
    if (!descripcion.trim() || !expresion.trim() || !valorcomparacion.trim() || !mensajerechazo.trim()) {
      setValidationError("Todos los campos son obligatorios");
      return;
    }
    setValidationError("");

    try {
      // 1. Crear CDA en el catálogo general
      const newCda = await crearCda({
        cdaid: 0,
        descripcion: descripcion.trim(),
        expresion: expresion.trim(),
        simbolocomparacion: simbolocomparacion,
        valorcomparacion: valorcomparacion.trim(),
        vinculadefaultcv: vinculadefaultcv ? "S" : "N",
        expresionlog: `${expresion.trim()} ${simbolocomparacion} ${valorcomparacion.trim()}`,
        mensajerechazo: mensajerechazo.trim()
      });

      let rawId = newCda?.cdaid || newCda?.cdaId || newCda?.CdaId || newCda?.CdaID || newCda?.cdaID || newCda?.Id || newCda?.id || newCda;
      if (rawId && typeof rawId === 'object') {
        const keys = Object.keys(rawId);
        const idKey = keys.find(k => k.toLowerCase() === 'cdaid' || k.toLowerCase() === 'id');
        if (idKey) {
          rawId = rawId[idKey];
        }
      }
      const newCdaId = Number(rawId);

      if (!newCdaId || isNaN(newCdaId)) {
        console.error("Respuesta de la creación de CDA:", newCda);
        throw new Error(`ID no encontrado en la respuesta: ${JSON.stringify(newCda)}`);
      }

      // 2. Vincular el nuevo CDA manteniendo los que ya estaban activos en este panel
      const activeCdaList = Object.entries(cdaConfigs)
        .filter(([_, config]) => config.checked)
        .map(([id, config]) => ({
          cdaid: Number(id),
          valorcomparacion: config.valorcomparacion,
          simbolocomparacion: config.simbolocomparacion,
          expresion: config.expresion,
          mensajerechazo: config.mensajerechazo
        }));

      await vincularCda({
        cadenavalorid: cadenaId,
        listacda: [
          ...activeCdaList,
          {
            cdaid: newCdaId,
            valorcomparacion: valorcomparacion.trim(),
            simbolocomparacion: simbolocomparacion,
            expresion: expresion.trim(),
            mensajerechazo: mensajerechazo.trim()
          }
        ]
      });

      // 3. Invalidar queries para recargar listas
      await queryClient.invalidateQueries({ queryKey: ['cda', 'todos_list'] });
      await queryClient.invalidateQueries({ queryKey: ['cadenaValor', 'cdas', cadenaId] });

      toast.success("Criterio de Aceptación creado y vinculado exitosamente");
      
      // Limpiar formulario
      setDescripcion("");
      setExpresion("");
      setSimbolocomparacion(">");
      setValorcomparacion("");
      setMensajerechazo("");
      setVinculadefaultcv(false);
      setIsFormOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error al guardar el Criterio de Aceptación: " + (err?.response?.data?.message || err.message));
    }
  };

  const isLoading = isLoadingTodos || isLoadingLinked;

  if (isLoading) {
    return (
      <div style={{ padding: "2rem", display: "flex", justifyContent: "center" }}>
        <Spinner size={50} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div className={styles.modalBody}>
        <CadenaHeaderCard
          denominacion={activeItem?.denominacion}
          logo={activeItem?.logo}
          referencia={activeItem?.referencia}
          cadenavalorid={activeItem?.cadenavalorid}
          cuittercero={activeItem?.cuittercero}
        />
        <p style={{ fontSize: "0.825rem", color: "#8b949e", marginBottom: "1.25rem", lineHeight: "1.4" }}>
          Seleccioná los CDAs que se deben ejecutar durante la validación de esta cadena de valor y personalizá sus valores límites y mensajes de rechazo.
        </p>

        {/* SECCION NUEVO CDA */}
        <div className={styles.newCdaSection}>
          {!isFormOpen ? (
            <button
              type="button"
              className={styles.btnAddCda}
              onClick={() => setIsFormOpen(true)}
            >
              <FiPlus size={16} />
              <span>Agregar Criterio de Aceptación (CDA)</span>
            </button>
          ) : (
            <form onSubmit={handleCreateAndLinkCda} className={styles.newCdaForm}>
              <div className={styles.formHeader}>
                <h4>Nuevo Criterio de Aceptación (CDA)</h4>
                <button
                  type="button"
                  className={styles.btnCancelForm}
                  onClick={() => {
                    setIsFormOpen(false);
                    setValidationError("");
                  }}
                >
                  <FiX size={16} />
                </button>
              </div>

              {validationError && (
                <div className={styles.validationError}>
                  {validationError}
                </div>
              )}

              <div className={styles.formGrid}>
                <div className={styles.formField} style={{ gridColumn: "span 2" }}>
                  <label htmlFor="cda-desc">Descripción</label>
                  <input
                    id="cda-desc"
                    type="text"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    placeholder="Ej. Evaluar si la persona supera el score..."
                    required
                    disabled={isCreandoCda || isVinculandoCda}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="cda-expr">Expresión (Ej. campo o variable)</label>
                  <input
                    id="cda-expr"
                    type="text"
                    value={expresion}
                    onChange={(e) => setExpresion(e.target.value)}
                    placeholder="Ej. score"
                    required
                    disabled={isCreandoCda || isVinculandoCda}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="cda-simbolo">Operador de Comparación</label>
                  <select
                    id="cda-simbolo"
                    value={simbolocomparacion}
                    onChange={(e) => setSimbolocomparacion(e.target.value)}
                    required
                    disabled={isCreandoCda || isVinculandoCda}
                    className={styles.selectInput}
                  >
                    <option value="=">=</option>
                    <option value=">">&gt;</option>
                    <option value="<">&lt;</option>
                    <option value=">=">&gt;=</option>
                    <option value="<=">&lt;=</option>
                    <option value="<>">&lt;&gt;</option>
                  </select>
                </div>

                <div className={styles.formField}>
                  <label htmlFor="cda-valor">Valor de Comparación</label>
                  <input
                    id="cda-valor"
                    type="text"
                    value={valorcomparacion}
                    onChange={(e) => setValorcomparacion(e.target.value)}
                    placeholder="Ej. 500"
                    required
                    disabled={isCreandoCda || isVinculandoCda}
                  />
                </div>

                <div className={styles.formField}>
                  <label htmlFor="cda-rechazo">Mensaje de Rechazo</label>
                  <input
                    id="cda-rechazo"
                    type="text"
                    value={mensajerechazo}
                    onChange={(e) => setMensajerechazo(e.target.value)}
                    placeholder="Ej. El cliente supera el score permitido"
                    required
                    disabled={isCreandoCda || isVinculandoCda}
                  />
                </div>

                <div className={styles.formFieldCheck} style={{ gridColumn: "span 2" }}>
                  <label className={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={vinculadefaultcv}
                      onChange={(e) => setVinculadefaultcv(e.target.checked)}
                      disabled={isCreandoCda || isVinculandoCda}
                    />
                    <span>¿Vincular por defecto para nuevas Cadenas de Valor?</span>
                  </label>
                </div>
              </div>

              <div className={styles.formActions}>
                <Button
                  type="submit"
                  variant="blue"
                  size="sm"
                  isLoading={isCreandoCda || isVinculandoCda}
                >
                  Guardar y Vincular
                </Button>
              </div>
            </form>
          )}
        </div>

        <div className={styles.cdasSection}>
          <div className={styles.cdasTitle}>Configuración de CDAs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
            {allCdasList.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#8b949e", border: "1px dashed #30363d", borderRadius: "0.5rem" }}>
                No hay CDAs creados en el sistema.
              </div>
            ) : (
              allCdasList.map((cda) => {
                const config = cdaConfigs[cda.cdaid] || { checked: false, valorcomparacion: cda.valorcomparacion || "", simbolocomparacion: cda.simbolocomparacion || "=", expresion: cda.expresion || "", mensajerechazo: cda.mensajerechazo || "" };
                const isChecked = config.checked;
                const valComparacion = config.valorcomparacion;
                const simboloComparacion = config.simbolocomparacion;
                const exprComparacion = config.expresion;
                const mensajeRechazo = config.mensajerechazo;

                const isDefault = cda.vinculadefaultcv === "S";

                return (
                  <div
                    key={cda.cdaid}
                    className={`${styles.cdaCard} ${isChecked ? styles.cdaCardChecked : ""}`}
                  >
                    <div className={styles.checkboxWrapper} onClick={() => handleToggleCda(cda.cdaid)}>
                      <div className={`${styles.customCheckbox} ${isChecked ? styles.checked : ""}`}>
                        {isChecked && <FiCheck size={14} className={styles.checkmarkIcon} />}
                      </div>
                    </div>
                    <div
                      className={styles.cdaContent}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                        <strong className={styles.cdaTitleText}>{cda.descripcion}</strong>
                        {isDefault && (
                          <span className={styles.defaultBadge}>Por Defecto</span>
                        )}
                      </div>

                      {/* Formula Visual con Inputs en Línea */}
                      <div className={styles.formulaWrapper}>
                        <span className={styles.formulaLabel}>Regla:</span>
                        
                        <input
                          type="text"
                          value={exprComparacion}
                          onChange={(e) => handleExpressionChange(cda.cdaid, e.target.value)}
                          className={styles.inlineExpressionInput}
                          placeholder="Expresión"
                          disabled={!isChecked}
                          onClick={(e) => e.stopPropagation()}
                        />
                        
                        <select
                          value={simboloComparacion}
                          onChange={(e) => handleSymbolChange(cda.cdaid, e.target.value)}
                          className={styles.inlineSymbolSelect}
                          disabled={!isChecked}
                          onClick={(e) => e.stopPropagation()}
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
                          value={valComparacion}
                          onChange={(e) => handleValueChange(cda.cdaid, e.target.value)}
                          className={styles.inlineValueInput}
                          placeholder="Valor"
                          disabled={!isChecked}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      {/* Edición en Línea del Mensaje de Rechazo */}
                      <div className={styles.inlineRechazoWrapper}>
                        <span className={styles.inlineRechazoLabel}>Mensaje Rechazo:</span>
                        <input
                          type="text"
                          value={mensajeRechazo}
                          onChange={(e) => handleRechazoChange(cda.cdaid, e.target.value)}
                          className={styles.inlineRechazoInput}
                          placeholder="Mensaje de rechazo que verá el analista..."
                          disabled={!isChecked}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className={styles.actionsWrapper}>
                      <span className={`${styles.cdaStatusBadge} ${isChecked ? styles.badgeActive : styles.badgeInactive}`}>
                        {isChecked ? "Activo" : "Inactivo"}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <div className={styles.mainFooter}>
        <Button
          type="button"
          variant="outlineBlue"
          size="sm"
          onClick={handleReset}
        >
          <FiRotateCcw style={{ marginRight: "0.5rem" }} />
          REESTABLECER
        </Button>
        <Button
          type="button"
          variant="blue"
          size="sm"
          onClick={handleSaveVinculacion}
          disabled={!hasChanges()}
          isLoading={isVinculandoCda}
        >
          <FiSave style={{ marginRight: "0.5rem" }} />
          VINCULAR SELECCIÓN
        </Button>
      </div>

      <ConfirmacionModal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmSaveVinculacion}
        titulo="Confirmar Vinculación de CDAs"
        mensaje="¿Estás seguro de que deseas guardar la vinculación de criterios de aceptación para esta cadena de valor?"
        variant="blue"
        confirmText="VINCULAR"
        cancelText="CANCELAR"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
        isLoading={isVinculandoCda}
      />
    </div>
  );
};