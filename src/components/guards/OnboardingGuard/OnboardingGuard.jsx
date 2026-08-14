import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuthStore } from "../../../store/useAuthStore";
import {
  useObtenerSocioUsuarioPorUsuarioId,
  useEmpresasCompletas,
} from "../../../hooks/useSocios";
import {
  useObtenerPorNombreOEmail,
  useObtenerCadenasPorUsuario,
} from "../../../hooks/useUsuario";
import {
  useObtenerTerminosVigentes,
  useObtenerConfirmacionTyC,
} from "../../../hooks/useTerminos";
import { LoadingScreen } from "../../ui/LoadingScreen/LoadingScreen";
import { useChannel } from "../../../context/ChannelContext";
import { useVendor } from "../../../hooks/useVendor";
import { useVerificarHabilitacionSolicitudes } from "../../../hooks/useVerificarHabilitacionSolicitudes";

export const OnboardingGuard = ({ children }) => {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();
  const { channelInfo } = useChannel();

  const { activeSocioId } = useAuthStore((state) => state);
  const { data: vendorData, isPending: isLoadingVendor } = useVendor();

  const isTerminosPage = location.pathname.endsWith("/terminos");
  const isAltaDatosPage = location.pathname.endsWith("/alta-datos-empresa");
  const isSeleccionarEmpresaPage = location.pathname.endsWith(
    "/seleccionar-empresa",
  );
  const isSolicitudesPage = location.pathname.endsWith("/solicitudes");
  const isInicioPage = location.pathname.endsWith("/inicio");
  const isEstadoSolicitudPage = location.pathname.endsWith(
    "/estado-solicitud",
  );

  const isSolicitudesEnabled = useAuthStore(
    (state) => state.isSolicitudesEnabled,
  );
  const { isVerifying } = useVerificarHabilitacionSolicitudes();

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

  const { data: cadenasData, isPending: isCadenasLoading } =
    useObtenerCadenasPorUsuario(usuarioWebId);
  const hasCadenas = Array.isArray(cadenasData)
    ? cadenasData.length > 0
    : cadenasData?.items?.length > 0 || cadenasData?.data?.length > 0;
  const isAdminCadena = hasCadenas;

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
  const isVendor = vendorData?.isVendor || false;

  // Un socioUsuario vinculado puede apuntar a un socio "stub" (creado por
  // cda/execute, o por un onboarding abandonado en el Paso 2 sin completar
  // datos) — eso no cuenta como empresa registrada. Filtramos esos casos acá
  // para no mandar al usuario a /legajo con una empresa vacía, dejándolo sin
  // forma de volver a completar el alta.
  const { empresasCompletas, isLoading: isLoadingEmpresasCompletas } =
    useEmpresasCompletas(isVendorMock ? [] : listaEmpresasBase);
  const listaEmpresas = isVendorMock ? [1, 2, 3] : empresasCompletas;
  const tieneEmpresas = listaEmpresas.length > 0;

  // El socio ya puede tener datos reales (esSocioVacio ya no alcanza) sin
  // que el CDA de PANTALLA_INGRESO_CUIT haya pasado — eso pasa siempre que
  // el usuario cruzó el umbral (ver Paso1Cuit) pero el CDA quedó rechazado
  // o pendiente. Ya NO se usa para bloquear el acceso acá (acordado con el
  // equipo el 2026-08-13): el socio puede entrar más allá del resultado del
  // CDA — el aviso y el bloqueo real (migración a SGR+) viven en
  // LegajoUniversalBar, que sí sigue consultando ese estado.
  const empresaActual = !isVendor && !isVendorMock ? listaEmpresas[0] : null;
  const telefonoActual = String(
    empresaActual?.telefono ?? empresaActual?.Telefono ?? "",
  ).trim();

  const clearAuth = useAuthStore((state) => state.clearAuth);
  const setActiveSocioId = useAuthStore((state) => state.setActiveSocioId);

  // Términos y Condiciones: se chequea una sola vez por sesión de login
  // (terminosVerificado vive en el store de auth, no acá) para no
  // interrumpir a un usuario ya operando si el admin publica una versión
  // nueva mientras tanto — recién se le vuelve a pedir en su próximo login.
  const terminosVerificado = useAuthStore((state) => state.terminosVerificado);
  const setTerminosVerificado = useAuthStore(
    (state) => state.setTerminosVerificado,
  );

  const necesitaChequeoTerminos = !!usuarioWebId && !isVendor && !terminosVerificado;

  const { data: terminosVigentes, isLoading: isLoadingTerminosVigentes } =
    useObtenerTerminosVigentes({ enabled: necesitaChequeoTerminos });
  const { data: ultimaConfirmacionTyC, isLoading: isLoadingConfirmacionTyC } =
    useObtenerConfirmacionTyC(usuarioWebId, { enabled: necesitaChequeoTerminos });

  const terminosVigenteId = terminosVigentes?.terminosycondicionesid;
  // Si todavía no hay ningún término configurado en el backend, no bloqueamos a nadie.
  const yaAceptoTerminosVigentes =
    !terminosVigenteId ||
    ultimaConfirmacionTyC?.terminosycondicionesid === terminosVigenteId;
  const debeAceptarTerminos = necesitaChequeoTerminos && !yaAceptoTerminosVigentes;

  React.useEffect(() => {
    if (
      necesitaChequeoTerminos &&
      !isLoadingTerminosVigentes &&
      !isLoadingConfirmacionTyC &&
      yaAceptoTerminosVigentes
    ) {
      setTerminosVerificado(true);
    }
  }, [
    necesitaChequeoTerminos,
    isLoadingTerminosVigentes,
    isLoadingConfirmacionTyC,
    yaAceptoTerminosVigentes,
    setTerminosVerificado,
  ]);

  React.useEffect(() => {
    if (tieneEmpresas && !activeSocioId && !isVendor) {
      const firstSocioId =
        listaEmpresas[0]?.socioid || listaEmpresas[0]?.SocioID;
      if (firstSocioId) {
        setActiveSocioId(firstSocioId);
      }
    }
  }, [tieneEmpresas, activeSocioId, isVendor, listaEmpresas, setActiveSocioId]);

  React.useEffect(() => {
    if (isVendor && !isLoadingVendor && user && !isVendorMock) {
      const isAllowed = vendorData?.cadenas?.some(
        (c) => c.cadenavalorid.toString() === channelInfo.id.toString(),
      );

      if (!isAllowed && channelInfo.id !== "default") {
        import("sonner").then(({ toast }) => {
          toast.error(
            "No tienes autorización para operar en esta cadena de valor.",
          );
        });
        clearAuth();
      } else if (
        !isAllowed &&
        channelInfo.id === "default" &&
        vendorData?.cadenas?.length > 0
      ) {
        import("sonner").then(({ toast }) => {
          toast.error(
            "Debes ingresar a través del portal específico de tu cadena de valor.",
          );
        });
        clearAuth();
      }
    }
  }, [
    isVendor,
    isLoadingVendor,
    vendorData,
    channelInfo.id,
    user,
    isVendorMock,
    clearAuth,
  ]);

  if (!user || !user.email) {
    return <Navigate to={`/${channelInfo.id}/login`} replace />;
  }

  const isBasicAdmin =
    user?.role === "admin" ||
    user?.email === "admin" ||
    user?.email === "admin_restricto" ||
    user?.email === "admin restricto";

  if (isBasicAdmin) {
    return <Navigate to="/admin" replace />;
  }

  if ((isLoadingUser && !usuarioWebId) || (usuarioWebId && isCadenasLoading)) {
    return (
      <LoadingScreen
        title="Cargando tu perfil"
        message="Estamos obteniendo tu información..."
      />
    );
  }

  if (isAdminCadena) {
    return <Navigate to="/admin" replace />;
  }

  if (
    (usuarioWebId && isPendingSocios) ||
    (usuarioWebId && !isPendingSocios && isLoadingEmpresasCompletas) ||
    (usuarioWebId && isCadenasLoading) ||
    (necesitaChequeoTerminos &&
      (isLoadingTerminosVigentes || isLoadingConfirmacionTyC)) ||
    isLoadingVendor ||
    isVerifying
  ) {
    return (
      <LoadingScreen
        title="Cargando tu perfil"
        message="Estamos obteniendo tu información y empresas vinculadas..."
      />
    );
  }

  if (debeAceptarTerminos && !isTerminosPage) {
    return <Navigate to={`/${channelInfo.id}/terminos`} replace />;
  }

  if (usuarioWebId && tieneEmpresas) {
    if (isVendor) {
      if (!activeSocioId && !isSeleccionarEmpresaPage && !isAltaDatosPage) {
        return (
          <Navigate to={`/${channelInfo.id}/seleccionar-empresa`} replace />
        );
      }

      if (
        activeSocioId &&
        ((isTerminosPage && !debeAceptarTerminos) ||
          isSeleccionarEmpresaPage ||
          isAltaDatosPage ||
          isInicioPage)
      ) {
        return <Navigate to={`/${channelInfo.id}/legajo`} replace />;
      }
    } else if (!telefonoActual) {
      // Nunca completó el Paso 2 (ver Paso1Cuit: el socio se crea con el
      // "umbral", el Paso 2 es lo que termina de cargar datos como el
      // teléfono). Lo mandamos directo a completarlo, sin pasar de nuevo
      // por Paso1Cuit (ese paso bloquearía por "ya existe"). A propósito ya
      // NO importa el resultado del CDA acá — el socio puede entrar a
      // operar con su cuenta más allá de si el CDA de ingreso pasó o no; el
      // aviso de "no pasaste las validaciones" vive en LegajoUniversalBar
      // (banner permanente) y el bloqueo real está en la migración a SGR+,
      // no en el acceso (acordado con el equipo el 2026-08-13).
      if (!isAltaDatosPage && !debeAceptarTerminos) {
        return (
          <Navigate
            to={`/${channelInfo.id}/alta-datos-empresa`}
            state={{ socioParaCompletar: empresaActual }}
            replace
          />
        );
      }
    } else if (
      (isTerminosPage && !debeAceptarTerminos) ||
      isAltaDatosPage ||
      isSeleccionarEmpresaPage ||
      isInicioPage ||
      isEstadoSolicitudPage
    ) {
      return <Navigate to={`/${channelInfo.id}/legajo`} replace />;
    }

    if (!isSolicitudesEnabled && isSolicitudesPage) {
      return <Navigate to={`/${channelInfo.id}/legajo`} replace />;
    }
  } else if (usuarioWebId && !tieneEmpresas) {
    if (isVendor) {
      if (!isSeleccionarEmpresaPage && !isAltaDatosPage) {
        return <Navigate to={`/${channelInfo.id}/seleccionar-empresa`} replace />;
      }
    } else if (!debeAceptarTerminos && !isAltaDatosPage) {
      // El chequeo de arriba ya lo mandó a /terminos si todavía le faltaba
      // aceptar. Si llegó hasta acá sin necesitarlo (o ya lo aceptó en un
      // intento de alta anterior que abandonó antes de crear la empresa),
      // lo mandamos directo al alta — no hace falta mostrarle /terminos de nuevo.
      return <Navigate to={`/${channelInfo.id}/alta-datos-empresa`} replace />;
    }
  }

  return <>{children}</>;
};

export default OnboardingGuard;
