import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useActualizarCda, useObtenerTodosCdas } from "../../../hooks/useCda";
import { useUsuarioWebIdActual } from "../../../hooks/useUsuario";
import { cadenaValorService } from "../../../services/cadenaValorService";
import { esCdaActivo, esCdaActivoEstricto } from "../../../utils/cdaUtils";
import { resolverGrupoCda } from "../../../utils/grupoCdaUtils";
import { PANTALLAS_CDA } from "../../../utils/pantallasCda";
import { Button } from "../../../components/ui/Button/Button";
import { Skeleton } from "../../../components/ui/Skeleton/Skeleton";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { CdaWorkbench, ToggleOptionRow } from "../../../components/features/admin/CdaWorkbench/CdaWorkbench";
import { FiPlus, FiChevronRight, FiSearch, FiInbox } from "react-icons/fi";
import styles from "./CdasGlobales.module.css";

// Colores distintivos por integración, usados como badges en el listado
const INTEGRACION_PREFIXES = {
  ARCA: "afip.",
  CASFOG: "casfog.",
  LUFE: "lufe.",
  NOSIS: "nosis.",
  SGRPLUS: "sgrplus."
};

const INTEGRACION_COLORS = {
  ARCA: { bg: "rgba(88, 166, 255, 0.12)", color: "#58a6ff", border: "rgba(88, 166, 255, 0.35)" },
  NOSIS: { bg: "rgba(179, 136, 255, 0.12)", color: "#b388ff", border: "rgba(179, 136, 255, 0.35)" },
  LUFE: { bg: "rgba(221, 155, 32, 0.12)", color: "#dd9b20", border: "rgba(221, 155, 32, 0.35)" },
  CASFOG: { bg: "rgba(255, 121, 198, 0.12)", color: "#ff79c6", border: "rgba(255, 121, 198, 0.35)" },
  SGRPLUS: { bg: "rgba(56, 161, 105, 0.12)", color: "#38a169", border: "rgba(56, 161, 105, 0.35)" },
};
const INTEGRACION_COLOR_DEFAULT = { bg: "rgba(139, 148, 158, 0.12)", color: "#8b949e", border: "rgba(139, 148, 158, 0.3)" };

const detectarIntegracion = (expr) => {
  const e = (expr || "").toLowerCase();
  const found = Object.entries(INTEGRACION_PREFIXES).find(([, prefix]) => e.startsWith(prefix.toLowerCase()));
  return found ? found[0] : "";
};

const getCdaId = (c) => {
  if (!c) return undefined;
  return c.cdaid !== undefined ? c.cdaid : (c.CdaId !== undefined ? c.CdaId : c.CdaID);
};

const getCdaProp = (c, propName) => {
  if (!c) return "";
  const pascal = propName.charAt(0).toUpperCase() + propName.slice(1);
  const val = c[propName] !== undefined ? c[propName] : c[pascal];
  return val !== undefined && val !== null ? val : "";
};

const CdaRowSkeleton = () => (
  <tr>
    <td>
      <Skeleton height="0.85rem" width="65%" style={{ marginBottom: "0.4rem" }} />
      <Skeleton height="0.65rem" width="35%" />
    </td>
    <td><Skeleton height="1.2rem" width="70px" radius="pill" /></td>
    <td><Skeleton height="0.8rem" width="85%" /></td>
    <td><Skeleton height="0.8rem" width="70%" /></td>
    <td style={{ textAlign: "center" }}><Skeleton height="1.2rem" width="36px" radius="pill" style={{ margin: "0 auto" }} /></td>
    <td></td>
  </tr>
);

