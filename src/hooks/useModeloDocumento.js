import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";
import { catalogosService } from "../services/catalogosService";
import { modeloDocumentoService } from "../services/modeloDocumentoService";
import {
  evaluarModeloDocumento,
  esModeloResolubleDesdeSolicitud,
} from "../utils/parametrosModeloDocumento";
import { useModelosDocumento, useParametrosModelosDocumento } from "./useCatalogos";

// Modelos de un tipo, filtrados a los que realmente se pueden generar desde
// una solicitud: los que piden datos de otro circuito (apoderados de la SGR,
// número de certificado, Fondo de Riesgo) se ocultan del combo en vez de
// dejar que el admin los elija y después no funcionen.
//
// modeloIdActual se mantiene siempre visible aunque no sea resoluble: si no,
// al editar una cadena que ya tiene uno de esos modelos configurado el combo
// aparecería vacío y se perdería la referencia de lo que hay guardado.
export const useModelosDocumentoDisponibles = (tipoModeloDocumentoId, modeloIdActual) => {
  const { data: modelosData, isFetching: cargandoModelos } = useModelosDocumento(tipoModeloDocumentoId);

  const ids = useMemo(
    () => (modelosData?.raw || []).map((m) => m.modelodocumentoid),
    [modelosData],
  );
  const { porModelo, cargando: cargandoParametros } = useParametrosModelosDocumento(ids);

  const todasLasOpciones = modelosData?.opciones || [];

  // Mientras no estén todos los parámetros no se muestra nada: una lista que
  // primero aparece completa y después pierde opciones es peor que esperar.
  const opciones = useMemo(() => {
    if (cargandoParametros) return [];
    return todasLasOpciones.filter((opcion) => {
      if (String(opcion.value) === String(modeloIdActual)) return true;
      // null = no se pudo determinar (ej. falló el pedido): no se oculta.
      return esModeloResolubleDesdeSolicitud(porModelo.get(Number(opcion.value))) !== false;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelosData, porModelo, cargandoParametros, modeloIdActual]);

  return {
    opciones,
    cargando: cargandoModelos || cargandoParametros,
    ocultos: cargandoParametros ? 0 : todasLasOpciones.length - opciones.length,
  };
};

// Genera el PDF del modelo de documento de una solicitud y lo abre en una
// pestaña nueva a pantalla completa - es un contrato, se lee mejor así que
// en un iframe adentro de un modal chico.
//
// La pestaña se abre YA en el click (sincrónico con el gesto del usuario) y
// recién se le carga la URL del PDF cuando termina de generarse - abrirla
// después, ya afuera del gesto, dispara el bloqueador de popups en la
// mayoría de los navegadores. Por eso los parámetros del modelo se piden
// por adelantado (useParametrosModelosDocumento): permiten descartar
// sincrónicamente los modelos que no se pueden resolver, sin llegar a abrir
// una pestaña que después habría que cerrar.
export const useAbrirModeloDocumento = () => {
  const [pendienteId, setPendienteId] = useState(null);

  const abrir = useCallback(async (solicitud, modeloDocumentoId, parametrosCatalogo) => {
    const evaluacionPrevia = evaluarModeloDocumento({
      solicitud,
      modeloDocumentoId,
      parametrosCatalogo,
    });

    if (!evaluacionPrevia.disponible) {
      toast.error(evaluacionPrevia.motivo);
      return;
    }

    const nuevaPestana = window.open("", "_blank");
    setPendienteId(solicitud.id);
    const toastId = toast.loading("Generando el documento...");

    try {
      // Si los parámetros ya venían precargados, la evaluación previa dejó
      // los valores resueltos y no hace falta volver a pedirlos.
      let parametros = evaluacionPrevia.parametros;

      if (!parametros) {
        const catalogo = await catalogosService.obtenerParametrosModeloDocumento(modeloDocumentoId);
        const evaluacion = evaluarModeloDocumento({
          solicitud,
          modeloDocumentoId,
          parametrosCatalogo: catalogo,
        });
        if (!evaluacion.disponible) throw new Error(evaluacion.motivo);
        parametros = evaluacion.parametros;
      }

      const blob = await modeloDocumentoService.generarPDF({ modeloid: modeloDocumentoId, parametros });
      const url = URL.createObjectURL(blob);

      if (nuevaPestana && !nuevaPestana.closed) {
        nuevaPestana.location.href = url;
      } else {
        // El navegador bloqueó la pestaña en blanco (poco común, pero pasa
        // con algunas configuraciones) - se reintenta directo con la URL ya
        // lista, aunque acá sí puede volver a bloquearse por no ser
        // síncrono con el click.
        window.open(url, "_blank");
      }

      // Se libera bastante después de abrir: el navegador necesita la URL
      // viva mientras la pestaña nueva todavía está cargando el PDF.
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      toast.success("Documento generado", { id: toastId });
    } catch (error) {
      nuevaPestana?.close();
      toast.error(error.message || "No se pudo generar el documento", { id: toastId });
    } finally {
      setPendienteId(null);
    }
  }, []);

  return { abrir, pendienteId };
};
