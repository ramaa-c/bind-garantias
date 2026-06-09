import React, { createContext, useContext, useState } from "react";
import logoBind from "../assets/images/bind-g-logo.svg";
import johnDeereLogo from "../assets/images/canales/john-deere.png";

const ChannelContext = createContext();

export const CANALES_MOCK = {
  canal1: {
    id: "canal1",
    nombre: "John Deere",
    logo: johnDeereLogo,
    colorPrincipal: "#367C2B",
    colorSecundario: "var(--color-amarillo-bind)",
  },
  bind: {
    id: "bind",
    nombre: "BIND Garantías",
    logo: logoBind,
    colorPrincipal: "var(--color-azul-bind)",
    colorSecundario: "var(--color-amarillo-bind)",
  },
  default: {
    id: "default",
    nombre: "BIND Garantías",
    logo: logoBind,
    colorPrincipal: "var(--color-azul-bind)",
    colorSecundario: "var(--color-amarillo-bind)",
  },
};

export const ChannelProvider = ({ children }) => {
  // Iniciamos siempre con default, el Layout se encargará de cambiarlo
  const [channelInfo, setChannelInfo] = useState(CANALES_MOCK.default);

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
