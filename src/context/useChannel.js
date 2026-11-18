import { useContext } from "react";
import { ChannelContext } from "./channelContextObject";

const cadenaDelPath = () => {
  const primerSegmento = window.location.pathname.split("/")[1] || "";
  return /^[1-9]\d*$/.test(primerSegmento) ? primerSegmento : null;
};

export const useChannel = () => {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error("useChannel debe ser usado dentro de un ChannelProvider");
  }
  const cadenaEnPath = context.modoPorHost ? null : cadenaDelPath();
  const esSitioAdmin = !context.modoPorHost && !cadenaEnPath;
  return {
    ...context,
    esSitioAdmin,
    baseAcceso: esSitioAdmin || context.modoPorHost ? "" : `/${cadenaEnPath}`,
  };
};
