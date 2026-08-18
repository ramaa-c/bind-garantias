import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useEmpresaActiva } from "./useEmpresaActiva";
import { useChannel } from "../context/ChannelContext";
import { sgrPlusCoreService } from "../services/sgrPlusCoreService";
import { lineaService } from "../services/lineaService";

// Gate de la PANTALLA de Solicitudes (si se ve la lista o no): solo mira si
// la cadena tiene alguna línea Activa. SGRPlusCore/ValidarUtilizacion y
// AptaNuevaLinea NO son motivo para ocultar la pantalla entera - son sobre
// si el socio puede INICIAR una operación nueva, no sobre si puede ver sus
// solicitudes existentes. Ver useVerificarHabilitacionNuevaOperacion, más
// abajo, para ese otro gate (el del botón "Nueva Operación").
export const useVerificarHabilitacionSolicitudes = () => {
  const { channelInfo } = useChannel();
  const setSolicitudesEnabled = useAuthStore(
    (state) => state.setSolicitudesEnabled,
  );
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verificarHabilitacion = async () => {
      if (!channelInfo?.id) {
        if (isMounted) setSolicitudesEnabled(true);
        return;
      }

      setIsVerifying(true);
      let enabled = true;

      try {
        const limitesCadena = await lineaService.obtenerLimitesCadenaValor(
          channelInfo.id,
        );
        const limitesArray = Array.isArray(limitesCadena)
          ? limitesCadena
          : limitesCadena
            ? [limitesCadena]
            : [];
        enabled = limitesArray.some(
          (limite) => String(limite.activa) === "1",
        );
      } catch (error) {
        console.error("Error validando TipoLimiteCadenaValor (Activa)", error);
      }

      if (isMounted) {
        setSolicitudesEnabled(enabled);
        setIsVerifying(false);
      }
    };

    verificarHabilitacion();

    return () => {
      isMounted = false;
    };
  }, [channelInfo?.id, setSolicitudesEnabled]);

  return { isVerifying };
};

// Gate del botón "Nueva Operación" en Solicitudes.jsx. Regla de negocio
// pedida explícitamente:
// - Si el socio NUNCA tuvo líneas en el core SGR+ (ValidarUtilizacion
//   responde 404 "no encontrado"), se lo deja pasar directo, sin mirar
//   AptaNuevaLinea.
// - Si el socio SÍ tiene historial en el core y ValidarUtilizacion responde
//   202 ("no posee líneas en curso" = aceptado), recién ahí se exige que la
//   cadena tenga alguna línea Activa + AptaNuevaLinea.
// - Si responde 406 ("posee líneas en curso"), bloquea directo.
export const useVerificarHabilitacionNuevaOperacion = () => {
  const { cuitActivo } = useEmpresaActiva();
  const { channelInfo } = useChannel();
  const [estado, setEstado] = useState({
    verificando: true,
    habilitada: true,
    motivo: "",
  });

  useEffect(() => {
    let isMounted = true;

    const verificar = async () => {
      if (!cuitActivo || !channelInfo?.id) {
        if (isMounted) {
          setEstado({ verificando: false, habilitada: true, motivo: "" });
        }
        return;
      }

      if (isMounted) setEstado((prev) => ({ ...prev, verificando: true }));

      let habilitada = true;
      let motivo = "";
      let status = null;

      try {
        const responseCore =
          await sgrPlusCoreService.validarUtilizacion(cuitActivo);
        status = responseCore?.status;
      } catch (error) {
        console.warn("Error validando utilización en SGRPlus Core:", error);
      }

      if (status === 406) {
        habilitada = false;
        motivo =
          "Ya tenés una línea en curso en el sistema SGR+. No podés iniciar una nueva operación.";
      } else if (status === 202) {
        try {
          const limitesCadena = await lineaService.obtenerLimitesCadenaValor(
            channelInfo.id,
          );
          const limitesArray = Array.isArray(limitesCadena)
            ? limitesCadena
            : limitesCadena
              ? [limitesCadena]
              : [];
          const apta = limitesArray.some(
            (l) =>
              String(l.aptanuevalinea) === "1" && String(l.activa) === "1",
          );
          if (!apta) {
            habilitada = false;
            motivo =
              "No hay líneas disponibles para iniciar una nueva operación en esta cadena.";
          }
        } catch (error) {
          console.error(
            "Error validando TipoLimiteCadenaValor (AptaNuevaLinea)",
            error,
          );
        }
      }
      // status === 404 (nunca tuvo líneas en el core) o cualquier otro
      // caso (error de red, 500, etc.): no bloquea, no exige AptaNuevaLinea.

      if (isMounted) setEstado({ verificando: false, habilitada, motivo });
    };

    verificar();

    return () => {
      isMounted = false;
    };
  }, [cuitActivo, channelInfo?.id]);

  return estado;
};
