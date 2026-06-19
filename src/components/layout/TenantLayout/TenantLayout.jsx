import React, { useEffect } from "react";
import { useParams, Outlet, Navigate, useNavigate } from "react-router-dom";
import { useChannel } from "../../../context/ChannelContext";
import { useObtenerPorCadenaValorIdWeb, useObtenerTodasWeb } from "../../../hooks/useCadenaValor";

const TenantLayout = () => {
  const { cadenaSlug } = useParams();
  const { setChannelInfo } = useChannel();
  const navigate = useNavigate();

  const cadenaValorId = Number(cadenaSlug);
  const isValidId = !Number.isNaN(cadenaValorId) && cadenaValorId > 0;

  const { data: cadenaData, isLoading } = useObtenerPorCadenaValorIdWeb(
    isValidId ? cadenaValorId : 0,
  );
  const { data: todasCadenas, isLoading: isLoadingTodas } = useObtenerTodasWeb();

  useEffect(() => {
    if (isLoading || isLoadingTodas) return;

    if (!isValidId || !cadenaData || cadenaData.error || (Array.isArray(cadenaData) && cadenaData.length === 0)) {
      if (import.meta.env.DEV && todasCadenas && todasCadenas.length > 0) {
        const firstId = todasCadenas[0].cadenavalorid;
        navigate(`/${firstId}/login`, { replace: true });
      } else {
        navigate("/not-found", { replace: true });
      }
      return;
    }

    const cadenaObj = Array.isArray(cadenaData) ? cadenaData[0] : cadenaData;

    let formatLogo = null;
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
      id: String(cadenaObj.cadenavalorid),
      nombre: cadenaObj.denominacion || "Cadena de Valor",
      logo: formatLogo,
      colorPrincipal: "var(--color-azul-bind)",
      colorSecundario: "var(--color-amarillo-bind)",
    });
  }, [cadenaSlug, cadenaData, isLoading, isLoadingTodas, todasCadenas, setChannelInfo, navigate, isValidId]);

  if (!cadenaSlug) {
    return <Navigate to="/not-found" replace />;
  }

  if (isLoading || isLoadingTodas) {
    return null;
  }

  return <Outlet />;
};

export default TenantLayout;
