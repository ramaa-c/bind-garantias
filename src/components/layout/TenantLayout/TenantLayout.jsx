import React, { useEffect } from "react";
import { Outlet, Navigate, useNavigate } from "react-router-dom";
import { useChannel } from "../../../context/ChannelContext";
import { useCadenaActiva } from "../../../hooks/useCadenaActiva";
import { useObtenerPorCadenaValorIdWeb, useObtenerPorId } from "../../../hooks/useCadenaValor";
import { useObtenerStatusPlataforma } from "../../../hooks/useStatusPlataforma";
import { esCadenaOperativaParaWeb } from "../../../utils/cadenaValorUtils";
import { obtenerUltimoStatus, esOffline } from "../../../utils/statusPlataforma";
import { LoadingScreen } from "../../ui/LoadingScreen/LoadingScreen";
import ErrorServicio from "../../../pages/shared/ErrorServicio/ErrorServicio";

const TenantLayout = () => {
  // El ID puede venir del path (/:cadenaSlug/...) o del hostname vía
  // /tenants.json — useCadenaActiva resuelve cuál corresponde, así este
  // layout es el mismo para los dos modos de ruteo (ver utils/tenantConfig).
  const { cadenaSlug } = useCadenaActiva();
  const { setChannelInfo } = useChannel();
  const navigate = useNavigate();
  const { data: statusPlataformaData, isLoading: isLoadingStatus } = useObtenerStatusPlataforma();
  const enMantenimiento = esOffline(obtenerUltimoStatus(statusPlataformaData));

  const cadenaValorId = Number(cadenaSlug);
  const isValidId = !Number.isNaN(cadenaValorId) && cadenaValorId > 0;

  const {
    data: cadenaData,
    isLoading,
    isError: isErrorWeb,
    isFetching: isFetchingWeb,
    refetch: refetchWeb,
  } = useObtenerPorCadenaValorIdWeb(isValidId ? cadenaValorId : 0);
  const {
    data: cadenaCoreData,
    isLoading: isLoadingCore,
    isError: isErrorCore,
    isFetching: isFetchingCore,
    refetch: refetchCore,
  } = useObtenerPorId(isValidId ? cadenaValorId : 0);

  // Si alguna de las dos consultas falló (backend caído, error 5xx, red), no
  // se puede saber si la cadena existe: se muestra un error de servicio con
  // reintento en vez de redirigir a not-found.
  const hayErrorServicio = isErrorWeb || isErrorCore;

  useEffect(() => {
    if (isLoading || isLoadingCore || hayErrorServicio) return;

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
  }, [cadenaSlug, cadenaData, cadenaCoreData, isLoading, isLoadingCore, hayErrorServicio, setChannelInfo, navigate, isValidId]);

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

  if (hayErrorServicio) {
    return (
      <ErrorServicio
        onReintentar={() => {
          if (isErrorWeb) refetchWeb();
          if (isErrorCore) refetchCore();
        }}
        reintentando={isFetchingWeb || isFetchingCore}
      />
    );
  }

  return <Outlet />;
};

export default TenantLayout;