export default function CdasGlobales() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutateAsync: actualizarCda } = useActualizarCda();
  const { data: todosCdasData, isLoading: isLoadingLista } = useObtenerTodosCdas();
  const usuarioWebId = useUsuarioWebIdActual();
  const [isEliminando, setIsEliminando] = useState(false);

  // "lista": listado de CDAs existentes. "formulario": alta/edición (misma pantalla para ambos casos).
  const [vista, setVista] = useState("lista");
  const [cdaEditando, setCdaEditando] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postSaveModalOpen, setPostSaveModalOpen] = useState(false);

  // Opciones de vinculación extra del workbench (ver CdaWorkbench.jsx): son
  // específicas de este catálogo global, así que el estado vive acá y no
  // dentro del componente compartido.
  const [vincularExistentes, setVincularExistentes] = useState(false);
  const [propagarValorATodasCadenas, setPropagarValorATodasCadenas] = useState(false);

  // A diferencia de esCdaActivo (que tolera "" para no romper la vinculación
  // de CDAs migrados que ya estaban linkeados), esta lista es estricta:
  // solo se muestran los CDA con Activo="1" explícito. Uno en "0" o vacío
  // (dato migrado sin completar) no aparece. Mismo criterio que CdaPanel.
  const todosCdasList = (Array.isArray(todosCdasData) ? todosCdasData : todosCdasData?.items || todosCdasData?.data || []).filter(esCdaActivoEstricto);

  const cdasFiltrados = todosCdasList.filter((c) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      String(getCdaProp(c, "descripcion")).toLowerCase().includes(term) ||
      String(getCdaProp(c, "expresion")).toLowerCase().includes(term)
    );
  });

  const handleCrearNuevo = () => {
    setCdaEditando(null);
    setVincularExistentes(false);
    setPropagarValorATodasCadenas(false);
    setVista("formulario");
  };

  const handleEditarCda = (cda) => {
    setCdaEditando(cda);
    setVincularExistentes(false);
    setPropagarValorATodasCadenas(false);
    setVista("formulario");
  };

  const handleCerrarFormulario = () => {
    setCdaEditando(null);
    setVista("lista");
  };

  // Vincula un CDA puntual a todas las cadenas de valor YA EXISTENTES, en
  // ambas pantallas. Es una acción explícita disparada por el checkbox
  // "vincularExistentes": el flag "vinculadefaultcv" solo controla si el
  // backend lo suma automáticamente a las cadenas de valor que se creen de
  // ahora en adelante, no a las actuales.
  const vincularCdaEnCadenasExistentes = async (cdaId, valorParaVincular) => {
    toast.info("Vinculando criterio de aceptación a las cadenas de valor existentes...");
    try {
      const todasCadenas = await cadenaValorService.obtenerTodasWeb();
      const cadenasList = Array.isArray(todasCadenas) ? todasCadenas : todasCadenas?.items || todasCadenas?.data || [];

      let linkedCount = 0;
      for (const cadena of cadenasList) {
        const cadenaId = cadena.cadenavalorid || cadena.CadenaValorID;
        if (!cadenaId) continue;

        for (const pantalla of PANTALLAS_CDA) {
          try {
            const grupo = await resolverGrupoCda(pantalla.value, cadenaId);
            const linkedCdas = await cadenaValorService.obtenerCdasPorGrupo(grupo.grupocdaid);
            const linkedCdasList = Array.isArray(linkedCdas) ? linkedCdas : linkedCdas?.items || linkedCdas?.data || [];

            const yaVinculado = linkedCdasList.some((c) => getCdaId(c) === cdaId);

            if (!yaVinculado) {
              // El POST ahora agrega en vez de reemplazar: alcanza con mandar
              // únicamente el CDA nuevo, no hace falta reenviar los existentes.
              await cadenaValorService.vincularCdasAGrupo({
                grupocdaid: grupo.grupocdaid,
                listacda: [{ cdaid: cdaId, valorcomparacion: valorParaVincular, usuariowebid: usuarioWebId }],
              });
              linkedCount++;
            }
          } catch (linkErr) {
            console.error(`Error al vincular CDA a la cadena ${cadenaId} (${pantalla.value}):`, linkErr);
          }
        }
      }

      if (linkedCount > 0) {
        toast.success(`Vinculado con éxito a ${linkedCount} combinación${linkedCount !== 1 ? "es" : ""} de cadena y pantalla existente${linkedCount !== 1 ? "s" : ""}.`);
      } else {
        toast.info("El criterio ya estaba vinculado a todas las cadenas de valor existentes.");
      }
    } catch (chainErr) {
      console.error("Error al obtener cadenas de valor para vinculación:", chainErr);
      toast.error("El CDA se guardó, pero no se pudo vincular automáticamente a las cadenas existentes.");
    }
  };

  // Sobrescribe el valor por cadena en TODAS las cadenas y pantallas donde
  // este CDA ya está vinculado y activo (no toca las que no lo tienen
  // vinculado: para eso está "vincularExistentes"). Es la acción disparada
  // por el checkbox "propagarValorATodasCadenas" al editar un CDA global.
  const propagarValorATodasLasCadenasActivas = async (cdaId, valorNuevo) => {
    toast.info("Aplicando el nuevo valor en las cadenas donde este criterio está activo...");
    try {
      const todasCadenas = await cadenaValorService.obtenerTodasWeb();
      const cadenasList = Array.isArray(todasCadenas) ? todasCadenas : todasCadenas?.items || todasCadenas?.data || [];

      let actualizadas = 0;
      for (const cadena of cadenasList) {
        const cadenaId = cadena.cadenavalorid || cadena.CadenaValorID;
        if (!cadenaId) continue;

        for (const pantalla of PANTALLAS_CDA) {
          try {
            const grupo = await resolverGrupoCda(pantalla.value, cadenaId);
            const linkedCdas = await cadenaValorService.obtenerCdasPorGrupo(grupo.grupocdaid);
            const linkedCdasList = Array.isArray(linkedCdas) ? linkedCdas : linkedCdas?.items || linkedCdas?.data || [];
            const vinculacion = linkedCdasList.find((c) => getCdaId(c) === cdaId);
            if (!vinculacion || !esCdaActivo(vinculacion)) continue;

            const cdaCadenaValorId = getCdaProp(vinculacion, "cdacadenavalorid");
            if (cdaCadenaValorId === "" || cdaCadenaValorId === undefined) {
              console.warn(`No se encontró CdaCadenaValorID para el CDA ${cdaId} en la cadena ${cadenaId} (${pantalla.value}); se omite.`);
              continue;
            }

            await cadenaValorService.actualizarVinculacionCda({
              cdacadenavalorid: cdaCadenaValorId,
              grupocdaid: grupo.grupocdaid,
              cdaid: cdaId,
              valorcomparacion: valorNuevo,
              usuariowebid: usuarioWebId,
            });
            actualizadas++;
          } catch (linkErr) {
            console.error(`Error al actualizar el valor del CDA en la cadena ${cadenaId} (${pantalla.value}):`, linkErr);
          }
        }
      }

      if (actualizadas > 0) {
        toast.success(`Valor actualizado en ${actualizadas} combinación${actualizadas !== 1 ? "es" : ""} de cadena y pantalla donde el criterio estaba activo.`);
      } else {
        toast.info("Este criterio no estaba activo en ninguna cadena de valor.");
      }
    } catch (chainErr) {
      console.error("Error al obtener cadenas de valor para propagar el valor:", chainErr);
      toast.error("El CDA se guardó, pero no se pudo propagar el valor a las cadenas donde está activo.");
    }
  };

  // El CDA en sí ya se guardó (CdaWorkbench hizo el POST/PUT antes de
  // llamar acá) - lo único que queda es la vinculación extra elegida por el
  // admin. Si esa parte falla, igual se cierra el formulario (return true):
  // el CDA base quedó guardado, no tiene sentido dejar el form abierto.
  const handleGuardarWorkbench = async (_payloadCda, { esEdicion, cdaId, valorParaLog }) => {
    try {
      if (esEdicion) {
        if (propagarValorATodasCadenas && cdaId) {
          await propagarValorATodasLasCadenasActivas(cdaId, valorParaLog);
        }
        await queryClient.invalidateQueries({ queryKey: ['cda'] });
        await queryClient.invalidateQueries({ queryKey: ['cadenaValor'] });
        toast.success("Criterio de Aceptación actualizado exitosamente.");
        setPostSaveModalOpen(true);
        return true;
      }

      if (vincularExistentes && cdaId) {
        await vincularCdaEnCadenasExistentes(cdaId, valorParaLog);
      }

      await queryClient.invalidateQueries({ queryKey: ['cda'] });
      await queryClient.invalidateQueries({ queryKey: ["cda", "pantallaGrupo"] });
      await queryClient.invalidateQueries({ queryKey: ['cadenaValor'] });
      toast.success("Criterio de Aceptación Global creado exitosamente.");
      // El atajo a "CDAs por Cadena" solo tiene sentido si el CDA quedó SIN
      // vincular a ninguna cadena. Si se tildó "vincular a cadenas
      // existentes", ya se vinculó a todas más arriba - mostrarlo acá
      // empujaba a vincularlo otra vez a mano y duplicaba la fila.
      if (!vincularExistentes) {
        setPostSaveModalOpen(true);
      }
      return true;
    } catch (err) {
      console.error(err);
      toast.error("El CDA se guardó, pero ocurrió un error al procesar la vinculación.");
      return true;
    }
  };

  const handleEliminarCda = () => {
    setDeleteConfirmOpen(true);
  };

  const confirmEliminarCda = async () => {
    if (!cdaEditando) return;
    if (!usuarioWebId) {
      toast.error("No se pudo identificar al usuario logueado; recargá la página e intentá de nuevo.");
      return;
    }
    setIsEliminando(true);
    try {
      // Ya no existe un DELETE físico: se "elimina" marcando activo="0", que
      // hace que el CDA se filtre de todos los listados como si no existiera.
      await actualizarCda({
        cdaID: getCdaId(cdaEditando) ?? 0,
        descripcion: getCdaProp(cdaEditando, "descripcion") || "",
        expresion: getCdaProp(cdaEditando, "expresion") || "",
        expresionLog: getCdaProp(cdaEditando, "expresionlog") || "",
        simboloComparacion: getCdaProp(cdaEditando, "simbolocomparacion") || "",
        valorComparacion: getCdaProp(cdaEditando, "valorcomparacion") || "",
        vinculaDefaultCV: getCdaProp(cdaEditando, "vinculadefaultcv") || "0",
        mensajeRechazo: getCdaProp(cdaEditando, "mensajerechazo") || "",
        activo: "0",
        usuariowebid: usuarioWebId
      });
      await queryClient.invalidateQueries({ queryKey: ['cda'] });
      await queryClient.invalidateQueries({ queryKey: ["cda", "pantallaGrupo"] });
      await queryClient.invalidateQueries({ queryKey: ['cadenaValor'] });
      toast.success("Criterio de Aceptación eliminado correctamente.");
      handleCerrarFormulario();
    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.message || err.response?.data?.Message || (typeof err.response?.data === "string" ? err.response.data : null);
      toast.error(backendMessage || "Ocurrió un error al eliminar el CDA.");
    } finally {
      setIsEliminando(false);
      setDeleteConfirmOpen(false);
    }
  };

  const postSaveModal = (
    <ConfirmacionModal
      isOpen={postSaveModalOpen}
      onClose={() => setPostSaveModalOpen(false)}
      onConfirm={() => { setPostSaveModalOpen(false); navigate("/admin/cadenas-cda"); }}
      titulo="Vincular a una Cadena"
      mensaje='El criterio se guardó correctamente, pero todavía no está activo. ¿Querés ir ahora a "CDAs por Cadena" para vincularlo?'
      variant="blue"
      confirmText="IR AHORA"
      cancelText="MÁS TARDE"
      confirmVariant="blue"
      cancelVariant="outlineBlue"
    />
  );

  if (vista === "lista") {
    return (
      <div className={styles.containerLista}>
        <div className={styles.header}>
          <div className={styles.titleBox}>
            <h1>Criterios de Aceptación Globales</h1>
            <p>Gestioná los criterios de aceptación (CDA) existentes o creá uno nuevo.</p>
          </div>
          <div className={styles.actionsTop}>
            <Button type="button" variant="blue" size="md" onClick={handleCrearNuevo}>
              <FiPlus /> Crear nuevo CDA
            </Button>
          </div>
        </div>

        <div className={styles.filtersCard}>
          <div className={styles.searchWrap}>
            <FiSearch className={styles.iconSearch} />
            <input
              type="text"
              placeholder="Buscar por descripción o expresión..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {!isLoadingLista && (
            <span className={styles.listCount}>
              {cdasFiltrados.length} criterio{cdasFiltrados.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className={styles.tableCard}>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Integración</th>
                  <th>Expresión</th>
                  <th>Mensaje de Rechazo</th>
                  <th style={{ textAlign: "center", width: "160px" }}>Vinculación Default</th>
                  <th style={{ width: "2.5rem" }}></th>
                </tr>
              </thead>
              <tbody>
                {isLoadingLista ? (
                  Array.from({ length: 6 }).map((_, i) => <CdaRowSkeleton key={i} />)
                ) : cdasFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <div className={styles.emptyState}>
                        <FiInbox className={styles.emptyStateIcon} />
                        <span>No hay criterios de aceptación cargados todavía.</span>
                      </div>
                    </td>
                  </tr>
                ) : (
                  cdasFiltrados.map((cda) => {
                    const id = getCdaId(cda);
                    const defaultCv = String(getCdaProp(cda, "vinculadefaultcv"));
                    const esDefault = defaultCv === "1" || defaultCv.toUpperCase() === "S";
                    const integ = detectarIntegracion(getCdaProp(cda, "expresion"));
                    const integColor = INTEGRACION_COLORS[integ] || INTEGRACION_COLOR_DEFAULT;
                    return (
                      <tr key={id} className={styles.clickableRow} onClick={() => handleEditarCda(cda)}>
                        <td>
                          <strong>{getCdaProp(cda, "descripcion") || "-"}</strong>
                          <span className={styles.rowIdTag}>ID #{id}</span>
                        </td>
                        <td>
                          <span
                            className={styles.integracionBadge}
                            style={{ background: integColor.bg, color: integColor.color, borderColor: integColor.border }}
                          >
                            {integ || "—"}
                          </span>
                        </td>
                        <td><code className={styles.tableCode}>{getCdaProp(cda, "expresion") || "-"}</code></td>
                        <td>{getCdaProp(cda, "mensajerechazo") || "-"}</td>
                        <td style={{ textAlign: "center" }}>
                          <span className={esDefault ? styles.pillYes : styles.pillNo}>{esDefault ? "Sí" : "No"}</span>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <FiChevronRight className={styles.rowChevron} />
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {postSaveModal}
      </div>
    );
  }

  return (
    <>
      <CdaWorkbench
        cdaEditando={cdaEditando}
        onCancel={handleCerrarFormulario}
        onGuardar={handleGuardarWorkbench}
        onEliminar={cdaEditando ? handleEliminarCda : undefined}
        isEliminando={isEliminando}
        extraToggleOptions={
          !cdaEditando ? (
            <ToggleOptionRow
              label="Vincular a todas las cadenas existentes"
              description="Al guardar, este criterio va a pasar a estar activo en todas las cadenas de valor que ya existen, en sus dos pantallas (Ingreso de CUIT y Socios)."
              checked={vincularExistentes}
              onToggle={() => setVincularExistentes((v) => !v)}
            />
          ) : (
            <ToggleOptionRow
              label="Aplicar valor en cadenas activas"
              description='Sobrescribe el valor de comparación en cada combinación de cadena y pantalla donde este criterio ya está vinculado y activo (por ejemplo, si en Ingreso de CUIT el score debía ser mayor a 500 y en Socios mayor a 600, en ambas va a quedar el nuevo valor). Después se puede volver a personalizar por cadena y pantalla desde CDAs por Cadena.'
              checked={propagarValorATodasCadenas}
              onToggle={() => setPropagarValorATodasCadenas((v) => !v)}
            />
          )
        }
      />

      <ConfirmacionModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={confirmEliminarCda}
        titulo="Eliminar Criterio de Aceptación"
        mensaje={
          <>
            ¿Confirmás eliminar el criterio <strong>"{getCdaProp(cdaEditando, "descripcion")}"</strong>?
            <br /><br />
            Esta acción borra también su historial y lo desvincula de todas las pantallas y cadenas de valor donde esté en uso. No se puede deshacer.
          </>
        }
        variant="blue"
        tone="danger"
        confirmText="ELIMINAR"
        cancelText="CANCELAR"
        cancelVariant="outlineBlue"
        isLoading={isEliminando}
      />

      {postSaveModal}
    </>
  );
}
