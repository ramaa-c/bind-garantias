import React, { useEffect } from "react";
import { useParams, Outlet, Navigate, useNavigate } from "react-router-dom";
import { useChannel } from "../../../context/ChannelContext";
import { useObtenerPorCadenaValorIdWeb, useObtenerTodasWeb } from "../../../hooks/useCadenaValor";
import { LoadingScreen } from "../../ui/LoadingScreen/LoadingScreen";

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
      navigate("/not-found", { replace: true });
      return;
    }

    const cadenaObj = Array.isArray(cadenaData) ? cadenaData[0] : cadenaData;

    const isActiva = cadenaObj.activa ?? cadenaObj.Activa;
    const resolvedDenominacion = cadenaObj.denominacion || cadenaObj.Denominacion;
    
    if (String(isActiva) === "0") {
      navigate("/cadena-inactiva", { 
        replace: true, 
        state: { denominacion: resolvedDenominacion } 
      });
      return;
    }

    let formatLogo = null;
    const resolvedLogo = cadenaObj.logo ?? cadenaObj.Logo;
    if (resolvedLogo) {
      if (
        resolvedLogo.startsWith("data:") ||
        resolvedLogo.startsWith("http")
      ) {
        formatLogo = resolvedLogo;
      } else {
        formatLogo = `data:image/png;base64,${resolvedLogo}`;
      }
    }

    const resolvedId = cadenaObj.cadenavalorid ?? cadenaObj.CadenaValorID ?? cadenaObj.cadenaValorId;

    setChannelInfo({
      id: String(resolvedId),
      nombre: resolvedDenominacion || "Cadena de Valor",
      logo: formatLogo,
      colorPrincipal: "var(--color-azul-bind)",
      colorSecundario: "var(--color-amarillo-bind)",
    });
  }, [cadenaSlug, cadenaData, isLoading, isLoadingTodas, todasCadenas, setChannelInfo, navigate, isValidId]);

  if (!cadenaSlug) {
    return <Navigate to="/not-found" replace />;
  }

  if (isLoading || isLoadingTodas) {
    return (
      <LoadingScreen
        title="Validando acceso"
        message="Estamos verificando la información de la cadena..."
      />
    );
  }

  return <Outlet />;
};

export default TenantLayout;
