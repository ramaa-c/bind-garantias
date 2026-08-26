import React from "react";
import { useEmpresaActiva } from "../../../hooks/useEmpresaActiva";
import { useValidacionLegajo } from "../../../hooks/useValidacionLegajo";
import {
  useSocioWebPorId,
  useEstaMigradoEnSgrPlus,
  useEstadoCdaSocio,
  useTieneCertificadoPyme,
} from "../../../hooks/useSocios";
import { LoadingScreen } from "../../ui/LoadingScreen/LoadingScreen";

// LegajoUniversalBar (ver ese archivo) solo termina de armar su vista real
// una vez que TODOS estos datos llegaron; hasta entonces se esconde a sí
// misma. Sin este guard, SociosView/DocumentacionView/Solicitudes se
// pintaban enteras de una (header, formulario, todo interactivo) y la barra
// aparecía de golpe un instante después — un cambio de layout visible, y una
// ventana en la que el cliente podía interactuar con una pantalla sin el
// aviso de "no pasaste las validaciones" o el bloqueo de migración todavía
// resuelto. Este guard bloquea la pantalla ENTERA (mismo patrón que ya usa
// OnboardingGuard/TenantLayout) hasta que la barra tenga todo lo que
// necesita, para que aparezca ya resuelta en el primer pintado.
//
// Llama a los MISMOS hooks (mismas queryKeys de react-query) que después
// vuelve a llamar LegajoUniversalBar: comparten caché, así que esto no
// duplica ningún pedido de red — solo espera a que la primera carga real
// termine antes de dejar pasar a los hijos.
export function LegajoDataGuard({ children }) {
  const { socioIdActivo } = useEmpresaActiva();

  const { isLoading: cargandoValidacion, cadenaId } = useValidacionLegajo();
  const { data: socioWeb, isLoading: cargandoSocioWeb } = useSocioWebPorId(socioIdActivo);
  const { isLoading: cargandoMigrado } = useEstaMigradoEnSgrPlus(socioWeb?.cuit);
  const { isPending: cargandoEstadoCda } = useEstadoCdaSocio(socioIdActivo, cadenaId);
  const { isLoading: cargandoCertificado } = useTieneCertificadoPyme(socioIdActivo);

  const listo =
    !cargandoValidacion &&
    !cargandoSocioWeb &&
    !cargandoMigrado &&
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
