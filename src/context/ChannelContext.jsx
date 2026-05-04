import React, { createContext, useContext, useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";

import logoBind from "../assets/images/bind-g-logo.svg";
import johnDeereLogo from "../assets/images/canales/john-deere.png";

const ChannelContext = createContext();

// Simulación de base de datos de canales (En el futuro esto vendría de una API)
const CANALES_MOCK = {
  "canal1": {
    id: "canal1",
    nombre: "John Deere",
    logo: johnDeereLogo,
    colorPrincipal: "#367C2B",
    colorSecundario: "#FFDE00",
    mensajeBienvenida: "Bienvenido al portal de garantías de John Deere",
  },
  "bind": {
    id: "bind",
    nombre: "BIND Garantías",
    logo: logoBind,
    colorPrincipal: "#003DA5",
    colorSecundario: "#FFB612",
    mensajeBienvenida: "Bienvenido a BIND Garantías",
  },
  "default": {
    id: "default",
    nombre: "BIND Garantías",
    logo: logoBind,
    colorPrincipal: "#003DA5",
    colorSecundario: "#FFB612",
    mensajeBienvenida: "Bienvenido al portal de garantías",
  }
};

export const ChannelProvider = ({ children }) => {
  const [channelInfo, setChannelInfo] = useState(CANALES_MOCK["default"]);
  const { canal } = useParams();
  const location = useLocation();

  useEffect(() => {
    // Intentamos obtener el canal de la URL
    // Si estamos en una ruta dinámica como /:canal/...
    if (canal && CANALES_MOCK[canal]) {
      setChannelInfo(CANALES_MOCK[canal]);
      localStorage.setItem("current_canal", canal);
    } else {
      // Si no hay canal en la URL, vemos si hay uno guardado en localStorage
      const savedCanal = localStorage.getItem("current_canal");
      if (savedCanal && CANALES_MOCK[savedCanal]) {
        setChannelInfo(CANALES_MOCK[savedCanal]);
      } else {
        setChannelInfo(CANALES_MOCK["default"]);
      }
    }
  }, [canal, location]);

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
