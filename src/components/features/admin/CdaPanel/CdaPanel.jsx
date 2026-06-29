import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiEdit, FiCheck, FiPlus, FiX, FiRotateCcw, FiSave } from "react-icons/fi";
import { toast } from "sonner";
import { useObtenerCdasPorCadenaId, useVincularCdas } from "../../../../hooks/useCadenaValor";
import { useObtenerTodosCdas } from "../../../../hooks/useCda";
import { InputSimple } from "../../../ui/InputSimple/InputSimple";
import { Button } from "../../../ui/Button/Button";
import { Spinner } from "../../../ui/Spinner/Spinner";
import { Modal } from "../../../ui/Modal/Modal";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import { ConfirmacionModal } from "../../shared/ConfirmacionModal/ConfirmacionModal";
import styles from "./CdaPanel.module.css";

export const CdaPanel = ({ activeItem, onClose, isReadOnly = false, hideHeader = false }) => {
  const queryClient = useQueryClient();
  const cadenaId = activeItem?.cadenavalorid;

  // 1. Obtener TODOS los CDAs en el sistema
  const { data: todosCdas, isLoading: isLoadingTodos } = useObtenerTodosCdas();

  // 2. Obtener los CDAs vinculados a esta cadena de valor
  const { data: linkedCdas, isLoading: isLoadingLinked } = useObtenerCdasPorCadenaId(cadenaId);

  const { mutateAsync: vincularCda, isPending: isVinculandoCda } = useVincularCdas();

  // cdaid -> { checked: boolean, valorcomparacion: string, simbolocomparacion: string, expresion: string, mensajerechazo: string }
  const [cdaConfigs, setCdaConfigs] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

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
        {!hideHeader && (
          <>
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
          </>
        )}



        <div className={styles.cdasSection}>
          <div className={styles.cdasTitle}>Configuración de CDAs</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginTop: "1rem" }}>
            {allCdasList.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#8b949e", border: "1px dashed #30363d", borderRadius: "0.5rem" }}>
                No hay CDAs creados en el sistema.
              </div>
            ) : (
              allCdasList
                .filter(cda => !isReadOnly || (cdaConfigs[cda.cdaid]?.checked))
                .map((cda) => {
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
                      <div className={styles.checkboxWrapper} onClick={() => { if(!isReadOnly) handleToggleCda(cda.cdaid) }}>
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
                            disabled={true}
                            onClick={(e) => e.stopPropagation()}
                          />
                          
                          <select
                            value={simboloComparacion}
                            onChange={(e) => handleSymbolChange(cda.cdaid, e.target.value)}
                            className={styles.inlineSymbolSelect}
                            disabled={true}
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
                            disabled={!isChecked || isReadOnly}
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
                            disabled={!isChecked || isReadOnly}
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

      {!isReadOnly && (
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
      )}

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