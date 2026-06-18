import { useState, useEffect } from "react";
import { requisitosService } from "../services/requisitosService";

/**
 * Hook para interactuar con la parametrización de requisitos por cadena de valor.
 * @param {number|string} cadenaId ID de la cadena de valor
 */
export const useRequisitos = (cadenaId) => {
  const [requisitos, setRequisitos] = useState(() => 
    requisitosService.obtenerRequisitosPorCadenaId(Number(cadenaId))
  );

  useEffect(() => {
    if (cadenaId) {
      setRequisitos(requisitosService.obtenerRequisitosPorCadenaId(Number(cadenaId)));
    }
  }, [cadenaId]);

  const updateRequisitos = (nuevaConfig) => {
    const res = requisitosService.guardarRequisitos(Number(cadenaId), nuevaConfig);
    if (res) {
      setRequisitos(res);
    }
    return res;
  };

  return {
    requisitos,
    updateRequisitos,
  };
};
