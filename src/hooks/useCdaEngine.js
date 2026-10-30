import { useState, useCallback } from "react";
import { cadenaValorService } from "../services/cadenaValorService";
import { cdaService } from "../services/cdaService";
import { esCdaActivo } from "../utils/cdaUtils";
import { esMensajeUtil } from "../utils/mensajesError";

// El CDA "Valida al socio que no sea socio protector de otra SGR" (ID 10) es
// el único criterio no bloqueante: si no se cumple, es informativo pero no
// impide avanzar. `ListTest` (la respuesta de cda/execute) ya no trae el
// CdaID de cada ítem, así que se identifica por el texto de su
// MensajeRechazo. En vez de una comparación exacta (frágil ante cualquier
// cambio de mayúsculas/espaciado en el admin de CDAs Globales), se matchea
// por inclusión de una frase clave normalizada (minúsculas, espacios
// colapsados) — tolera esos cambios menores. Igual sigue dependiendo de que
// el backend no reescriba el mensaje por completo; si eso pasa, hay que
// actualizar `FRASES_CDA_NO_BLOQUEANTES` acá.
const FRASES_CDA_NO_BLOQUEANTES = ["socio protector de otra sgr"];

const normalizarTexto = (texto) =>
  String(texto || "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

const esCdaNoBloqueante = (mensaje) => {
  const mensajeNormalizado = normalizarTexto(mensaje);
  return FRASES_CDA_NO_BLOQUEANTES.some((frase) =>
    mensajeNormalizado.includes(frase),
  );
};

const parsearCuerpo = (data) => {
  if (typeof data !== "string") return data;
  try {
    return JSON.parse(data);
  } catch {
    return data;
  }
};

const esMensajeGenericoAxios = (mensaje) =>
  /^Request failed with status code \d+$/i.test(String(mensaje || "").trim());

const contarCdasActivos = async (pantalla, cadenaValorId) => {
  const grupos = await cdaService.obtenerGrupoCda(pantalla, cadenaValorId);
  const grupoCdaId = Array.isArray(grupos) ? grupos[0]?.grupocdaid : null;
  if (!grupoCdaId) return 0;
  const vinculados = await cadenaValorService.obtenerCdasPorGrupo(grupoCdaId);
  const lista = Array.isArray(vinculados) ? vinculados : [];
  return new Set(lista.filter(esCdaActivo).map((c) => Number(c.cdaid))).size;
};

const datosDeEjecucion = (cuerpo) => ({
  momento: cuerpo?.momento ?? cuerpo?.Momento ?? null,
  pantallaGrupoCdaId: cuerpo?.pantallagrupocdaid ?? cuerpo?.PantallaGrupoCdaID ?? null,
});

export const useCdaEngine = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ejecutarValidaciones = useCallback(async (pantalla, entidad, cadenaValorId = null) => {
    setLoading(true);
    setError(null);

    try {
      console.log(
        `[CDA ENGINE] Ejecutando validaciones para pantalla "${pantalla}", entidad ${JSON.stringify(entidad)}, CadenaValorID ${cadenaValorId}`,
      );

      // 202: WSResponseCDA { Result: true, ListTest: [...] } - pasó todo.
      const data = await cdaService.ejecutarCda(pantalla, entidad, cadenaValorId);

      // ⚠️ Cuando una integración está deshabilitada desde Modo Offline
      // (StatusPlataforma), el backend NO marca como pendiente/rechazado el
      // CDA que depende de ella: directamente lo OMITE de ListTest, y el
      // grupo sigue dando Result:true (aprobación vacía sobre lo que sí pudo
      // evaluar). Comparamos el tamaño real de ListTest contra la cantidad
      // de CDAs vinculados a esta pantalla+cadena — si hay menos, tratamos
      // el resultado como pendiente en vez de confiar ciegamente en el 202.
      //
      // Esto solo protege este intento puntual: el backend igual registra
      // el grupo como Aprobado en su historial (no tiene noción de
      // "incompleto"), así que un reingreso posterior no vuelve a pasar por
      // acá — es una mitigación parcial, no un cierre completo del hueco.
      if (cadenaValorId) {
        try {
          const listTest = data?.listtest ?? data?.ListTest ?? [];
          const cantidadEsperada = await contarCdasActivos(pantalla, cadenaValorId);

          if (cantidadEsperada > 0 && listTest.length < cantidadEsperada) {
            console.log(
              `[CDA ENGINE] ListTest incompleto (${listTest.length}/${cantidadEsperada}): al menos un CDA se salteó, probablemente por una integración deshabilitada.`,
            );
            setLoading(false);
            return {
              ...datosDeEjecucion(data),
              success: false,
              errors: [
                {
                  cdaid: 0,
                  isInvalidante: true,
                  isPendiente: true,
                  message:
                    "No pudimos completar todas las validaciones porque un servicio requerido no está disponible en este momento. La solicitud queda pendiente de revisión y un administrador podrá reintentarla cuando el servicio esté disponible.",
                  isSystemError: false,
                },
              ],
            };
          }
        } catch (grupoError) {
          console.warn(
            "[CDA ENGINE] No se pudo verificar la cantidad de CDAs vinculados (se continúa sin bloquear):",
            grupoError,
          );
        }
      }

      console.log(
        `[CDA ENGINE] Validaciones de CDAs para pantalla "${pantalla}" superadas con éxito (Status: 202)`,
      );

      setLoading(false);
      return { ...datosDeEjecucion(data), success: true, errors: [] };
    } catch (err) {
      console.error("[CDA ENGINE] Error durante la validación del CDA:", err);

      const status = err.response?.status;
      const responseData = parsearCuerpo(err.response?.data);
      console.log("[CDA ENGINE] Status:", status, "| Response data:", responseData);

      const isInfraError =
        status >= 500 ||
        (typeof responseData === "string" &&
          /FireDAC|Exception|Cannot acquire item|Connection/i.test(responseData));

      // 409 = "dato faltante": el backend evaluó el CDA pero una integración
      // necesaria no devolvió el dato (p. ej. está deshabilitada) y lo dejó
      // registrado como Pendiente en su historial. Rechazamos el alta ahora
      // mismo; no tiene sentido que el usuario reintente porque la integración
      // sigue caída del lado del backend. Un admin lo re-ejecuta más tarde
      // desde el panel (ver reejecutarCda) cuando la integración vuelva.
      if (status === 409) {
        console.log(
          "[CDA ENGINE] CDA quedó pendiente (409): integración sin dato disponible",
        );

        setLoading(false);
        return {
          ...datosDeEjecucion(responseData),
          success: false,
          errors: [
            {
              cdaid: 0,
              isInvalidante: true,
              isPendiente: true,
              message:
                "No pudimos completar una de las validaciones porque el servicio consultado no está disponible en este momento. La solicitud queda pendiente de revisión y un administrador podrá reintentarla cuando el servicio esté disponible.",
              isSystemError: false,
            },
          ],
        };
      }

      // 406: WSResponseCDA { Result: false, ListTest: [{ Result, Valor, Mensaje }] }
      // Rechazo de negocio normal: se arman los errores a partir de los
      // ítems que dieron Result=false.
      if (status === 406 && !isInfraError) {
        const cuerpoObjeto = responseData && typeof responseData === "object" ? responseData : {};
        const listTest = cuerpoObjeto.listtest ?? cuerpoObjeto.ListTest ?? [];
        const rechazos = (Array.isArray(listTest) ? listTest : []).filter(
          (t) => (t.result ?? t.Result) === false,
        );
        const mensajeTextoPlano =
          typeof responseData === "string" &&
          esMensajeUtil(responseData) &&
          !responseData.trim().startsWith("{")
            ? responseData.trim()
            : "";

        const mappedErrors = rechazos.map((t) => {
          const mensaje =
            t.mensaje || t.Mensaje || "No se cumple el criterio de aceptación.";
          const isInvalidante = !esCdaNoBloqueante(mensaje);
          return {
            cdaid: 0,
            isInvalidante,
            message: mensaje,
            isSystemError: false,
          };
        });

        setLoading(false);

        if (mappedErrors.length === 0) {
          // 406 sin detalle de qué falló: tratar como bloqueante genérico.
          return {
            ...datosDeEjecucion(cuerpoObjeto),
            success: false,
            errors: [
              {
                cdaid: 0,
                isInvalidante: true,
                message: mensajeTextoPlano || "No se cumplieron los criterios de aceptación.",
                isSystemError: false,
              },
            ],
          };
        }

        const hasBlockingErrors = mappedErrors.some((e) => e.isInvalidante);
        return { ...datosDeEjecucion(cuerpoObjeto), success: !hasBlockingErrors, errors: mappedErrors };
      }

      // 400 "CDAs Inexistentes": no hay ningún CDA vinculado a esta
      // combinación de pantalla+cadena — no es un error ni un rechazo, es
      // que no hay nada que validar. Confirmado en vivo el 2026-08-13
      // contra una cadena real sin CDAs activos vinculados (COMAFI/
      // PANTALLA_INGRESO_CUIT): {"Message":"CDAs Inexistentes"}. Se trata
      // como aprobado — nunca se había probado este caso antes.
      const mensajeBackend =
        (typeof responseData === "string" ? responseData : responseData?.message || responseData?.Message) || "";
      if (status === 400 && /cdas inexistentes/i.test(mensajeBackend)) {
        console.log(
          `[CDA ENGINE] No hay CDAs vinculados para "${pantalla}" en esta cadena — se considera aprobado.`,
        );
        setLoading(false);
        return { success: true, errors: [] };
      }

      // 403/404: la API no reconoce la entidad como propia del usuario. No es
      // una integración caída: quien llama no debe tomarlo como "dejar pasar".
      if (status === 403 || status === 404) {
        setLoading(false);
        return {
          success: false,
          errors: [
            {
              cdaid: 0,
              isInvalidante: true,
              message:
                (esMensajeUtil(mensajeBackend) && mensajeBackend) ||
                "No se pudieron evaluar los criterios de aceptación. Intentá nuevamente o contactá a soporte.",
              isSystemError: true,
              isAccesoRechazado: true,
            },
          ],
        };
      }

      // 400 (cualquier otro motivo) / 500 / red / cualquier otra cosa: error
      // de sistema, no un rechazo de negocio real.
      const mensajeApi = responseData?.message || responseData?.Message;
      let msg =
        (esMensajeUtil(mensajeApi) && mensajeApi) ||
        (!esMensajeGenericoAxios(err.message) && esMensajeUtil(err.message) && err.message) ||
        "Error de comunicación con el servicio de validación CDA.";
      if (isInfraError) {
        msg =
          "El servicio de validaciones no se encuentra disponible momentáneamente. Por favor, intente nuevamente.";
      }

      setLoading(false);
      return {
        success: false,
        errors: [
          {
            cdaid: 0,
            isInvalidante: true,
            message: msg,
            isSystemError: true,
            isPedidoRechazado: status === 400,
          },
        ],
      };
    }
  }, []);

  return {
    loading,
    error,
    ejecutarValidaciones,
  };
};
