import { useMemo } from "react";
import { useQueries } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore";
import { useObtenerPorNombreOEmail } from "./useUsuario";
import { useObtenerSocioUsuarioPorUsuarioId } from "./useSocios";
import { sociosService } from "../services/sociosService";
import { lineaService } from "../services/lineaService";
import { extraerRegistroUsuario } from "../utils/usuarioUtils";

const parsearLista = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.items) return data.items;
  if (data.data) return data.data;
  if (typeof data === "object" && Object.keys(data).length > 0) return [data];
  return [];
};

// Empresas vinculadas al vendor (SocioUsuario del usuario logueado). Cada
// vínculo puede venir con el socio anidado o solo con el SocioID: en ese caso
// se completa con sociosWeb/detalle (misma queryKey que useSocioWebPorId, así
// comparte caché con el resto de la app).
export const useEmpresasVendor = (skip = false) => {
  const user = useAuthStore((state) => state.user);
  const { data: usuarioDb, isPending: cargandoUsuario } = useObtenerPorNombreOEmail(
    skip ? "" : user?.email,
  );
  const registro = extraerRegistroUsuario(usuarioDb);
  const usuarioWebId = registro?.usuariowebid || registro?.UsuarioWebID || registro?.id || null;

  const { data: socioUsuarios, isPending: cargandoVinculos } = useObtenerSocioUsuarioPorUsuarioId(
    skip ? 0 : usuarioWebId || 0,
  );

  const vinculos = useMemo(
    () =>
      parsearLista(socioUsuarios)
        .map((v) => ({
          socioId: v.socioid || v.SocioID,
          socioAnidado: v.socio || v.Socio || null,
        }))
        .filter((v) => !!v.socioId),
    [socioUsuarios],
  );

  const detalles = useQueries({
    queries: vinculos.map((v) => ({
      queryKey: ["sociosWeb", "detalle", v.socioId],
      queryFn: () => sociosService.obtenerSocioWebPorId(v.socioId),
      enabled: !v.socioAnidado,
      staleTime: 1000 * 60 * 5,
    })),
  });

  const empresas = useMemo(
    () =>
      vinculos.map((v, i) => {
        const socio = v.socioAnidado || detalles[i]?.data || null;
        return {
          socioId: v.socioId,
          nombre: socio?.denominacion || socio?.Denominacion || "",
          cuit: String(socio?.cuit || socio?.Cuit || ""),
          socio,
        };
      }),
    [vinculos, detalles],
  );

  const cargandoDetalles = detalles.some((d) => d.isPending && d.fetchStatus !== "idle");

  return {
    empresas,
    cargando:
      !skip &&
      ((cargandoUsuario && !usuarioWebId) || (!!usuarioWebId && cargandoVinculos) || cargandoDetalles),
  };
};

// Solicitudes (TipoLimiteSocio) de todas las empresas del vendor. No hay un
// endpoint que las traiga juntas: se pide una lista por empresa, con la misma
// queryKey que useObtenerLimitesSocio para compartir caché e invalidaciones
// (ver useActualizarLimiteSocio).
export const useSolicitudesVendor = (empresas) => {
  const resultados = useQueries({
    queries: empresas.map((e) => ({
      queryKey: ["limites", "socio", e.socioId],
      queryFn: () => lineaService.obtenerLimitesPorSocio(e.socioId),
      enabled: !!e.socioId,
      staleTime: 1000 * 60 * 5,
    })),
  });

  const porEmpresa = useMemo(
    () =>
      empresas.map((empresa, i) => ({
        empresa,
        solicitudes: parsearLista(resultados[i]?.data),
        error: !!resultados[i]?.isError,
      })),
    [empresas, resultados],
  );

  return {
    porEmpresa,
    cargando: resultados.some((r) => r.isPending),
    hayErrores: resultados.some((r) => r.isError),
  };
};
