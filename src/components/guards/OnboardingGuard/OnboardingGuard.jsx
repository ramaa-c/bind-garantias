import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import { useObtenerSocioUsuarioPorUsuarioId } from "../../../hooks/useSocios";
import { useObtenerPorNombreOEmail } from "../../../hooks/useUsuario";
import { LoadingScreen } from "../../ui";
import { useChannel } from "../../../context/ChannelContext";
import { useVendor } from "../../../hooks/useVendor";

export const OnboardingGuard = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const { channelInfo } = useChannel();

  const { activeSocioId } = useAuthStore((state) => state);
  const { data: vendorData, isPending: isLoadingVendor } = useVendor();

  const isTerminosPage = location.pathname.endsWith("/terminos");
  const isAltaDatosPage = location.pathname.endsWith("/alta-datos-empresa");
  const isSeleccionarEmpresaPage = location.pathname.endsWith("/seleccionar-empresa");

  const email = user?.email || "";

  const { data: usuarioDb, isPending: isLoadingUser } =
    useObtenerPorNombreOEmail(email);

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

  const usuarioWebId = parsearUsuarioWebId(usuarioDb);

  const { data: socioUsuarios, isPending: isPendingSocios } =
    useObtenerSocioUsuarioPorUsuarioId(usuarioWebId || 0);

  const parsearEmpresas = (sociosData) => {
    if (!sociosData) return [];
    if (Array.isArray(sociosData)) return sociosData;
    if (sociosData.items) return sociosData.items;
    if (sociosData.data) return sociosData.data;
    if (typeof sociosData === "object" && Object.keys(sociosData).length > 0)
      return [sociosData];
    return [];
  };

  const listaEmpresasBase = parsearEmpresas(socioUsuarios);
  const isVendorMock = user?.email?.toLowerCase() === "vendorbind@yopmail.com";
  const listaEmpresas = isVendorMock ? [1, 2, 3] : listaEmpresasBase;
  const tieneEmpresas = listaEmpresas.length > 0;

  if (!user || !user.email) {
    return <Navigate to={`/${channelInfo.id}/login`} replace />;
  }

  if (
    (isLoadingUser && !usuarioWebId) ||
    (usuarioWebId && isPendingSocios) ||
    isLoadingVendor
  ) {
    return (
      <LoadingScreen
        title="Cargando tu perfil"
        message="Estamos obteniendo tu información y empresas vinculadas..."
      />
    );
  }

  const isVendor = vendorData?.isVendor || false;

  if (usuarioWebId && tieneEmpresas) {
    if (isVendor) {
      if (!activeSocioId && !isSeleccionarEmpresaPage && !isAltaDatosPage) {
        return <Navigate to={`/${channelInfo.id}/seleccionar-empresa`} replace />;
      }
      // If they have an active socio ID, prevent them from staying on /seleccionar-empresa or /alta-datos-empresa forever,
      // but they can navigate freely. Usually they are on /inicio or others.
      if (activeSocioId && (isTerminosPage || isSeleccionarEmpresaPage || isAltaDatosPage)) {
         // allow navigation or redirect to inicio? Let's just allow them to use alta-datos-empresa or seleccionar-empresa.
         if (isTerminosPage) return <Navigate to={`/${channelInfo.id}/inicio`} replace />;
      }
    } else {
      if (isTerminosPage || isAltaDatosPage || isSeleccionarEmpresaPage) {
        return <Navigate to={`/${channelInfo.id}/inicio`} replace />;
      }
    }
  } else if (usuarioWebId && !tieneEmpresas) {
    if (!isTerminosPage && !isAltaDatosPage) {
      return <Navigate to={`/${channelInfo.id}/terminos`} replace />;
    }
  }

  return <>{children}</>;
};

export default OnboardingGuard;
