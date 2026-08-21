import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore";
import { useObtenerPorNombreOEmail } from "./useUsuario";
import { usuarioService } from "../services/usuarioService";

const parsearRegistroUsuario = (db) => {
  if (!db) return null;
  if (Array.isArray(db)) return db[0] || null;
  if (db.items) return db.items[0] || null;
  if (db.data) return db.data[0] || null;
  return db;
};

const esAdministradorActivo = (registro) => {
  const valor = registro?.esadministrador ?? registro?.EsAdministrador;
  return valor === "1" || valor === 1 || valor === true;
};

export const useAdminRestrictions = () => {
  const user = useAuthStore((state) => state.user);
  const email = user?.email || "";

  const isMockAdmin = email === "admin";
  const isMock = isMockAdmin;

  const emailToFetch = isMock ? "" : email;
  const { data: usuarioDb, isPending: isLoadingUser } = useObtenerPorNombreOEmail(emailToFetch);
  const registroUsuario = parsearRegistroUsuario(usuarioDb);
  const usuarioWebId =
    registroUsuario?.usuariowebid ??
    registroUsuario?.UsuarioWebID ??
    registroUsuario?.id ??
    null;
  const esAdministrador = esAdministradorActivo(registroUsuario);

  // ⚠️ El parámetro que el backend realmente filtra es "usuarioid" (o
  // cualquier variante de casing de ESE nombre) — "usuariowebid" (con "web",
  // aunque el campo de la respuesta se llame UsuarioWebID) lo ignora en
  // silencio y devuelve TODAS las filas de la tabla sin filtrar. Confirmado
  // en vivo contra el backend 103 el 2026-08-21: con "usuariowebid" un
  // usuario con una sola cadena vinculada terminaba viendo también cadenas
  // de otros usuarios (restrictedIds se armaba con toda la tabla). Mismo
  // parámetro que ya usa correctamente useObtenerCadenasPorUsuario
  // (useUsuario.js), que nunca tuvo este bug.
  const { data: adminCadenas, isPending: isLoadingCadenas } = useQuery({
    queryKey: ["admin", "cadenas", usuarioWebId || "mock"],
    queryFn: () => {
      return usuarioService.obtenerUsuariosRelacionados({ usuarioid: usuarioWebId });
    },
    enabled: !!usuarioWebId,
  });

  const parsearCadenas = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.items) return data.items;
    if (data.data) return data.data;
    if (typeof data === "object" && Object.keys(data).length > 0)
      return [data];
    return [];
  };

  const listaCadenas = parsearCadenas(adminCadenas);
  
  if (isMock) {
    return {
      isRestricted: false,
      isPending: false,
      cadenas: []
    };
  }

  // Un administrador general (EsAdministrador=1) ve todo el panel aunque
  // además tenga cadenas de valor vinculadas; la restricción de navegación
  // es exclusiva de los usuarios atados solo a cadena(s) de valor.
  const isRestricted = !esAdministrador && listaCadenas.length > 0;
  const isPending = isLoadingUser || (!!usuarioWebId && isLoadingCadenas);

  return {
    isRestricted,
    isPending,
    cadenas: listaCadenas
  };
};
