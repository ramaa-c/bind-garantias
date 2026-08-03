import React, { createContext, useContext, useState } from "react";

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

  return (
    <ChannelContext.Provider value={{ channelInfo, setChannelInfo }}>
      {children}
    </ChannelContext.Provider>
  );
};

export const useChannel = () => {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error("useChannel debe ser usado dentro de un ChannelProvider");
  }
  return context;
};
