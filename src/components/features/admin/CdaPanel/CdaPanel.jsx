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

export const CdaPanel = ({ activeItem, onClose, isReadOnly = false, hideUnchecked = isReadOnly, hideHeader = false, hideCheckboxes = false }) => {
  const queryClient = useQueryClient();
  const cadenaId = activeItem?.cadenavalorid;

  // 1. Obtener TODOS los CDAs en el sistema
  const { data: todosCdas, isLoading: isLoadingTodos } = useObtenerTodosCdas();

  // 2. Obtener los CDAs vinculados a esta cadena de valor
  const { data: linkedCdas, isLoading: isLoadingLinked } = useObtenerCdasPorCadenaId(cadenaId);

  const { mutateAsync: vincularCda, isPending: isVinculandoCda } = useVincularCdas();
  const allCdasList = Array.isArray(todosCdas) ? todosCdas : todosCdas?.items || todosCdas?.data || [];
  const linkedCdasList = Array.isArray(linkedCdas) ? linkedCdas : linkedCdas?.items || linkedCdas?.data || [];

  const getCdaId = (c) => {
    if (!c) return undefined;
    return c.cdaid !== undefined ? c.cdaid : (c.CdaId !== undefined ? c.CdaId : c.CdaID);
  };

  const getCdaProperty = (c, propName) => {
    if (!c) return "";
    if (propName === "vinculadefaultcv") {
      return c.vinculadefaultcv !== undefined ? c.vinculadefaultcv : (c.VinculaDefaultCV !== undefined ? c.VinculaDefaultCV : "");
    }
    const pascalPropName = propName.charAt(0).toUpperCase() + propName.slice(1);
    return c[propName] !== undefined ? c[propName] : (c[pascalPropName] !== undefined ? c[pascalPropName] : "");
  };

  // cdaid -> { checked: boolean, valorcomparacion: string, simbolocomparacion: string, expresion: string, mensajerechazo: string }
  const [cdaConfigs, setCdaConfigs] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Inicializar estado local a partir de los datos cargados
  useEffect(() => {
    const configs = {};
    allCdasList.forEach(c => {
      const id = getCdaId(c);
      if (id === undefined) return;
      configs[id] = {
        checked: false,
        valorcomparacion: getCdaProperty(c, "valorcomparacion") || "",
        simbolocomparacion: getCdaProperty(c, "simbolocomparacion") || "=",
        expresion: getCdaProperty(c, "expresion") || "",
        mensajerechazo: getCdaProperty(c, "mensajerechazo") || ""
      };
    });
    linkedCdasList.forEach(c => {
      const id = getCdaId(c);
      if (id === undefined) return;
      configs[id] = {
        checked: true,
        valorcomparacion: getCdaProperty(c, "valorcomparacion") || "",
        simbolocomparacion: getCdaProperty(c, "simbolocomparacion") || "=",
        expresion: getCdaProperty(c, "expresion") || "",
        mensajerechazo: getCdaProperty(c, "mensajerechazo") || ""
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
    const initialActiveIds = linkedCdasList.map(c => getCdaId(c)).filter(id => id !== undefined);

    // 1. Ver si cambió la selección de activos/inactivos
    if (currentActiveIds.length !== initialActiveIds.length) return true;
    if (currentActiveIds.some(id => !initialActiveIds.includes(id))) return true;

    // 2. Ver si cambió el valor, el símbolo, la expresión o el mensaje de rechazo en alguno de los activos
    for (const cda of linkedCdasList) {
      const id = getCdaId(cda);
      if (id === undefined) continue;
      const currentConfig = cdaConfigs[id];
      if (!currentConfig) continue;
      if (String(currentConfig.valorcomparacion || "") !== String(getCdaProperty(cda, "valorcomparacion") || "")) return true;
      if (String(currentConfig.simbolocomparacion || "=") !== String(getCdaProperty(cda, "simbolocomparacion") || "=")) return true;
      if (String(currentConfig.expresion || "") !== String(getCdaProperty(cda, "expresion") || "")) return true;
      if (String(currentConfig.mensajerechazo || "") !== String(getCdaProperty(cda, "mensajerechazo") || "")) return true;
    }

    return false;
  };

  const handleSaveVinculacion = () => {
    setConfirmOpen(true);
  };

  const handleReset = () => {
    const configs = {};
    allCdasList.forEach(c => {
      const id = getCdaId(c);
      if (id === undefined) return;
      configs[id] = {
        checked: false,
        valorcomparacion: getCdaProperty(c, "valorcomparacion") || "",
        simbolocomparacion: getCdaProperty(c, "simbolocomparacion") || "=",
        expresion: getCdaProperty(c, "expresion") || "",
        mensajerechazo: getCdaProperty(c, "mensajerechazo") || ""
      };
    });
    linkedCdasList.forEach(c => {
      const id = getCdaId(c);
      if (id === undefined) return;
      configs[id] = {
        checked: true,
        valorcomparacion: getCdaProperty(c, "valorcomparacion") || "",
        simbolocomparacion: getCdaProperty(c, "simbolocomparacion") || "=",
        expresion: getCdaProperty(c, "expresion") || "",
        mensajerechazo: getCdaProperty(c, "mensajerechazo") || ""
      };
    });
    setCdaConfigs(configs);
    toast.success("CDAs restablecidos a la configuración guardada");
  };

  const confirmSaveVinculacion = async () => {
    try {
      const listacda = Object.entries(cdaConfigs)
        .filter(([_, config]) => config.checked)
        .map(([id, config]) => {
          let valorSaneado = String(config.valorcomparacion || "").trim();
          if (valorSaneado === '""' || valorSaneado === "''") {
            valorSaneado = "";
          }
          return {
            cdaid: Number(id),
            valorcomparacion: valorSaneado
          };
        });

      await vincularCda({
        cadenavalorid: Number(cadenaId),
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
            <p style={{ fontSize: "0.825rem", color: "#8b949e", lineHeight: "1.4" }}>
              {isReadOnly 
                ? "Listado de los CDAs que se encuentran activos y vinculados para validar esta cadena de valor."
                : "Seleccioná los CDAs que se deben ejecutar durante la validación de esta cadena de valor y personalizá sus valores límites y mensajes de rechazo."}
            </p>
          </>
        )}

        <div className={`${styles.cdasSection} ${isReadOnly ? styles.readOnly : ""}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {allCdasList.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#8b949e", border: "1px dashed #30363d", borderRadius: "0.5rem" }}>
                No hay CDAs creados en el sistema.
              </div>
            ) : (
              allCdasList
                .filter(cda => !hideUnchecked || (cdaConfigs[getCdaId(cda)]?.checked))
                .map((cda) => {
                  const id = getCdaId(cda);
                  if (id === undefined) return null;

                  const config = cdaConfigs[id] || { 
                    checked: false, 
                    valorcomparacion: getCdaProperty(cda, "valorcomparacion") || "", 
                    simbolocomparacion: getCdaProperty(cda, "simbolocomparacion") || "=", 
                    expresion: getCdaProperty(cda, "expresion") || "", 
                    mensajerechazo: getCdaProperty(cda, "mensajerechazo") || "" 
                  };

                  const isChecked = config.checked;
                  const valComparacion = config.valorcomparacion;
                  const simboloComparacion = config.simbolocomparacion;
                  const exprComparacion = config.expresion;
                  const mensajeRechazo = config.mensajerechazo;

                  const isDefault = String(getCdaProperty(cda, "vinculadefaultcv")) === "1" || String(getCdaProperty(cda, "vinculadefaultcv")).toUpperCase() === "S";

                  return (
                    <div
                      key={id}
                      className={`${styles.cdaCard} ${isChecked ? styles.cdaCardChecked : ""}`}
                    >
                      {!hideCheckboxes && (
                        <div className={styles.checkboxWrapper} onClick={() => { if(!isReadOnly) handleToggleCda(id) }}>
                          <div className={`${styles.customCheckbox} ${isChecked ? styles.checked : ""}`}>
                            {isChecked && <FiCheck size={14} className={styles.checkmarkIcon} />}
                          </div>
                        </div>
                      )}
                      <div
                        className={styles.cdaContent}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <strong className={styles.cdaTitleText}>{getCdaProperty(cda, "descripcion")}</strong>
                          {isDefault && (
                            <span className={styles.defaultBadge}>Por Defecto</span>
                          )}
                        </div>

                        {/* Formula Visual con Inputs en Línea */}
                        <div className={styles.formulaWrapper}>
                          <span className={styles.formulaLabel}>Regla:</span>
                          
                          <span className={styles.formulaPart} onClick={(e) => e.stopPropagation()}>
                            {exprComparacion}
                          </span>
                          
                          <span className={styles.inlineSymbolBadge} onClick={(e) => e.stopPropagation()}>
                            {simboloComparacion}
                          </span>

                          <input
                            type="text"
                            value={valComparacion}
                            onChange={(e) => handleValueChange(id, e.target.value)}
                            className={styles.inlineValueInput}
                            placeholder="Valor"
                            disabled={!isChecked || isReadOnly}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        {/* Mensaje de Rechazo de muestra */}
                        <div className={styles.inlineRechazoWrapper}>
                          <span className={styles.inlineRechazoLabel}>Mensaje Rechazo:</span>
                          <span className={styles.inlineRechazoVal} onClick={(e) => e.stopPropagation()}>
                            {mensajeRechazo || "Sin mensaje de rechazo configurado"}
                          </span>
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