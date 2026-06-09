import React, { useEffect } from "react";
import { useParams, Outlet, Navigate } from "react-router-dom";
import { useChannel, CANALES_MOCK } from "../../../context/ChannelContext";
import { useObtenerPorCadenaValorIdWeb } from "../../../hooks/useCadenaValor";

const TenantLayout = () => {
  const { cadenaSlug } = useParams();
  const { setChannelInfo } = useChannel();
  const cadenaValorId = Number(cadenaSlug);

  const { data: cadenaData, isLoading } = useObtenerPorCadenaValorIdWeb(
    cadenaValorId || 0
  );

  useEffect(() => {
    // Si el slug está hardcodeado (ej. "canal1", "bind", "default")
    if (cadenaSlug && CANALES_MOCK[cadenaSlug]) {
      setChannelInfo(CANALES_MOCK[cadenaSlug]);
    }
    // Si la data viene dinámica desde el backend
    else if (cadenaData && !cadenaData.error) {
      setChannelInfo({
        id: cadenaSlug,
        nombre: cadenaData.denominacion || "Cadena de Valor",
        logo: cadenaData.logo || CANALES_MOCK.default.logo,
        colorPrincipal: "var(--color-azul-bind)",
        colorSecundario: "var(--color-amarillo-bind)",
      });
    }
    // Fallback si no está cargando y no se encontró
    else if (!isLoading) {
      setChannelInfo(CANALES_MOCK.default);
    }
  }, [cadenaSlug, cadenaData, isLoading, setChannelInfo]);

  if (!cadenaSlug) {
    return <Navigate to="/default/login" replace />;
  }

  // Evitar renderizar hijos mientras definimos el theme dinámico
  if (isLoading && !CANALES_MOCK[cadenaSlug]) {
    return null;
  }

  return <Outlet />;
};

export default TenantLayout;
