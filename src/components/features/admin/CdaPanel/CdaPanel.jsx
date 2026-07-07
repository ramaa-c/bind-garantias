import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiCheck, FiRotateCcw, FiSave, FiLock, FiEdit3, FiSearch } from "react-icons/fi";
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
  const [searchTerm, setSearchTerm] = useState("");

  // La expresión, el operador y el mensaje de rechazo son propiedades del CDA global
  // (nunca se editan por cadena) y siempre salen de allCdasList. El endpoint de
  // vinculación por cadena solo devuelve {cdaid, valorcomparacion}, así que ese es
  // el único campo que puede pisar el valor por defecto.
  const buildCdaConfigs = (allList, linkedList) => {
    const configs = {};
    allList.forEach(c => {
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
    linkedList.forEach(c => {
      const id = getCdaId(c);
      if (id === undefined || !configs[id]) return;
      configs[id] = {
        ...configs[id],
        checked: true,
        valorcomparacion: getCdaProperty(c, "valorcomparacion") || ""
      };
    });
    return configs;
  };

  // Inicializar estado local a partir de los datos cargados
  useEffect(() => {
    setCdaConfigs(buildCdaConfigs(allCdasList, linkedCdasList));
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

  // Comparar estado actual vs inicial para habilitar el botón de Guardar
  const hasChanges = () => {
    const currentActiveIds = Object.keys(cdaConfigs)
      .filter(id => cdaConfigs[id]?.checked)
      .map(Number);
    const initialActiveIds = linkedCdasList.map(c => getCdaId(c)).filter(id => id !== undefined);

    // 1. Ver si cambió la selección de activos/inactivos
    if (currentActiveIds.length !== initialActiveIds.length) return true;
    if (currentActiveIds.some(id => !initialActiveIds.includes(id))) return true;

    // 2. Ver si cambió el valor de comparación en alguno de los activos (es lo único editable por cadena)
    for (const cda of linkedCdasList) {
      const id = getCdaId(cda);
      if (id === undefined) continue;
      const currentConfig = cdaConfigs[id];
      if (!currentConfig) continue;
      if (String(currentConfig.valorcomparacion || "") !== String(getCdaProperty(cda, "valorcomparacion") || "")) return true;
    }

    return false;
  };

  const handleSaveVinculacion = () => {
    setConfirmOpen(true);
  };

  const handleReset = () => {
    setCdaConfigs(buildCdaConfigs(allCdasList, linkedCdasList));
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

  const cdasVisibles = allCdasList
    .filter(cda => !hideUnchecked || (cdaConfigs[getCdaId(cda)]?.checked))
    .filter(cda => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      return (
        String(getCdaProperty(cda, "descripcion")).toLowerCase().includes(term) ||
        String(getCdaProperty(cda, "expresion")).toLowerCase().includes(term)
      );
    });

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
          <CadenaHeaderCard
            denominacion={activeItem?.denominacion}
            logo={activeItem?.logo}
            referencia={activeItem?.referencia}
            cadenavalorid={activeItem?.cadenavalorid}
            cuittercero={activeItem?.cuittercero}
          />
        )}
        <p style={{ fontSize: "0.825rem", color: "#8b949e", lineHeight: "1.4" }}>
          {isReadOnly
            ? "Listado de los CDAs activos para esta cadena. La regla y el mensaje de rechazo se definen en Criterios de Aceptación; el valor mostrado es el vigente para esta cadena."
            : "Activá los CDAs que se deben ejecutar para esta cadena. La regla y el mensaje de rechazo son los definidos en Criterios de Aceptación: acá solo podés personalizar, por cadena, el valor límite de cada uno."}
        </p>

        {!hideUnchecked && allCdasList.length > 0 && (
          <div className={styles.searchWrap}>
            <FiSearch className={styles.iconSearch} />
            <input
              type="text"
              placeholder="Buscar por descripción o expresión..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        )}

        <div className={`${styles.cdasSection} ${isReadOnly ? styles.readOnly : ""}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {allCdasList.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#8b949e", border: "1px dashed #30363d", borderRadius: "0.5rem" }}>
                No hay CDAs creados en el sistema.
              </div>
            ) : cdasVisibles.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#8b949e", border: "1px dashed #30363d", borderRadius: "0.5rem" }}>
                No se encontraron CDAs que coincidan con la búsqueda.
              </div>
            ) : (
              cdasVisibles
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

                  const valorGlobal = getCdaProperty(cda, "valorcomparacion") || "";
                  const esValorPersonalizado = isChecked && String(valComparacion || "") !== String(valorGlobal);

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

                        {/* Regla global: solo lectura, definida en Criterios de Aceptación */}
                        <div className={styles.globalRuleRow} title="Definida en Criterios de Aceptación. No se edita por cadena.">
                          <FiLock className={styles.lockIcon} size={11} />
                          <span className={styles.globalRuleLabel}>Regla global</span>
                          <code className={styles.globalRuleExpr}>{exprComparacion}</code>
                          <span className={styles.globalRuleOperator}>{simboloComparacion}</span>
                        </div>

                        <div className={styles.globalRechazoRow}>
                          {mensajeRechazo ? (
                            <span className={styles.globalRechazoText}>
                              <span className={styles.globalRechazoLabel}>Mensaje de rechazo global:</span> "{mensajeRechazo}"
                            </span>
                          ) : (
                            <span className={styles.globalRechazoTextEmpty}>Sin mensaje de rechazo configurado</span>
                          )}
                        </div>
                      </div>

                      <div className={styles.controlPanel}>
                        <span className={styles.controlPanelLabel}>Valor en esta cadena</span>
                        <div className={styles.controlValueWrap}>
                          <input
                            type="text"
                            value={valComparacion}
                            onChange={(e) => handleValueChange(id, e.target.value)}
                            className={styles.controlValueInput}
                            placeholder="Valor"
                            disabled={!isChecked || isReadOnly}
                            onClick={(e) => e.stopPropagation()}
                          />
                          {!isReadOnly && <FiEdit3 className={styles.controlPencilIcon} size={12} />}
                        </div>
                        {esValorPersonalizado && (
                          <span className={styles.overrideHint} title={`El valor definido en Criterios de Aceptación es "${valorGlobal || "(vacío)"}"`}>
                            ≠ global: {valorGlobal || "(vacío)"}
                          </span>
                        )}
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