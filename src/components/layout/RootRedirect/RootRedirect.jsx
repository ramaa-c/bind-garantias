import React, { useEffect } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useObtenerTodasWeb } from "../../../hooks/useCadenaValor";

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

  if (isLoading) return null;

  return null;
};

export default RootRedirect;
