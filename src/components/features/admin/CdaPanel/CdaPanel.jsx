import React, { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiEdit, FiCheck, FiPlus, FiX } from "react-icons/fi";
import { toast } from "sonner";
import { useObtenerCdasPorCadenaId, useVincularCdas } from "../../../../hooks/useCadenaValor";
import { useCrearCda, useObtenerTodosCdas } from "../../../../hooks/useCda";
import { InputSimple } from "../../../ui/InputSimple/InputSimple";
import { Button } from "../../../ui/Button/Button";
import { Spinner } from "../../../ui/Spinner/Spinner";
import { Modal } from "../../../ui/Modal/Modal";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import styles from "./CdaPanel.module.css";

export const CdaPanel = ({ activeItem }) => {
  const queryClient = useQueryClient();
  const cadenaId = activeItem?.cadenavalorid;

  // 1. Obtener TODOS los CDAs en el sistema
  const { data: todosCdas, isLoading: isLoadingTodos } = useObtenerTodosCdas();

  // 2. Obtener los CDAs vinculados a esta cadena de valor
  const { data: linkedCdas, isLoading: isLoadingLinked } = useObtenerCdasPorCadenaId(cadenaId);

  const { mutateAsync: crearCda, isPending: isCreandoCda } = useCrearCda();
  const { mutateAsync: vincularCda, isPending: isVinculandoCda } = useVincularCdas();

  const [localCdasStatus, setLocalCdasStatus] = useState({});
  const [customRechazoMsgs, setCustomRechazoMsgs] = useState({});
  const [editingCda, setEditingCda] = useState(null);
  const [tempRechazoMsg, setTempRechazoMsg] = useState("");

  // Estados del formulario para agregar CDA
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [expresion, setExpresion] = useState("");
  const [expresionlog, setExpresionlog] = useState("");
  const [mensajerechazo, setMensajerechazo] = useState("");
  const [validationError, setValidationError] = useState("");

  const allCdasList = Array.isArray(todosCdas) ? todosCdas : todosCdas?.items || todosCdas?.data || [];
  const linkedCdasList = Array.isArray(linkedCdas) ? linkedCdas : linkedCdas?.items || linkedCdas?.data || [];

  // Inicializar estado local de checkbox a partir de la relación actual
  useEffect(() => {
    const status = {};
    allCdasList.forEach(c => {
      status[c.cdaid] = false;
    });
    linkedCdasList.forEach(c => {
      status[c.cdaid] = true;
    });
    setLocalCdasStatus(status);
  }, [todosCdas, linkedCdas]);

  const handleToggleCda = (cdaId) => {
    setLocalCdasStatus(prev => ({
      ...prev,
      [cdaId]: !prev[cdaId]
    }));
  };

  const getActiveCdaIds = () => {
    return allCdasList
      .map(c => c.cdaid)
      .filter(id => localCdasStatus[id] === true);
  };

  const initialActiveCdaIds = linkedCdasList.map(c => c.cdaid);
  const activeCdaIds = getActiveCdaIds();
  
  const hasChanges = activeCdaIds.length !== initialActiveCdaIds.length ||
    activeCdaIds.some(id => !initialActiveCdaIds.includes(id)) ||
    initialActiveCdaIds.some(id => !activeCdaIds.includes(id));

  const handleSaveVinculacion = async () => {
    const confirmSave = window.confirm(
      "¿Estás seguro de que deseas actualizar la vinculación de CDAs para esta cadena de valor?"
    );
    if (!confirmSave) return;

    try {
      await vincularCda({
        cadenavalorid: cadenaId,
        listacda: activeCdaIds
      });

      await queryClient.invalidateQueries({ queryKey: ['cadenaValor', 'cdas', cadenaId] });
      toast.success("Vinculación de CDAs actualizada correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error al vincular los CDAs");
    }
  };

  const handleCreateAndLinkCda = async (e) => {
    e.preventDefault();
    if (!descripcion.trim() || !expresion.trim() || !expresionlog.trim() || !mensajerechazo.trim()) {
      setValidationError("Todos los campos son obligatorios");
      return;
    }
    setValidationError("");

    try {
      // 1. Crear CDA
      const newCda = await crearCda({
        cdaid: 0,
        descripcion: descripcion.trim(),
        expresion: expresion.trim(),
        expresionlog: expresionlog.trim(),
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
      const activeCdaIds = allCdasList
        .map(c => c.cdaid)
        .filter(id => localCdasStatus[id] === true);

      await vincularCda({
        cadenavalorid: cadenaId,
        listacda: [...activeCdaIds, newCdaId]
      });

      // 3. Invalidate queries
      await queryClient.invalidateQueries({ queryKey: ['cda', 'todos_list'] });
      await queryClient.invalidateQueries({ queryKey: ['cadenaValor', 'cdas', cadenaId] });

      toast.success("Criterio de Aceptación agregado y vinculado exitosamente");
      
      // Reset form
      setDescripcion("");
      setExpresion("");
      setExpresionlog("");
      setMensajerechazo("");
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
    <div>
      <CadenaHeaderCard
        denominacion={activeItem?.denominacion}
        logo={activeItem?.logo}
        referencia={activeItem?.referencia}
        cadenavalorid={activeItem?.cadenavalorid}
        cuittercero={activeItem?.cuittercero}
      />
      <p style={{ fontSize: "0.825rem", color: "#8b949e", marginBottom: "1.25rem", lineHeight: "1.4" }}>
        Seleccioná los CDAs que se deben ejecutar durante la validación de esta cadena de valor.
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
              <div className={styles.formField}>
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
                <label htmlFor="cda-expr">Expresión</label>
                <input
                  id="cda-expr"
                  type="text"
                  value={expresion}
                  onChange={(e) => setExpresion(e.target.value)}
                  placeholder="Ej. score <= 500"
                  required
                  disabled={isCreandoCda || isVinculandoCda}
                />
              </div>

              <div className={styles.formField}>
                <label htmlFor="cda-exprlog">Expresión Log</label>
                <input
                  id="cda-exprlog"
                  type="text"
                  value={expresionlog}
                  onChange={(e) => setExpresionlog(e.target.value)}
                  placeholder="Ej. SCORE <= 500"
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
              const isChecked = localCdasStatus[cda.cdaid] === true;
              const mensajeRechazoActual = customRechazoMsgs[cda.cdaid] !== undefined
                ? customRechazoMsgs[cda.cdaid]
                : cda.mensajerechazo;

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
                    onClick={() => handleToggleCda(cda.cdaid)}
                  >
                    <strong className={styles.cdaTitleText}>{cda.descripcion}</strong>
                    {mensajeRechazoActual && (
                      <span className={styles.cdaRechazoText}>
                        Mensaje rechazo: {mensajeRechazoActual}
                      </span>
                    )}
                  </div>
                  <div className={styles.actionsWrapper}>
                    <button
                      type="button"
                      title="Editar mensaje de rechazo"
                      className={styles.btnActionEdit}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setEditingCda(cda);
                        setTempRechazoMsg(mensajeRechazoActual || "");
                      }}
                    >
                      <FiEdit size={12} />
                    </button>
                    <span className={`${styles.cdaStatusBadge} ${isChecked ? styles.badgeActive : styles.badgeInactive}`}>
                      {isChecked ? "Activo" : "Inactivo"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {hasChanges && (
          <div className={styles.cdasActions}>
            <Button
              type="button"
              variant="blue"
              size="sm"
              onClick={handleSaveVinculacion}
              isLoading={isVinculandoCda}
            >
              Vincular Selección
            </Button>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!editingCda}
        onClose={() => setEditingCda(null)}
        title="EDITAR MENSAJE DE RECHAZO"
        maxWidth="500px"
        variant="blue"
      >
        {editingCda && (
          <>
            <p style={{ fontSize: "0.875rem", color: "#8b949e", marginBottom: "1.25rem" }}>
              Modifique el mensaje que se mostrará cuando se rechace la validación de este CDA:
            </p>
            <div style={{ marginBottom: "1rem" }}>
              <strong style={{ color: "#ffffff", display: "block", marginBottom: "0.5rem", fontSize: "0.9rem" }}>
                {editingCda.descripcion}
              </strong>
            </div>
            <InputSimple
              label="Mensaje de Rechazo"
              value={tempRechazoMsg}
              onChange={val => setTempRechazoMsg(val)}
            />
            <div className={styles.modalFooter}>
              <Button variant="outlineBlue" onClick={() => setEditingCda(null)}>
                CANCELAR
              </Button>
              <Button
                variant="blue"
                onClick={() => {
                  setCustomRechazoMsgs(prev => ({
                    ...prev,
                    [editingCda.cdaid]: tempRechazoMsg
                  }));
                  setEditingCda(null);
                  toast.success("Mensaje de rechazo actualizado (Simulado)");
                }}
              >
                GUARDAR
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};