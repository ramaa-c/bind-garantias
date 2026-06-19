import { useEffect, useState } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useEmpresaActiva } from "./useEmpresaActiva";
import { useChannel } from "../context/ChannelContext";
import { sgrPlusCoreService } from "../services/sgrPlusCoreService";
import { lineaService } from "../services/lineaService";

export const useVerificarHabilitacionSolicitudes = () => {
  const { cuitActivo } = useEmpresaActiva();
  const { channelInfo } = useChannel();
  const setSolicitudesEnabled = useAuthStore((state) => state.setSolicitudesEnabled);
  const [isVerifying, setIsVerifying] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const verificarHabilitacion = async () => {
      if (!cuitActivo || !channelInfo?.id) {
        if (isMounted) setSolicitudesEnabled(true);
        return;
      }

      setIsVerifying(true);
      let enabled = true;

      try {
        // 1. Validar Utilizacion Core
        const responseCore = await sgrPlusCoreService.validarUtilizacion(cuitActivo);
        if (responseCore?.success === false || responseCore?.status === 406) {
          enabled = false;
        }
      } catch (error) {
        if (error?.response?.status === 406) {
          enabled = false;
        }
      }

      // Si ya está deshabilitado, no hace falta validar la cadena
      if (enabled) {
        try {
          // 2. Validar TipoLimiteCadenaValor
          const limitesCadena = await lineaService.obtenerLimitesCadenaValor(channelInfo.id);
          
          let apta = false;
          if (limitesCadena) {
            const limitesArray = Array.isArray(limitesCadena) ? limitesCadena : [limitesCadena];
            apta = limitesArray.some(
              (limite) => String(limite.aptanuevalinea) === "1" && String(limite.activa) === "1"
            );
          }
          
          if (!apta) {
            enabled = false;
          }
        } catch (error) {
          console.error("Error validando TipoLimiteCadenaValor", error);
        }
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
  }, [cuitActivo, channelInfo?.id, setSolicitudesEnabled]);

  return { isVerifying };
};
