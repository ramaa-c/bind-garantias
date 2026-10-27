import { useMemo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { useObtenerPorNombreOEmail } from "./useUsuario";
import { useObtenerSocioUsuarioPorUsuarioId, useEmpresasCompletas } from "./useSocios";
import { extraerRegistroUsuario } from "../utils/usuarioUtils";

const parsearLista = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (data.items) return data.items;
  if (data.data) return data.data;
  if (typeof data === "object" && Object.keys(data).length > 0) return [data];
  return [];
};

export const useEmpresasDelUsuario = (skip = false) => {
  const email = useAuthStore((state) => state.user?.email);
  const { data: usuarioDb, isPending: cargandoUsuario } = useObtenerPorNombreOEmail(skip ? "" : email);
  const registro = extraerRegistroUsuario(usuarioDb);
  const usuarioWebId = registro?.usuariowebid || registro?.UsuarioWebID || registro?.id || null;

  const { data: socioUsuarios, isPending: cargandoVinculos } = useObtenerSocioUsuarioPorUsuarioId(
    skip ? 0 : usuarioWebId || 0,
  );
  const { empresasCompletas, isLoading: cargandoEmpresas } = useEmpresasCompletas(
    skip ? [] : parsearLista(socioUsuarios),
  );

  const empresas = useMemo(
    () =>
      empresasCompletas.map((socio) => ({
        socioId: socio.socioid ?? socio.SocioID,
        nombre: socio.denominacion || socio.Denominacion || "",
        cuit: String(socio.cuit || socio.Cuit || ""),
        socio,
      })),
    [empresasCompletas],
  );

  return {
    empresas,
    cargando: !skip && ((cargandoUsuario && !usuarioWebId) || (!!usuarioWebId && (cargandoVinculos || cargandoEmpresas))),
  };
};
