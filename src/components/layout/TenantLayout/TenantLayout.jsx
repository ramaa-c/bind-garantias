import React, { useEffect } from "react";
import { useParams, Outlet, Navigate, useNavigate } from "react-router-dom";
import { useChannel } from "../../../context/ChannelContext";
import { useObtenerPorCadenaValorIdWeb, useObtenerPorId } from "../../../hooks/useCadenaValor";
import { useObtenerStatusPlataforma } from "../../../hooks/useStatusPlataforma";
import { esCadenaOperativaParaWeb } from "../../../utils/cadenaValorUtils";
import { obtenerUltimoStatus, esOffline } from "../../../utils/statusPlataforma";
import { LoadingScreen } from "../../ui/LoadingScreen/LoadingScreen";

const TenantLayout = () => {
  const { cadenaSlug } = useParams();
  const { setChannelInfo } = useChannel();
  const navigate = useNavigate();
  const { data: statusPlataformaData, isLoading: isLoadingStatus } = useObtenerStatusPlataforma();
  const enMantenimiento = esOffline(obtenerUltimoStatus(statusPlataformaData));

  const cadenaValorId = Number(cadenaSlug);
  const isValidId = !Number.isNaN(cadenaValorId) && cadenaValorId > 0;

  const { data: cadenaData, isLoading } = useObtenerPorCadenaValorIdWeb(
    isValidId ? cadenaValorId : 0,
  );
  const { data: cadenaCoreData, isLoading: isLoadingCore } = useObtenerPorId(
    isValidId ? cadenaValorId : 0,
  );

  useEffect(() => {
    if (isLoading || isLoadingCore) return;

    if (!isValidId || !cadenaData || cadenaData.error || (Array.isArray(cadenaData) && cadenaData.length === 0)) {
      navigate("/not-found", { replace: true });
      return;
    }

    const cadenaObj = Array.isArray(cadenaData) ? cadenaData[0] : cadenaData;
    const cadenaCoreObj = Array.isArray(cadenaCoreData) ? cadenaCoreData[0] : cadenaCoreData;

    const resolvedDenominacion = cadenaObj.denominacion || cadenaObj.Denominacion;

    // Igual que en el panel admin: la cadena debe estar Aprobada y vigente en
    // CORE, y además no haber sido desactivada manualmente con el switch
    // "Activa" de la tabla web.
    if (!esCadenaOperativaParaWeb(cadenaObj, cadenaCoreObj)) {
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
  }, [cadenaSlug, cadenaData, cadenaCoreData, isLoading, isLoadingCore, setChannelInfo, navigate, isValidId]);

  if (isLoadingStatus) {
    return (
      <LoadingScreen
        title="Validando acceso"
        message="Verificando el estado de la plataforma..."
      />
    );
  }

  if (enMantenimiento) {
    return <Navigate to="/fuera-de-servicio" replace />;
  }

  if (!cadenaSlug) {
    return <Navigate to="/not-found" replace />;
  }

  if (isLoading || isLoadingCore) {
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
