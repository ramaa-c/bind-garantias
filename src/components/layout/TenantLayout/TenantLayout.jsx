import React, { useEffect } from "react";
import { useParams, Outlet, Navigate } from "react-router-dom";
import { useChannel, CANALES_MOCK } from "../../../context/ChannelContext";
import { useObtenerPorCadenaValorIdWeb } from "../../../hooks/useCadenaValor";

const TenantLayout = () => {
  const { cadenaSlug } = useParams();
  const { setChannelInfo } = useChannel();
  const cadenaValorId = Number(cadenaSlug);

  const { data: cadenaData, isLoading } = useObtenerPorCadenaValorIdWeb(
    cadenaValorId || 0,
  );

  useEffect(() => {
    // Si el slug está hardcodeado (ej. "canal1", "bind", "default")
    if (cadenaSlug && CANALES_MOCK[cadenaSlug]) {
      setChannelInfo(CANALES_MOCK[cadenaSlug]);
    }
    // Si la data viene dinámica desde el backend
    else if (cadenaData && !cadenaData.error) {
      const cadenaObj = Array.isArray(cadenaData) ? cadenaData[0] : cadenaData;

      if (!cadenaObj) {
        setChannelInfo(CANALES_MOCK.default);
        return;
      }

      let formatLogo = CANALES_MOCK.default.logo;
      if (cadenaObj.logo) {
        if (
          cadenaObj.logo.startsWith("data:") ||
          cadenaObj.logo.startsWith("http")
        ) {
          formatLogo = cadenaObj.logo;
        } else {
          formatLogo = `data:image/png;base64,${cadenaObj.logo}`;
        }
      }

      setChannelInfo({
        id: cadenaSlug,
        nombre: cadenaObj.denominacion || "Cadena de Valor",
        logo: formatLogo,
        colorPrincipal: "var(--color-azul-bind)",
        colorSecundario: "var(--color-amarillo-bind)",
      });
    } else if (!isLoading) {
      setChannelInfo(CANALES_MOCK.default);
    }
  }, [cadenaSlug, cadenaData, isLoading, setChannelInfo]);

  if (!cadenaSlug) {
    return <Navigate to="/default/login" replace />;
  }

  if (isLoading && !CANALES_MOCK[cadenaSlug]) {
    return null;
  }

  return <Outlet />;
};

export default TenantLayout;
