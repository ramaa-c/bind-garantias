import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useActualizarCda, useObtenerCda } from "../../../hooks/useCda";
import { useUsuarioWebIdActual } from "../../../hooks/useUsuario";
import { cadenaValorService } from "../../../services/cadenaValorService";
import { esCdaActivo, esCdaActivoEstricto, getCdaId, getCdaProp } from "../../../utils/cdaUtils";
import { resolverGrupoCda } from "../../../utils/grupoCdaUtils";
import { TODAS_PANTALLAS_CDA_GLOBAL } from "../../../utils/pantallasCda";
import { Spinner } from "../../../components/ui/Spinner/Spinner";
import { ConfirmacionModal } from "../../../components/features/shared/ConfirmacionModal/ConfirmacionModal";
import { CdaWorkbench, ToggleOptionRow } from "../../../components/features/admin/CdaWorkbench/CdaWorkbench";
import { FiAlertCircle } from "react-icons/fi";
import { useBloqueoAdminRestringido } from "../../../hooks/useBloqueoAdminRestringido";
import styles from "./CdaFormPage.module.css";

// Alta/edición de un Criterio de Aceptación Global. Ruta propia (separada
// del listado en CdasGlobales.jsx - ver el comentario ahí sobre el porqué)
// para /admin/cdas/nuevo (esCdaId ausente) y /admin/cdas/:cdaId (edición).
export default function CdaFormPage() {
  // Defensa en profundidad: ver useBloqueoAdminRestringido.
  const bloqueado = useBloqueoAdminRestringido();
  const { cdaId } = useParams();
  const esEdicion = !!cdaId;
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { mutateAsync: actualizarCda } = useActualizarCda();
  const usuarioWebId = useUsuarioWebIdActual();

  // useObtenerCda ya gatea "enabled" con !!cdaId por su cuenta.
  const { data: cdaData, isLoading: isLoadingCda } = useObtenerCda(cdaId);
  // El GET filtrado por CdaID devuelve la misma forma "array o envuelto" que
  // el listado completo (ver cdaService.obtenerCda) - nunca un objeto suelto.
  const cdaEncontrado = esEdicion
    ? (Array.isArray(cdaData) ? cdaData[0] : cdaData?.items?.[0] || cdaData?.data?.[0] || (cdaData && !cdaData.items && !cdaData.data ? cdaData : null))
    : null;
  // Un CDA desactivado (Activo="0") se comporta como eliminado en todos los
  // listados (ver esCdaActivoEstricto) - entrar a su URL directamente no
  // debería dejar "revivirlo" por accidente.
  const cdaEditando = cdaEncontrado && esCdaActivoEstricto(cdaEncontrado) ? cdaEncontrado : null;
  const noEncontrado = esEdicion && !isLoadingCda && !cdaEditando;

  const [isEliminando, setIsEliminando] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [postSaveModalOpen, setPostSaveModalOpen] = useState(false);

  // Opciones de vinculación extra del workbench (ver CdaWorkbench.jsx): son
  // específicas de este catálogo global, así que el estado vive acá y no
  // dentro del componente compartido. Un Set por pantalla (en vez de un
  // único booleano) porque un CDA nuevo puede tener sentido para una sola
  // pantalla (ej. un CDA de Alta de Línea no debería terminar vinculado
  // también a Ingreso de CUIT solo porque se tildó "vincular a existentes").
  const [vincularPantallas, setVincularPantallas] = useState(() => new Set());
  const [propagarPantallas, setPropagarPantallas] = useState(() => new Set());

  const togglePantallaEnSet = (setState, pantalla) => {
    setState((prev) => {
      const next = new Set(prev);
      if (next.has(pantalla)) next.delete(pantalla);
      else next.add(pantalla);
      return next;
    });
  };

  const volverAlListado = () => navigate("/admin/cdas");

  // Vincula un CDA puntual a todas las cadenas de valor YA EXISTENTES, en las
  // pantallas elegidas por el admin (checkbox por pantalla, ver
  // ToggleOptionRow más abajo). Es una acción explícita: el flag
  // "vinculadefaultcv" solo controla si el backend lo suma automáticamente a
  // las cadenas de valor que se creen de ahora en adelante, no a las actuales.
  const vincularCdaEnCadenasExistentes = async (cdaIdVinculo, valorParaVincular, pantallas) => {
    toast.info("Vinculando criterio de aceptación a las cadenas de valor existentes...");
    try {
      const todasCadenas = await cadenaValorService.obtenerTodasWeb();
      const cadenasList = Array.isArray(todasCadenas) ? todasCadenas : todasCadenas?.items || todasCadenas?.data || [];

      let linkedCount = 0;
      for (const cadena of cadenasList) {
        const cadenaId = cadena.cadenavalorid || cadena.CadenaValorID;
        if (!cadenaId) continue;

        for (const pantalla of pantallas) {
          try {
            const grupo = await resolverGrupoCda(pantalla.value, cadenaId);
            const linkedCdas = await cadenaValorService.obtenerCdasPorGrupo(grupo.grupocdaid);
            const linkedCdasList = Array.isArray(linkedCdas) ? linkedCdas : linkedCdas?.items || linkedCdas?.data || [];

            const yaVinculado = linkedCdasList.some((c) => getCdaId(c) === cdaIdVinculo);

            if (!yaVinculado) {
              // El POST ahora agrega en vez de reemplazar: alcanza con mandar
              // únicamente el CDA nuevo, no hace falta reenviar los existentes.
              await cadenaValorService.vincularCdasAGrupo({
                grupocdaid: grupo.grupocdaid,
                listacda: [{ cdaid: cdaIdVinculo, valorcomparacion: valorParaVincular, usuariowebid: usuarioWebId }],
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

  // Sobrescribe el valor por cadena en TODAS las cadenas donde este CDA ya
  // está vinculado y activo, en las pantallas elegidas por el admin (no toca
  // las que no lo tienen vinculado: para eso está "vincularPantallas"). Es
  // la acción disparada por los checkboxes de "aplicar valor" al editar un
  // CDA global.
  const propagarValorATodasLasCadenasActivas = async (cdaIdVinculo, valorNuevo, pantallas) => {
    toast.info("Aplicando el nuevo valor en las cadenas donde este criterio está activo...");
    try {
      const todasCadenas = await cadenaValorService.obtenerTodasWeb();
      const cadenasList = Array.isArray(todasCadenas) ? todasCadenas : todasCadenas?.items || todasCadenas?.data || [];

      let actualizadas = 0;
      for (const cadena of cadenasList) {
        const cadenaId = cadena.cadenavalorid || cadena.CadenaValorID;
        if (!cadenaId) continue;

        for (const pantalla of pantallas) {
          try {
            const grupo = await resolverGrupoCda(pantalla.value, cadenaId);
            const linkedCdas = await cadenaValorService.obtenerCdasPorGrupo(grupo.grupocdaid);
            const linkedCdasList = Array.isArray(linkedCdas) ? linkedCdas : linkedCdas?.items || linkedCdas?.data || [];
            const vinculacion = linkedCdasList.find((c) => getCdaId(c) === cdaIdVinculo);
            if (!vinculacion || !esCdaActivo(vinculacion)) continue;

            const cdaCadenaValorId = getCdaProp(vinculacion, "cdacadenavalorid");
            if (cdaCadenaValorId === "" || cdaCadenaValorId === undefined) {
              console.warn(`No se encontró CdaCadenaValorID para el CDA ${cdaIdVinculo} en la cadena ${cadenaId} (${pantalla.value}); se omite.`);
              continue;
            }

            await cadenaValorService.actualizarVinculacionCda({
              cdacadenavalorid: cdaCadenaValorId,
              grupocdaid: grupo.grupocdaid,
              cdaid: cdaIdVinculo,
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
  const handleGuardarWorkbench = async (_payloadCda, { esEdicion: fueEdicion, cdaId: idGuardado, valorParaLog }) => {
    try {
      if (fueEdicion) {
        if (propagarPantallas.size > 0 && idGuardado) {
          const pantallas = TODAS_PANTALLAS_CDA_GLOBAL.filter((p) => propagarPantallas.has(p.value));
          await propagarValorATodasLasCadenasActivas(idGuardado, valorParaLog, pantallas);
        }
        await queryClient.invalidateQueries({ queryKey: ['cda'] });
        await queryClient.invalidateQueries({ queryKey: ['cadenaValor'] });
        toast.success("Criterio de Aceptación actualizado exitosamente.");
        setPostSaveModalOpen(true);
        return true;
      }

      if (vincularPantallas.size > 0 && idGuardado) {
        const pantallas = TODAS_PANTALLAS_CDA_GLOBAL.filter((p) => vincularPantallas.has(p.value));
        await vincularCdaEnCadenasExistentes(idGuardado, valorParaLog, pantallas);
      }

      await queryClient.invalidateQueries({ queryKey: ['cda'] });
      await queryClient.invalidateQueries({ queryKey: ["cda", "pantallaGrupo"] });
      await queryClient.invalidateQueries({ queryKey: ["cda", "idsPorPantalla"] });
      await queryClient.invalidateQueries({ queryKey: ['cadenaValor'] });
      toast.success("Criterio de Aceptación Global creado exitosamente.");
      // El atajo del modal solo tiene sentido si el CDA quedó SIN vincular a
      // ninguna pantalla. Si se tildó al menos una, ya se vinculó a todas
      // las cadenas existentes en esa pantalla más arriba - mostrarlo acá
      // empujaba a vincularlo otra vez a mano y duplicaba la fila.
      if (vincularPantallas.size === 0) {
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
      volverAlListado();
    } catch (err) {
      console.error(err);
      const backendMessage = err.response?.data?.message || err.response?.data?.Message || (typeof err.response?.data === "string" ? err.response.data : null);
      toast.error(backendMessage || "Ocurrió un error al eliminar el CDA.");
    } finally {
      setIsEliminando(false);
      setDeleteConfirmOpen(false);
    }
  };

  if (bloqueado) return null;

  if (esEdicion && isLoadingCda) {
    return (
      <div className={styles.loadingWrap}>
        <Spinner />
      </div>
    );
  }

  if (noEncontrado) {
    return (
      <div className={styles.notFoundWrap}>
        <FiAlertCircle size={40} />
        <h2>No se encontró el criterio</h2>
        <p>Puede que ya haya sido eliminado o el enlace esté mal escrito.</p>
        <button type="button" className={styles.notFoundLink} onClick={volverAlListado}>
          Volver al listado
        </button>
      </div>
    );
  }

  return (
    <>
      <CdaWorkbench
        cdaEditando={cdaEditando}
        onCancel={volverAlListado}
        onGuardar={handleGuardarWorkbench}
        onEliminar={cdaEditando ? handleEliminarCda : undefined}
        isEliminando={isEliminando}
        extraToggleOptions={
          !cdaEditando ? (
            <>
              {TODAS_PANTALLAS_CDA_GLOBAL.map((p) => (
                <ToggleOptionRow
                  key={p.value}
                  label={`Vincular a existentes — ${p.label}`}
                  description={`Al guardar, este criterio va a pasar a estar activo en todas las cadenas de valor que ya existen, para la pantalla "${p.label}".`}
                  checked={vincularPantallas.has(p.value)}
                  onToggle={() => togglePantallaEnSet(setVincularPantallas, p.value)}
                />
              ))}
            </>
          ) : (
            <>
              {TODAS_PANTALLAS_CDA_GLOBAL.map((p) => (
                <ToggleOptionRow
                  key={p.value}
                  label={`Aplicar valor — ${p.label}`}
                  description={`Sobrescribe el valor de comparación en cada cadena donde este criterio ya está vinculado y activo para la pantalla "${p.label}". Después se puede volver a personalizar por cadena desde CDAs por Cadena / CDAs Alta de Línea.`}
                  checked={propagarPantallas.has(p.value)}
                  onToggle={() => togglePantallaEnSet(setPropagarPantallas, p.value)}
                />
              ))}
            </>
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

      <ConfirmacionModal
        isOpen={postSaveModalOpen}
        onClose={() => setPostSaveModalOpen(false)}
        onConfirm={() => { setPostSaveModalOpen(false); navigate("/admin/cadenas-cda"); }}
        titulo="Vincular a una Cadena"
        mensaje='El criterio se guardó correctamente, pero todavía no está vinculado a ninguna cadena. ¿Querés ir ahora a "CDAs por Cadena" para vincularlo? (Si es para Alta de Línea, se vincula en cambio desde "CDAs Alta de Línea".)'
        variant="blue"
        confirmText="IR AHORA"
        cancelText="MÁS TARDE"
        confirmVariant="blue"
        cancelVariant="outlineBlue"
      />
    </>
  );
}
