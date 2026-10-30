import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cdaService } from "../services/cdaService";
import { useObtenerLimitesPorSocio } from "./useLinea";
import { useObtenerExecuteCda } from "./useSocios";
import { ORIGEN_CADENA_MANUAL, resolverCadenasDelSocio } from "../utils/cadenaDelSocio";

const PANTALLA_ALTA = "PANTALLA_INGRESO_CUIT";

export const useCadenaDelSocio = (socioId) => {
  const { data: lineas, isPending: cargandoLineas } = useObtenerLimitesPorSocio(socioId);
  const { data: historialCda, isPending: cargandoHistorial } = useObtenerExecuteCda(socioId);
  const { data: pantallas } = useQuery({
    queryKey: ["cda", "pantallaGrupoCda", PANTALLA_ALTA],
    queryFn: () => cdaService.obtenerPantallaGrupoCda(PANTALLA_ALTA),
    staleTime: Infinity,
  });

  const pantallaGrupoCdaIdIngreso =
    (Array.isArray(pantallas) ? pantallas[0] : pantallas)?.pantallagrupocdaid ?? null;

  const candidatas = useMemo(
    () => resolverCadenasDelSocio({ lineas, historialCda, pantallaGrupoCdaIdIngreso }),
    [lineas, historialCda, pantallaGrupoCdaIdIngreso],
  );

  const [eleccion, setEleccion] = useState(null);
  const elegidaManual = eleccion && eleccion.socioId === socioId ? eleccion.cadenaValorId : null;

  return {
    cadenaValorId: elegidaManual ?? candidatas[0]?.cadenaValorId ?? null,
    origen: elegidaManual ? ORIGEN_CADENA_MANUAL : candidatas[0]?.origen ?? null,
    candidatas,
    cargando: !!socioId && (cargandoLineas || cargandoHistorial),
    elegirCadena: (cadenaValorId) => setEleccion({ socioId, cadenaValorId: Number(cadenaValorId) || null }),
  };
};
