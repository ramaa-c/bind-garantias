import { useContext } from "react";
import { ChannelContext } from "./channelContextObject";

export const useChannel = () => {
  const context = useContext(ChannelContext);
  if (!context) {
    throw new Error("useChannel debe ser usado dentro de un ChannelProvider");
  }
  return context;
};
