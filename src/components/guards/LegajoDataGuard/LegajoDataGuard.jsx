import React from "react";
import { useEmpresaActiva } from "../../../hooks/useEmpresaActiva";
import { useValidacionLegajo } from "../../../hooks/useValidacionLegajo";
import {
  useSocioWebPorId,
  useEstadoCdaSocio,
  useTieneCertificadoPyme,
} from "../../../hooks/useSocios";
import { LoadingScreen } from "../../ui/LoadingScreen/LoadingScreen";

export function LegajoDataGuard({ children }) {
  const { socioIdActivo } = useEmpresaActiva();

  const { isLoading: cargandoValidacion, cadenaId } = useValidacionLegajo();
  const { isLoading: cargandoSocioWeb } = useSocioWebPorId(socioIdActivo);
  const { isPending: cargandoEstadoCda } = useEstadoCdaSocio(
    socioIdActivo,
    cadenaId,
  );
  const { isLoading: cargandoCertificado } =
    useTieneCertificadoPyme(socioIdActivo);

  const listo =
    !cargandoValidacion &&
    !cargandoSocioWeb &&
    !cargandoEstadoCda &&
    !cargandoCertificado;

  if (!listo) {
    return (
      <LoadingScreen
        title="Cargando tu legajo"
        message="Estamos verificando el estado de tu empresa..."
      />
    );
  }

  return <>{children}</>;
}

export default LegajoDataGuard;
