import { useEffect, useState } from "react";

const PREFIJO_CLASES = "menuFlotante";
const SELECTOR_MENU = `.${PREFIJO_CLASES}__menu`;

const esScrollDentroDelMenu = (evento) =>
  evento?.target instanceof Element && !!evento.target.closest(SELECTOR_MENU);

export const useMenuFlotante = ({ onMenuOpen, onMenuClose } = {}) => {
  const [abierto, setAbierto] = useState(false);

  const abrir = () => {
    setAbierto(true);
    onMenuOpen?.();
  };

  const cerrar = () => {
    setAbierto(false);
    onMenuClose?.();
  };

  useEffect(() => {
    if (!abierto) return undefined;
    const cerrarPorCambioDeTamanio = () => setAbierto(false);
    window.addEventListener("resize", cerrarPorCambioDeTamanio);
    window.visualViewport?.addEventListener("resize", cerrarPorCambioDeTamanio);
    return () => {
      window.removeEventListener("resize", cerrarPorCambioDeTamanio);
      window.visualViewport?.removeEventListener("resize", cerrarPorCambioDeTamanio);
    };
  }, [abierto]);

  return {
    classNamePrefix: PREFIJO_CLASES,
    menuPortalTarget: typeof document !== "undefined" ? document.body : null,
    menuPosition: "fixed",
    menuPlacement: "auto",
    menuIsOpen: abierto,
    onMenuOpen: abrir,
    onMenuClose: cerrar,
    closeMenuOnScroll: (evento) => !esScrollDentroDelMenu(evento),
  };
};
