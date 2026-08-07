import { useState, useCallback } from "react";
import { cdaService } from "../services/cdaService";

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

export const useCdaEngine = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ejecutarValidaciones = useCallback(async (pantalla, entidad, cadenaValorId = null, usuarioId = null) => {
    setLoading(true);
    setError(null);

    try {
      console.log(
        `[CDA ENGINE] Ejecutando validaciones para pantalla "${pantalla}", entidad ${JSON.stringify(entidad)}, CadenaValorID ${cadenaValorId} y UsuarioID ${usuarioId}`,
      );

      // 202: WSResponseCDA { Result: true, ListTest: [...] } - pasó todo.
      const data = await cdaService.ejecutarCda(pantalla, entidad, cadenaValorId, usuarioId);

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
          const vinculados = await cdaService.obtenerGrupoCda(pantalla, cadenaValorId);
          const cantidadEsperada = Array.isArray(vinculados) ? vinculados.length : 0;

          if (cantidadEsperada > 0 && listTest.length < cantidadEsperada) {
            console.log(
              `[CDA ENGINE] ListTest incompleto (${listTest.length}/${cantidadEsperada}): al menos un CDA se salteó, probablemente por una integración deshabilitada.`,
            );
            setLoading(false);
            return {
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
      return { success: true, errors: [] };
    } catch (err) {
      console.error("[CDA ENGINE] Error durante la validación del CDA:", err);

      const status = err.response?.status;
      const responseData = err.response?.data;
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
      if (status === 406 && responseData && typeof responseData === "object" && !isInfraError) {
        const listTest = responseData.listtest ?? responseData.ListTest ?? [];
        const rechazos = listTest.filter((t) => (t.result ?? t.Result) === false);

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
            success: false,
            errors: [
              {
                cdaid: 0,
                isInvalidante: true,
                message: "No se cumplieron los criterios de aceptación.",
                isSystemError: false,
              },
            ],
          };
        }

        const hasBlockingErrors = mappedErrors.some((e) => e.isInvalidante);
        return { success: !hasBlockingErrors, errors: mappedErrors };
      }

      // 400 / 500 / red / cualquier otra cosa: error de sistema, no un
      // rechazo de negocio real.
      let msg =
        responseData?.message ||
        responseData?.Message ||
        err.message ||
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
