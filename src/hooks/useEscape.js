import { useEffect } from "react";

/**
 * Hook para cerrar modales o elementos con la tecla Escape.
 * @param {Function} onClose - Función que se ejecuta al presionar Escape.
 * @param {boolean} isOpen - Condición para saber si el modal está abierto y debe escuchar.
 */
export const useEscape = (onClose, isOpen = true) => {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, isOpen]);
};
