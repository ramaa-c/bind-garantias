import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useObtenerTodasWeb } from "../../../hooks/useCadenaValor";
import { LoadingScreen } from "../../ui/LoadingScreen/LoadingScreen";

const RootRedirect = () => {
  const { data: cadenasData, isLoading } = useObtenerTodasWeb();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (cadenasData && cadenasData.length > 0) {
        const firstCadenaId = cadenasData[0].cadenavalorid;
        navigate(`/${firstCadenaId}/login`, { replace: true });
      } else {
        navigate("/not-found", { replace: true });
      }
    }
  }, [isLoading, cadenasData, navigate]);

  if (isLoading) {
    return <LoadingScreen title="Cargando..." message="Por favor, espera un momento..." />;
  }

  return null;
};

export default RootRedirect;
