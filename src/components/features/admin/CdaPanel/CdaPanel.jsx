import React, { useState, useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { FiCheck, FiRotateCcw, FiSave, FiLock, FiEdit3, FiSearch, FiInfo } from "react-icons/fi";
import { toast } from "sonner";
import { useObtenerGrupoCdaConCdas, useVincularCdasAGrupo, useActualizarVinculacionCda } from "../../../../hooks/useCadenaValor";
import { useObtenerTodosCdas, useActualizarGrupoCda } from "../../../../hooks/useCda";
import { useUsuarioWebIdActual } from "../../../../hooks/useUsuario";
import { esCdaActivo, esCdaActivoEstricto } from "../../../../utils/cdaUtils";
import { resolverGrupoCda } from "../../../../utils/grupoCdaUtils";
import { Button } from "../../../ui/Button/Button";
import { Skeleton } from "../../../ui/Skeleton/Skeleton";
import { CadenaHeaderCard } from "../CadenaHeaderCard/CadenaHeaderCard";
import { ConfirmacionModal } from "../../shared/ConfirmacionModal/ConfirmacionModal";
import styles from "./CdaPanel.module.css";

// Busca, subiendo por los ancestros de `el`, el primer contenedor con scroll
// PROPIO real (overflowY auto/scroll Y contenido más alto que su caja).
// Se detiene antes de document.body: nunca deja que el scroll se le escape
// al layout de la página (ver uso en el efecto de "recienTogglado" abajo).
function encontrarContenedorScrolleable(el) {
  let node = el.parentElement;
  while (node && node !== document.body) {
    const overflowY = getComputedStyle(node).overflowY;
    if ((overflowY === "auto" || overflowY === "scroll") && node.scrollHeight > node.clientHeight) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

// Edita los CDAs (checklist + valor por cadena) y la expresión de agrupación
// lógica (AND/OR/personalizada) de UN GrupoCda puntual, identificado por la
// combinación (pantalla, cadena). El padre (CadenasCda.jsx / CdaConfigModal.jsx)
// decide qué pantalla mostrar (tabs); acá solo se edita una a la vez.
export const CdaPanel = ({ activeItem, pantalla, onClose, isReadOnly = false, hideUnchecked = isReadOnly, hideHeader = false, hideCheckboxes = false }) => {
  const queryClient = useQueryClient();
  const cadenaId = activeItem?.cadenavalorid;

  // 1. Obtener TODOS los CDAs en el sistema
  const { data: todosCdas, isLoading: isLoadingTodos, isError: isErrorTodos, refetch: refetchTodos } = useObtenerTodosCdas();

  // 2. Resolver el GrupoCda de (pantalla, cadena) y los CDAs vinculados a él.
  // Lectura pasiva: si el grupo todavía no existe no lo crea (eso pasa recién
  // al guardar, vía resolverGrupoCda).
  const { data: grupoData, isLoading: isLoadingGrupo, isError: isErrorGrupo, refetch: refetchGrupo } = useObtenerGrupoCdaConCdas(cadenaId, pantalla);

  const { mutateAsync: vincularCda, isPending: isVinculandoCda } = useVincularCdasAGrupo();
  const { mutateAsync: actualizarVinculacionCda, isPending: isActualizandoVinculacion } = useActualizarVinculacionCda();
  const { mutateAsync: actualizarGrupoCda, isPending: isActualizandoGrupo } = useActualizarGrupoCda();
  const usuarioWebId = useUsuarioWebIdActual();
  const allCdasList = (Array.isArray(todosCdas) ? todosCdas : todosCdas?.items || todosCdas?.data || []).filter(esCdaActivoEstricto);
  const linkedCdasList = Array.isArray(grupoData?.cdas) ? grupoData.cdas : grupoData?.cdas?.items || grupoData?.cdas?.data || [];

  const getCdaId = (c) => {
    if (!c) return undefined;
    return c.cdaid !== undefined ? c.cdaid : (c.CdaId !== undefined ? c.CdaId : c.CdaID);
  };

  // ID de la fila de vinculación (join CDA<->Grupo), necesario para el PUT
  // que modifica una vinculación existente.
  const getCdaCadenaValorId = (c) => {
    if (!c) return undefined;
    return c.cdacadenavalorid ?? c.CdaCadenaValorId ?? c.CdaCadenaValorID ?? undefined;
  };

  const getCdaProperty = (c, propName) => {
    if (!c) return "";
    if (propName === "vinculadefaultcv") {
      return c.vinculadefaultcv !== undefined ? c.vinculadefaultcv : (c.VinculaDefaultCV !== undefined ? c.VinculaDefaultCV : "");
    }
    const pascalPropName = propName.charAt(0).toUpperCase() + propName.slice(1);
    return c[propName] !== undefined ? c[propName] : (c[pascalPropName] !== undefined ? c[pascalPropName] : "");
  };

  // cdaid -> { checked, valorcomparacion, simbolocomparacion, expresion, mensajerechazo, cdacadenavalorid }
  const [cdaConfigs, setCdaConfigs] = useState({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [soloActivos, setSoloActivos] = useState(false);

  // Expresión de agrupación lógica del GrupoCda (AND / OR / personalizada)
  const [agrupacionType, setAgrupacionType] = useState("and"); // "and" | "or" | "custom"
  const [expresionAgrupacion, setExpresionAgrupacion] = useState("");

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
        mensajerechazo: getCdaProperty(c, "mensajerechazo") || "",
        cdacadenavalorid: undefined,
        initiallyChecked: false
      };
    });
    linkedList.forEach(c => {
      const id = getCdaId(c);
      if (id === undefined || !configs[id]) return;
      // El backend no impide que un mismo CDA termine con más de una fila de
      // vinculación en el mismo grupo (ej. si se lo agrega dos veces por
      // POST). Si eso pasa, priorizamos la fila activa en vez de quedarnos
      // con la que aparezca última en la respuesta.
      if (configs[id].checked && !esCdaActivo(c)) return;
      configs[id] = {
        ...configs[id],
        checked: esCdaActivo(c),
        valorcomparacion: getCdaProperty(c, "valorcomparacion") || "",
        cdacadenavalorid: getCdaCadenaValorId(c),
        initiallyChecked: esCdaActivo(c)
      };
    });
    return configs;
  };

  // Inicializar estado local a partir de los datos cargados
  useEffect(() => {
    setCdaConfigs(buildCdaConfigs(allCdasList, linkedCdasList));
  }, [todosCdas, grupoData]);

  // Detectar el tipo de agrupación a partir de la expresión guardada
  useEffect(() => {
    const grupo = grupoData?.grupo;
    const expr = grupo?.expresionagrupacion || "";
    setExpresionAgrupacion(expr);

    if (!expr.trim()) {
      setAgrupacionType("and");
      return;
    }
    const linkedActiveIds = linkedCdasList.filter(esCdaActivo).map(getCdaId).filter((id) => id !== undefined);
    const expectedOrExpr = linkedActiveIds.map(id => `cda${id}`).join(" or");
    const expectedOrExprUpper = linkedActiveIds.map(id => `cda${id}`).join(" OR ");
    const normalizedExpr = expr.trim().replace(/\s+/g, " ");

    if (normalizedExpr === expectedOrExpr || normalizedExpr === expectedOrExprUpper) {
      setAgrupacionType("or");
    } else {
      setAgrupacionType("custom");
    }
  }, [grupoData]);

  // Al tildar/destildar un CDA la lista se reordena (activos arriba de
  // todo) — sin esto, el item desaparece de donde estaba y aparece en otro
  // lado sin ningún indicio de qué pasó. Guardamos cuál fue el último
  // tildado para, una vez que el re-render ya lo movió a su posición nueva,
  // desplazar la vista hasta ahí y resaltarlo un instante.
  const [recienTogglado, setRecienTogglado] = useState(null);
  const cardRefs = useRef({});

  const handleToggleCda = (cdaId) => {
    setCdaConfigs(prev => ({
      ...prev,
      [cdaId]: {
        ...prev[cdaId],
        checked: !prev[cdaId]?.checked
      }
    }));
    setRecienTogglado(cdaId);
  };

  useEffect(() => {
    if (recienTogglado === null) return;
    const el = cardRefs.current[recienTogglado];
    if (el) {
      // OJO: `el.scrollIntoView()` nativo recorre TODOS los ancestros con
      // overflow no-visible para decidir qué scrollear, y eso incluye a
      // `.adminRoot` (overflow:hidden, pero igual "scrolleable" para el
      // browser) — termina moviendo esa caja entera y tapando la navbar
      // global, sin ninguna scrollbar visible para volver a subir. Por eso
      // acá se scrollea a mano el contenedor scrolleable más cercano
      // (`.rightCol` en desktop, `.adminContent` en mobile) y nunca se le
      // pasa el trabajo al navegador.
      const contenedor = encontrarContenedorScrolleable(el);
      if (contenedor) {
        const elRect = el.getBoundingClientRect();
        const contRect = contenedor.getBoundingClientRect();
        const offset = elRect.top - contRect.top - contenedor.clientHeight / 2 + elRect.height / 2;
        contenedor.scrollBy({ top: offset, behavior: "smooth" });
      }
    }
    const timer = setTimeout(() => setRecienTogglado(null), 1000);
    return () => clearTimeout(timer);
  }, [recienTogglado, cdaConfigs]);

  const handleValueChange = (cdaId, val) => {
    setCdaConfigs(prev => ({
      ...prev,
      [cdaId]: {
        ...prev[cdaId],
        valorcomparacion: val
      }
    }));
  };

  const checkedIds = Object.entries(cdaConfigs)
    .filter(([, config]) => config.checked)
    .map(([idStr]) => Number(idStr));

  // Función para insertar tokens en la posición del cursor de la textarea
  const insertTextAtCursor = (textToInsert) => {
    const textarea = document.getElementById("expresion-agrupacion-textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = expresionAgrupacion.substring(0, start);
    const textAfter = expresionAgrupacion.substring(end);

    let cleanText = textToInsert;
    if (start > 0 && textBefore[start - 1] !== " " && !cleanText.startsWith(" ")) {
      cleanText = " " + cleanText;
    }
    if (textAfter.length > 0 && textAfter[0] !== " " && !cleanText.endsWith(" ")) {
      cleanText = cleanText + " ";
    }

    const newText = textBefore + cleanText + textAfter;
    setExpresionAgrupacion(newText);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + cleanText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // Comparar estado actual vs inicial para habilitar el botón de Guardar
  const hasChanges = () => {
    const baseConfigs = buildCdaConfigs(allCdasList, linkedCdasList);
    const baseExpr = grupoData?.grupo?.expresionagrupacion || "";

    const checklistChanged = Object.entries(cdaConfigs).some(([idStr, config]) => {
      const base = baseConfigs[Number(idStr)];
      if (!base) return false;
      if (config.checked !== base.checked) return true;
      if (config.checked && String(config.valorcomparacion || "") !== String(base.valorcomparacion || "")) return true;
      return false;
    });

    const finalExpresion = calcularExpresionFinal();
    const expresionChanged = finalExpresion !== baseExpr;

    return checklistChanged || expresionChanged;
  };

  const calcularExpresionFinal = () => {
    if (agrupacionType === "or") {
      return checkedIds.map((id) => `cda${id}`).join(" or ");
    }
    if (agrupacionType === "custom") {
      return expresionAgrupacion.trim();
    }
    return ""; // "and": expresión vacía, el backend interpreta AND de todos los activos por defecto
  };

  const handleSaveVinculacion = () => {
    setConfirmOpen(true);
  };

  const handleReset = () => {
    setCdaConfigs(buildCdaConfigs(allCdasList, linkedCdasList));
    setExpresionAgrupacion(grupoData?.grupo?.expresionagrupacion || "");
    toast.success("CDAs restablecidos a la configuración guardada");
  };

  // Solo recorta espacios: el valor ya viene con el formato definitivo
  // desde el CDA global (p. ej. "''" para "comparar contra vacío", o
  // "'REINA'" para un string) — ver formatValorParaLog en CdasGlobales.jsx.
  // Antes esto además pisaba "''"/'""' a string vacío, perdiendo la
  // semántica de "comparar contra vacío" al vincular el CDA a una cadena
  // (quedaba guardado literalmente vacío en vez de "''"). Bug reportado por
  // BIND el 2026-08-14.
  const sanearValor = (val) => String(val || "").trim();

  const confirmSaveVinculacion = async () => {
    if (!usuarioWebId) {
      toast.error("No se pudo identificar al usuario logueado; recargá la página e intentá de nuevo.");
      setConfirmOpen(false);
      return;
    }
    try {
      // El grupo puede no existir todavía (cadena activada antes de este
      // cambio de modelo): se crea recién acá, al guardar de verdad.
      const grupoActual = grupoData?.grupo || (await resolverGrupoCda(pantalla, cadenaId));
      const grupoCdaId = grupoActual.grupocdaid;

      const baseConfigs = buildCdaConfigs(allCdasList, linkedCdasList);

      const nuevos = [];
      const modificados = [];

      Object.entries(cdaConfigs).forEach(([idStr, config]) => {
        const id = Number(idStr);
        const base = baseConfigs[id];
        if (!base) return;
        const valorSaneado = sanearValor(config.valorcomparacion);
        const valorBase = sanearValor(base.valorcomparacion);

        if (config.checked && !base.checked) {
          if (base.cdacadenavalorid !== undefined) {
            modificados.push({ cdacadenavalorid: base.cdacadenavalorid, cdaid: id, valorcomparacion: valorSaneado, activo: "1" });
          } else {
            nuevos.push({ cdaid: id, valorcomparacion: valorSaneado });
          }
        } else if (!config.checked && base.checked) {
          modificados.push({ cdacadenavalorid: base.cdacadenavalorid, cdaid: id, valorcomparacion: valorSaneado, activo: "0" });
        } else if (config.checked && base.checked && valorSaneado !== valorBase) {
          modificados.push({ cdacadenavalorid: base.cdacadenavalorid, cdaid: id, valorcomparacion: valorSaneado, activo: "1" });
        }
      });

      if (nuevos.length > 0) {
        await vincularCda({
          grupocdaid: grupoCdaId,
          listacda: nuevos.map((n) => ({ ...n, usuariowebid: usuarioWebId }))
        });
      }

      // Secuencial: cada PUT toca una sola vinculación y el backend usa un
      // pool de conexiones limitado (FireDAC).
      for (const mod of modificados) {
        if (mod.cdacadenavalorid === undefined) {
          console.warn(`No se encontró CdaCadenaValorID para el CDA ${mod.cdaid}; no se pudo actualizar.`);
          toast.error(`No se pudo actualizar el criterio ${mod.cdaid} (falta el ID de vinculación).`);
          continue;
        }
        await actualizarVinculacionCda({
          cdacadenavalorid: mod.cdacadenavalorid,
          grupocdaid: grupoCdaId,
          cdaid: mod.cdaid,
          valorcomparacion: mod.valorcomparacion,
          activo: mod.activo,
          usuariowebid: usuarioWebId
        });
      }

      const finalExpresion = calcularExpresionFinal();
      if (finalExpresion !== (grupoActual.expresionagrupacion || "")) {
        await actualizarGrupoCda({
          grupocdaid: grupoCdaId,
          pantallagrupocdaid: grupoActual.pantallagrupocdaid,
          cadenavalorid: cadenaId,
          expresionagrupacion: finalExpresion
        });
      }

      await queryClient.invalidateQueries({ queryKey: ['cda', 'todos_list'] });
      await queryClient.invalidateQueries({ queryKey: ['cadenaValor', 'grupoCdaConCdas', pantalla, cadenaId] });
      toast.success("Criterios de aceptación y vinculación actualizados correctamente");
      setConfirmOpen(false);
      if (onClose) onClose();
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error al guardar los cambios");
      setConfirmOpen(false);
    }
  };

  const isLoading = isLoadingTodos || isLoadingGrupo;
  const isSaving = isVinculandoCda || isActualizandoVinculacion || isActualizandoGrupo;

  const cdasVisibles = allCdasList
    .filter(cda => !hideUnchecked || (cdaConfigs[getCdaId(cda)]?.checked))
    .filter(cda => !soloActivos || (cdaConfigs[getCdaId(cda)]?.checked))
    .filter(cda => {
      const term = searchTerm.trim().toLowerCase();
      if (!term) return true;
      return (
        String(getCdaProperty(cda, "descripcion")).toLowerCase().includes(term) ||
        String(getCdaProperty(cda, "expresion")).toLowerCase().includes(term)
      );
    })
    // Los activos (o que estaban activos al abrir) siempre arriba; Array.prototype.sort es estable,
    // así que dentro de cada grupo se conserva el orden original.
    .sort((a, b) => {
      const confA = cdaConfigs[getCdaId(a)];
      const confB = cdaConfigs[getCdaId(b)];
      const aChecked = confA?.checked || confA?.initiallyChecked ? 1 : 0;
      const bChecked = confB?.checked || confB?.initiallyChecked ? 1 : 0;
      return bChecked - aChecked;
    });

  // Skeleton con la forma real del panel (columna de agrupación + checklist
  // de CDAs) en vez de un spinner centrado.
  if (isLoading) {
    return (
      <div style={{ flex: 1, minHeight: "18rem", display: "flex", flexDirection: "column", gap: "1rem", padding: "0.5rem 0" }}>
        <Skeleton width="85%" height="0.8rem" />
        <div style={{ display: "flex", gap: "1.25rem", flex: 1, flexWrap: "wrap" }}>
          <div style={{ flex: "1 1 16rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Skeleton width="60%" height="0.8rem" />
            <Skeleton width="100%" height="3.2rem" radius="0.6rem" />
            <Skeleton width="100%" height="3.2rem" radius="0.6rem" />
            <Skeleton width="100%" height="5rem" radius="0.6rem" />
          </div>
          <div style={{ flex: "1 1 18rem", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <Skeleton width="100%" height="2.4rem" radius="0.6rem" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <Skeleton width="1.1rem" height="1.1rem" radius="0.3rem" />
                <div style={{ flex: 1 }}>
                  <Skeleton width="65%" height="0.85rem" />
                  <Skeleton width="40%" height="0.65rem" style={{ marginTop: "0.35rem" }} />
                </div>
                <Skeleton width="4.5rem" height="1.6rem" radius="0.4rem" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Nunca mostrar el checklist como si "no hubiera nada vinculado" cuando en
  // realidad falló la petición de red: eso invita a re-vincular algo que ya
  // estaba vinculado y genera duplicados. Mostrar el error y dejar reintentar.
  if (isErrorTodos || isErrorGrupo) {
    return (
      <div style={{ flex: 1, minHeight: "18rem", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "2rem" }}>
        <p style={{ color: "#ea4a5a", marginBottom: "1rem" }}>
          Ocurrió un error de red al traer los CDAs. No se muestra el listado para evitar vincular algo que ya podría estar vinculado.
        </p>
        <Button
          type="button"
          variant="outlineBlue"
          size="sm"
          onClick={() => {
            if (isErrorTodos) refetchTodos();
            if (isErrorGrupo) refetchGrupo();
          }}
        >
          Reintentar
        </Button>
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
            ? "Listado de los CDAs activos para esta cadena y pantalla. La regla y el mensaje de rechazo se definen en Criterios de Aceptación; el valor mostrado es el vigente para esta combinación."
            : "Activá los CDAs que se deben ejecutar para esta cadena en esta pantalla, y definí cómo se combinan entre sí. La regla y el mensaje de rechazo son los definidos en Criterios de Aceptación: acá solo podés personalizar, por cadena, el valor límite de cada uno."}
        </p>

        <div className={styles.mainLayout}>
        <div className={styles.leftCol}>
          <div className={styles.agrupacionSection}>
            <span className={styles.customTextareaLabel}>Agrupación lógica de esta cadena y pantalla</span>

            <div className={styles.typeSelector}>
              <div
                className={`${styles.radioOption} ${agrupacionType === "and" ? styles.radioActive : ""}`}
                onClick={() => !isReadOnly && setAgrupacionType("and")}
              >
                <input
                  type="radio"
                  className={styles.radioInput}
                  checked={agrupacionType === "and"}
                  onChange={() => setAgrupacionType("and")}
                  disabled={isReadOnly || isSaving}
                />
                <div className={styles.radioLabel}>
                  <span className={styles.radioLabelText}>Cumplir todos los criterios (AND)</span>
                  <span className={styles.radioDescText}>Se deben cumplir todos los CDAs activos.</span>
                </div>
              </div>

              <div
                className={`${styles.radioOption} ${agrupacionType === "or" ? styles.radioActive : ""}`}
                onClick={() => !isReadOnly && setAgrupacionType("or")}
              >
                <input
                  type="radio"
                  className={styles.radioInput}
                  checked={agrupacionType === "or"}
                  onChange={() => setAgrupacionType("or")}
                  disabled={isReadOnly || isSaving}
                />
                <div className={styles.radioLabel}>
                  <span className={styles.radioLabelText}>Cumplir al menos un criterio (OR)</span>
                  <span className={styles.radioDescText}>Basta con que se cumpla cualquiera de los CDAs activos.</span>
                </div>
              </div>

              <div
                className={`${styles.radioOption} ${agrupacionType === "custom" ? styles.radioActive : ""}`}
                onClick={() => !isReadOnly && setAgrupacionType("custom")}
              >
                <input
                  type="radio"
                  className={styles.radioInput}
                  checked={agrupacionType === "custom"}
                  onChange={() => setAgrupacionType("custom")}
                  disabled={isReadOnly || isSaving}
                />
                <div className={styles.radioLabel}>
                  <span className={styles.radioLabelText}>Expresión personalizada (Avanzado)</span>
                  <span className={styles.radioDescText}>Escribí una expresión lógica compleja utilizando los IDs de los CDAs.</span>
                </div>
              </div>
            </div>

            {agrupacionType === "custom" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <div className={styles.customTextareaGroup}>
                  <label htmlFor="expresion-agrupacion-textarea" className={styles.customTextareaLabel}>
                    Fórmula de Agrupación
                  </label>
                  <textarea
                    id="expresion-agrupacion-textarea"
                    className={styles.customTextarea}
                    value={expresionAgrupacion}
                    onChange={(e) => setExpresionAgrupacion(e.target.value)}
                    placeholder="Ej: cda1042 and (cda1043 or cda1044)"
                    disabled={isReadOnly || isSaving}
                  />
                </div>

                {!isReadOnly && (
                  <div className={styles.pillsContainer}>
                    <h4 className={styles.pillGroupTitle}>Insertar CDAs Activos</h4>
                    <div className={styles.pillsList}>
                      {checkedIds.length === 0 ? (
                        <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
                          Activá criterios en la lista de la derecha para ver sus botones de inserción rápida.
                        </span>
                      ) : (
                        checkedIds.map(id => {
                          const found = allCdasList.find(c => getCdaId(c) === id);
                          const label = found ? getCdaProperty(found, "descripcion") : `Criterio ${id}`;
                          return (
                            <button
                              type="button"
                              key={id}
                              className={styles.cdaPill}
                              title={label}
                              onClick={() => insertTextAtCursor(`cda${id}`)}
                            >
                              cda{id}
                            </button>
                          );
                        })
                      )}
                    </div>

                    <h4 className={styles.pillGroupTitle} style={{ marginTop: "0.5rem" }}>Insertar Conectores</h4>
                    <div className={styles.pillsList}>
                      <button type="button" className={styles.operatorPill} onClick={() => insertTextAtCursor("and")}>and</button>
                      <button type="button" className={styles.operatorPill} onClick={() => insertTextAtCursor("or")}>or</button>
                      <button type="button" className={styles.operatorPill} onClick={() => insertTextAtCursor("(")}>(</button>
                      <button type="button" className={styles.operatorPill} onClick={() => insertTextAtCursor(")")}>)</button>
                    </div>
                  </div>
                )}

                <div className={styles.infoBox}>
                  <FiInfo style={{ marginRight: "0.4rem", verticalAlign: "middle" }} />
                  Recordá combinar los IDs de la forma: <code>cda1042 and (cda1043 or cda1044)</code>.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className={styles.rightCol}>
        {!hideUnchecked && allCdasList.length > 0 && (
          <div className={styles.searchRow}>
            <div className={styles.searchWrap}>
              <FiSearch className={styles.iconSearch} />
              <input
                type="text"
                placeholder="Buscar por descripción o expresión..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <label className={styles.activosToggle}>
              <input
                type="checkbox"
                className={styles.activosToggleInput}
                checked={soloActivos}
                onChange={(e) => setSoloActivos(e.target.checked)}
              />
              <span className={styles.activosToggleTrack}>
                <span className={styles.activosToggleThumb} />
              </span>
              <span className={styles.activosToggleText}>Solo activos</span>
            </label>
          </div>
        )}

        {!hideUnchecked && allCdasList.length > 0 && (
          <div className={styles.checklistHeader}>
            <span>{checkedIds.length} de {allCdasList.length} CDA{allCdasList.length !== 1 ? "s" : ""} activo{checkedIds.length !== 1 ? "s" : ""}</span>
          </div>
        )}

        <div className={`${styles.cdasSection} ${isReadOnly ? styles.readOnly : ""}`}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
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
                      ref={(el) => { cardRefs.current[id] = el; }}
                      className={`${styles.cdaCard} ${isChecked ? styles.cdaCardChecked : ""} ${recienTogglado === id ? styles.cdaCardJustMoved : ""}`}
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
                            <span className={styles.globalRechazoText} title={mensajeRechazo}>
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
            isLoading={isSaving}
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
        isLoading={isSaving}
      />
    </div>
  );
};
