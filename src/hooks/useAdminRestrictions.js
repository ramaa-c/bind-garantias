import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "../store/useAuthStore";
import { useObtenerPorNombreOEmail } from "./useUsuario";
import { usuarioService } from "../services/usuarioService";

const parsearUsuarioWebId = (db) => {
  if (!db) return null;
  if (Array.isArray(db))
    return db[0]?.usuariowebid || db[0]?.UsuarioWebID || db[0]?.id;
  if (db.items)
    return (
      db.items[0]?.usuariowebid ||
      db.items[0]?.UsuarioWebID ||
      db.items[0]?.id
    );
  if (db.data)
    return (
      db.data[0]?.usuariowebid || db.data[0]?.UsuarioWebID || db.data[0]?.id
    );
  return db.usuariowebid || db.UsuarioWebID || db.id || null;
};

export const useAdminRestrictions = () => {
  const user = useAuthStore((state) => state.user);
  const email = user?.email || "";

  const isMockRestricto = email === "admin_restricto" || email === "admin restricto";
  const isMockAdmin = email === "admin";
  const isMock = isMockRestricto || isMockAdmin;

  const emailToFetch = isMock ? "" : email;
  const { data: usuarioDb, isPending: isLoadingUser } = useObtenerPorNombreOEmail(emailToFetch);
  const usuarioWebId = parsearUsuarioWebId(usuarioDb);

  const { data: adminCadenas, isPending: isLoadingCadenas } = useQuery({
    queryKey: ["admin", "cadenas", usuarioWebId || "mock"],
    queryFn: () => {
      if (isMockRestricto) {
        return [{ id: 1, nombre: "Cadena Mock Admin" }];
      }
      return usuarioService.obtenerUsuariosRelacionados({ usuariowebid: usuarioWebId });
    },
    enabled: !!usuarioWebId || isMockRestricto,
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
      isRestricted: isMockRestricto,
      isPending: false,
      cadenas: isMockRestricto ? [{ id: 1, nombre: "Cadena Mock Admin" }] : []
    };
  }

  const isRestricted = listaCadenas.length > 0;
  const isPending = isLoadingUser || (!!usuarioWebId && isLoadingCadenas);

  return {
    isRestricted,
    isPending,
    cadenas: listaCadenas
  };
};
