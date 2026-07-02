import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useObtenerTodosCdas, useVincularPantallaCda } from "../../hooks/useCda";
import { cdaService } from "../../services/cdaService";
import { SelectSimple } from "../../components/ui/SelectSimple/SelectSimple";
import { InputSimple } from "../../components/ui/InputSimple/InputSimple";
import { Button } from "../../components/ui/Button/Button";
import { Spinner } from "../../components/ui/Spinner/Spinner";
import { FiCheck, FiInfo } from "react-icons/fi";
import styles from "./CdasPantalla.module.css";

export default function CdasPantalla() {
  const queryClient = useQueryClient();
  const { data: todosCdas, isLoading: isLoadingCdas } = useObtenerTodosCdas();
  const { mutateAsync: vincularPantallaCda, isPending: isSaving } = useVincularPantallaCda();

  const [selectedPantalla, setSelectedPantalla] = useState("");
  const [agrupacionType, setAgrupacionType] = useState("and"); // "and" | "or" | "custom"
  const [expresionAgrupacion, setExpresionAgrupacion] = useState("");
  const [selectedCdaIds, setSelectedCdaIds] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoadingConfig, setIsLoadingConfig] = useState(false);

  const allCdasList = Array.isArray(todosCdas) ? todosCdas : todosCdas?.items || todosCdas?.data || [];

  const getCdaId = (c) => {
    if (!c) return undefined;
    return c.cdaid !== undefined ? c.cdaid : (c.CdaId !== undefined ? c.CdaId : c.CdaID);
  };

  const getCdaDesc = (c) => {
    if (!c) return "";
    return c.descripcion || c.Descripcion || "";
  };

  const getCdaExpr = (c) => {
    if (!c) return "";
    return c.expresion || c.Expresion || "";
  };

  // Cargar configuración existente al cambiar la pantalla seleccionada
  useEffect(() => {
    if (!selectedPantalla) {
      setExpresionAgrupacion("");
      setSelectedCdaIds([]);
      setAgrupacionType("and");
      return;
    }

    const fetchCurrentConfig = async () => {
      setIsLoadingConfig(true);
      try {
        const [pantallaData, grupoData] = await Promise.all([
          cdaService.obtenerPantallaGrupoCda(selectedPantalla),
          cdaService.obtenerGrupoCda(selectedPantalla),
        ]);

        // La API devuelve un array (uno por Pantalla filtrada, normalmente un solo elemento)
        const pantallaRow = Array.isArray(pantallaData) ? pantallaData[0] : pantallaData;
        const expr = pantallaRow?.ExpresionAgrupacion || pantallaRow?.expresionAgrupacion || "";
        setExpresionAgrupacion(expr);

        const grupoList = Array.isArray(grupoData) ? grupoData : grupoData?.items || grupoData?.data || [];
        const ids = grupoList
          .map(c => c.cdaid ?? c.CdaId ?? c.CdaID)
          .filter((id) => id !== undefined && id !== null);

        setSelectedCdaIds(ids);

        // Detectar tipo de agrupación según la expresión
        if (!expr.trim()) {
          setAgrupacionType("and");
        } else {
          // Verificar si es un OR implícito de todos los IDs
          const expectedOrExpr = ids.map(id => `cda${id}`).join(" or ");
          const expectedOrExprUpper = ids.map(id => `cda${id}`).join(" OR ");
          const normalizedExpr = expr.trim().replace(/\s+/g, " ");

          if (normalizedExpr === expectedOrExpr || normalizedExpr === expectedOrExprUpper) {
            setAgrupacionType("or");
          } else {
            setAgrupacionType("custom");
          }
        }
      } catch (err) {
        console.warn("No se pudo cargar la configuración previa (puede ser normal si no existe aún):", err);
        setExpresionAgrupacion("");
        setSelectedCdaIds([]);
        setAgrupacionType("and");
      } finally {
        setIsLoadingConfig(false);
      }
    };

    fetchCurrentConfig();
  }, [selectedPantalla]);

  const handleToggleCda = (cdaId) => {
    setSelectedCdaIds((prev) =>
      prev.includes(cdaId)
        ? prev.filter((id) => id !== cdaId)
        : [...prev, cdaId]
    );
  };

  const handleSelectAll = () => {
    const allIds = allCdasList.map(getCdaId).filter(Boolean);
    setSelectedCdaIds(allIds);
  };

  const handleSelectNone = () => {
    setSelectedCdaIds([]);
  };

  // Función premium para insertar tokens en la posición del cursor de la textarea
  const insertTextAtCursor = (textToInsert) => {
    const textarea = document.getElementById("expresion-textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const textBefore = expresionAgrupacion.substring(0, start);
    const textAfter = expresionAgrupacion.substring(end);

    // Agregar espacio inteligentemente antes o después para evitar que los tokens queden pegados
    let cleanText = textToInsert;
    if (start > 0 && textBefore[start - 1] !== " " && !cleanText.startsWith(" ")) {
      cleanText = " " + cleanText;
    }
    if (textAfter.length > 0 && textAfter[0] !== " " && !cleanText.endsWith(" ")) {
      cleanText = cleanText + " ";
    }

    const newText = textBefore + cleanText + textAfter;
    setExpresionAgrupacion(newText);

    // Devolver foco y ubicar el cursor justo después de lo insertado
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + cleanText.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedPantalla) {
      toast.error("Seleccioná una pantalla para configurar.");
      return;
    }

    let finalExpresion = "";
    if (agrupacionType === "or") {
      if (selectedCdaIds.length === 0) {
        toast.error("Seleccioná al menos un criterio para agrupar por OR.");
        return;
      }
      finalExpresion = selectedCdaIds.map((id) => `cda${id}`).join(" or ");
    } else if (agrupacionType === "custom") {
      if (!expresionAgrupacion.trim()) {
        toast.error("Ingresá la expresión personalizada o selecciona AND/OR.");
        return;
      }
      finalExpresion = expresionAgrupacion.trim();
    }

    try {
      await vincularPantallaCda({
        Pantalla: selectedPantalla,
        ExpresionAgrupacion: finalExpresion,
        ListaCda: selectedCdaIds,
      });
      
      await queryClient.invalidateQueries({ queryKey: ["cda", "pantallaGrupo"] });
      toast.success("Configuración de pantalla guardada correctamente");
    } catch (err) {
      console.error(err);
      toast.error("Ocurrió un error al guardar la vinculación");
    }
  };

  const filteredCdas = allCdasList.filter((c) => {
    const desc = getCdaDesc(c).toLowerCase();
    const expr = getCdaExpr(c).toLowerCase();
    const idStr = String(getCdaId(c) || "").toLowerCase();
    const term = searchTerm.toLowerCase();
    return desc.includes(term) || expr.includes(term) || idStr.includes(term);
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleBox}>
          <h1>Asociación de CDAs por Pantalla</h1>
          <p>Configurá qué criterios de aceptación se evalúan en cada etapa del alta y definí su agrupación lógica.</p>
        </div>
      </div>

      <div className={styles.mainLayout}>
        {/* COLUMNA IZQUIERDA: Configuración */}
        <div className={styles.leftCol}>
          <h2 className={styles.sectionTitle}>Pantalla y Agrupación</h2>
          
          <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.25rem", flex: 1 }}>
            <SelectSimple
              label="Seleccionar Pantalla Web"
              value={selectedPantalla}
              onChange={setSelectedPantalla}
              options={[
                { value: "PANTALLA_INGRESO_CUIT", label: "PANTALLA_INGRESO_CUIT (Validación inicial de CUIT)" },
                { value: "PANTALLA_SOCIOS", label: "PANTALLA_SOCIOS (Validación de Socios y Representantes)" },
              ]}
              placeholder="-- Seleccioná una pantalla --"
              variant="admin"
              disabled={isSaving || isLoadingConfig}
              hideErrorSpace={true}
            />

            {selectedPantalla && (
              <>
                {/* Tipo de Agrupación Selector */}
                <div className={styles.typeSelector}>
                  <label className={styles.customTextareaLabel}>Tipo de Agrupación Lógica</label>
                  
                  <div
                    className={`${styles.radioOption} ${agrupacionType === "and" ? styles.radioActive : ""}`}
                    onClick={() => setAgrupacionType("and")}
                  >
                    <input
                      type="radio"
                      className={styles.radioInput}
                      checked={agrupacionType === "and"}
                      onChange={() => setAgrupacionType("and")}
                      disabled={isSaving || isLoadingConfig}
                    />
                    <div className={styles.radioLabel}>
                      <span className={styles.radioLabelText}>Cumplir todos los criterios (AND)</span>
                      <span className={styles.radioDescText}>Se deben cumplir todos los CDAs seleccionados.</span>
                    </div>
                  </div>

                  <div
                    className={`${styles.radioOption} ${agrupacionType === "or" ? styles.radioActive : ""}`}
                    onClick={() => setAgrupacionType("or")}
                  >
                    <input
                      type="radio"
                      className={styles.radioInput}
                      checked={agrupacionType === "or"}
                      onChange={() => setAgrupacionType("or")}
                      disabled={isSaving || isLoadingConfig}
                    />
                    <div className={styles.radioLabel}>
                      <span className={styles.radioLabelText}>Cumplir al menos un criterio (OR)</span>
                      <span className={styles.radioDescText}>Basta con que se cumpla cualquiera de los CDAs seleccionados.</span>
                    </div>
                  </div>

                  <div
                    className={`${styles.radioOption} ${agrupacionType === "custom" ? styles.radioActive : ""}`}
                    onClick={() => setAgrupacionType("custom")}
                  >
                    <input
                      type="radio"
                      className={styles.radioInput}
                      checked={agrupacionType === "custom"}
                      onChange={() => setAgrupacionType("custom")}
                      disabled={isSaving || isLoadingConfig}
                    />
                    <div className={styles.radioLabel}>
                      <span className={styles.radioLabelText}>Expresión personalizada (Avanzado)</span>
                      <span className={styles.radioDescText}>Escribí una expresión lógica compleja utilizando los IDs de los CDAs.</span>
                    </div>
                  </div>
                </div>

                {/* Vista para Expresión Personalizada */}
                {agrupacionType === "custom" && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div className={styles.customTextareaGroup}>
                      <label htmlFor="expresion-textarea" className={styles.customTextareaLabel}>
                        Fórmula de Agrupación
                      </label>
                      <textarea
                        id="expresion-textarea"
                        className={styles.customTextarea}
                        value={expresionAgrupacion}
                        onChange={(e) => setExpresionAgrupacion(e.target.value)}
                        placeholder="Ej: cda1042 and (cda1043 or cda1044)"
                        disabled={isSaving || isLoadingConfig}
                      />
                    </div>

                    {/* Ayudante interactivo de Tokens */}
                    <div className={styles.pillsContainer}>
                      <h4 className={styles.pillGroupTitle}>Insertar CDAs Seleccionados</h4>
                      <div className={styles.pillsList}>
                        {selectedCdaIds.length === 0 ? (
                          <span style={{ fontSize: "0.75rem", color: "#8b949e" }}>
                            Seleccioná criterios en la lista de la derecha para ver sus botones de inserción rápida.
                          </span>
                        ) : (
                          selectedCdaIds.map(id => {
                            const found = allCdasList.find(c => getCdaId(c) === id);
                            const label = found ? getCdaDesc(found) : `Criterio ${id}`;
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

                    <div className={styles.infoBox}>
                      <FiInfo style={{ marginRight: "0.4rem", verticalAlign: "middle" }} />
                      Recordá combinar los IDs de la forma: <code>cda1042 and (cda1043 or cda1044)</code>.
                    </div>

                    <div className={styles.infoBox}>
                      <FiInfo style={{ marginRight: "0.4rem", verticalAlign: "middle" }} />
                      <strong>Cuidado con los paréntesis:</strong> si usás paréntesis y alguno de los IDs de CDA es prefijo numérico de otro (ej: <code>cda1</code> y <code>cda1050</code>), el motor de validación del servidor puede fallar con error 500 (bug conocido, reportado). Si te pasa, probá evitar los paréntesis cuando todos los términos usan el mismo conector (<code>and</code> ya tiene más precedencia que <code>or</code>, así que en la mayoría de los casos no hacen falta).
                    </div>
                  </div>
                )}

                <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
                  <Button
                    type="submit"
                    variant="blue"
                    size="md"
                    isLoading={isSaving}
                  >
                    Guardar Configuración
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>

        {/* COLUMNA DERECHA: Listado de CDAs */}
        <div className={styles.rightCol}>
          <h2 className={styles.sectionTitle}>Selección de Criterios (CDAs)</h2>

          {!selectedPantalla ? (
            <div className={styles.emptyMsg}>
              Seleccioná una pantalla a la izquierda para ver y vincular criterios.
            </div>
          ) : isLoadingCdas || isLoadingConfig ? (
            <div style={{ display: "flex", justifyContent: "center", padding: "3rem" }}>
              <Spinner size={40} />
            </div>
          ) : (
            <>
              {/* Buscador */}
              <div className={styles.searchBox}>
                <InputSimple
                  label="Buscar CDA por nombre, expresión o ID..."
                  value={searchTerm}
                  onChange={setSearchTerm}
                  variant="admin"
                  hideErrorSpace={true}
                />
              </div>

              <div className={styles.checklistHeader}>
                <span>Seleccionados: {selectedCdaIds.length}</span>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button type="button" onClick={handleSelectAll} className={styles.checkAllBtn}>
                    Seleccionar Todos
                  </button>
                  <button type="button" onClick={handleSelectNone} className={styles.checkAllBtn}>
                    Deseleccionar
                  </button>
                </div>
              </div>

              <div className={styles.cdasListContainer}>
                {filteredCdas.length === 0 ? (
                  <div className={styles.emptyMsg}>
                    No se encontraron criterios de aceptación que coincidan con la búsqueda.
                  </div>
                ) : (
                  filteredCdas.map((cda) => {
                    const id = getCdaId(cda);
                    if (id === undefined) return null;
                    const isActive = selectedCdaIds.includes(id);

                    return (
                      <div
                        key={id}
                        className={`${styles.cdaRow} ${isActive ? styles.cdaRowActive : ""}`}
                        onClick={() => handleToggleCda(id)}
                      >
                        <div className={styles.checkboxWrapper}>
                          <div className={styles.customCheckbox}>
                            {isActive && <FiCheck size={12} className={styles.checkmarkIcon} />}
                          </div>
                        </div>
                        
                        <div className={styles.cdaDetails}>
                          <div className={styles.cdaHeaderInfo}>
                            <span className={styles.cdaDesc} title={getCdaDesc(cda)}>{getCdaDesc(cda)}</span>
                            <span className={styles.cdaIdBadge}>ID: {id}</span>
                          </div>
                          <span className={styles.cdaExpr} title={getCdaExpr(cda)}>Expresión: {getCdaExpr(cda)}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
