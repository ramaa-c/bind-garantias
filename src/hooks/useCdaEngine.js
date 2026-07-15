import { useState, useCallback } from "react";
import { cdaService } from "../services/cdaService";

// El CDA "Valida al socio que no sea socio protector de otra SGR" (ID 10) es
// el único criterio no bloqueante: si no se cumple, es informativo pero no
// impide avanzar. `ListTest` (la respuesta de cda/execute) ya no trae el
// CdaID de cada ítem, así que se identifica por el texto exacto de su
// MensajeRechazo. Frágil: si se edita el mensaje de ese CDA en CDAs
// Globales, hay que actualizar este texto también.
const MENSAJE_CDA_NO_BLOQUEANTE = "Reviste carácter de socio protector de otra SGR";

export const useCdaEngine = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ejecutarValidaciones = useCallback(async (pantalla, cuit, cadenaValorId = null) => {
    setLoading(true);
    setError(null);

    try {
      const cuitLimpio = String(cuit).replace(/\D/g, "");
      console.log(
        `[CDA ENGINE] Ejecutando validaciones para pantalla "${pantalla}", CUIT ${cuitLimpio} y CadenaValorID ${cadenaValorId}`,
      );

      // 202: WSResponseCDA { Result: true, ListTest: [...] } - pasó todo.
      await cdaService.ejecutarCda(pantalla, cuitLimpio, cadenaValorId);

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
          const isInvalidante = mensaje.trim() !== MENSAJE_CDA_NO_BLOQUEANTE;
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
