import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { MODO_POR_HOST, MODO_LEGACY, resolverTenant } from "../utils/tenantConfig";
import { LoadingScreen } from "../components/ui/LoadingScreen/LoadingScreen";

const ChannelContext = createContext();

export const ChannelProvider = ({ children }) => {
  // Iniciamos con valores por defecto genéricos hasta que TenantLayout establezca los correctos
  const [channelInfo, setChannelInfo] = useState({
    id: "default",
    nombre: "BIND Garantías",
    logo: null,
    colorPrincipal: "var(--color-azul-bind)",
    colorSecundario: "var(--color-amarillo-bind)",
  });

  // Modo de ruteo (ver utils/tenantConfig.js). Se resuelve una sola vez, al
  // arrancar: hasta que no se sepa si el hostname corresponde a una cadena
  // no se pueden montar las rutas, porque el árbol de rutas es distinto en
  // cada modo (y montar el equivocado haría parpadear una pantalla que no
  // corresponde, o peor, redirigir a /not-found antes de tiempo).
  const [tenant, setTenant] = useState(null);

  useEffect(() => {
    let cancelado = false;
    resolverTenant().then((resultado) => {
      if (!cancelado) setTenant(resultado);
    });
    return () => {
      cancelado = true;
    };
  }, []);

  const valor = useMemo(() => {
    const modoPorHost = tenant?.modo === MODO_POR_HOST;
    return {
      channelInfo,
      setChannelInfo,
      modoPorHost,
      // ID de la cadena resuelto por hostname (o por el override de
      // desarrollo). En modo legacy es null: ahí el ID sigue saliendo del
      // path, como siempre (ver useCadenaActiva).
      cadenaIdDeHost: tenant?.cadenaId ?? null,
      // Prefijo para construir URLs internas. En modo por host es "" (las
      // rutas de cliente cuelgan de la raíz); en legacy es "/{id}", igual
      // que el `/${channelInfo.id}` que estaba escrito a mano en cada
      // navigate() hasta ahora.
      basePath: modoPorHost ? "" : `/${channelInfo.id}`,
    };
  }, [channelInfo, tenant]);

  if (!tenant) {
    return (
      <LoadingScreen
        title="Cargando"
        message="Preparando la plataforma..."
      />
    );
  }

  return (
    <ChannelContext.Provider value={valor}>{children}</ChannelContext.Provider>
  );
};

export const useChannel = () => {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error("useChannel debe ser usado dentro de un ChannelProvider");
  }
  return context;
};
