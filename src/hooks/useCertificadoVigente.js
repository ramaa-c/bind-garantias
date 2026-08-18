import { useQuery } from "@tanstack/react-query";
import { sociosService } from "../services/sociosService";

// GET Socio/CertificadoVigente/{Cuit} - 200 = vigente, cualquier otra cosa
// (401 rechazo, 500 infra, red caída) se trata como "no vigente" a
// propósito: mientras no se pueda CONFIRMAR que está vigente, Legajo y
// Documentación quedan de solo lectura (ver SociosView.jsx/
// DocumentacionView.jsx) - se prefiere fallar cerrado antes que dejar
// editar con un estado que no se pudo verificar.
export const useCertificadoVigente = (cuit) => {
  const cuitLimpio = String(cuit || "").replace(/\D/g, "");

  const { data, isLoading } = useQuery({
    queryKey: ["socios", "certificadoVigente", cuitLimpio],
    queryFn: () => sociosService.obtenerCertificadoVigente(cuitLimpio),
    enabled: cuitLimpio.length === 11,
    staleTime: 1000 * 60 * 5,
  });

  const vigente = data?.status === 200;

  return {
    vigente,
    soloLectura: cuitLimpio.length === 11 && (isLoading || !vigente),
    verificando: isLoading,
  };
};
