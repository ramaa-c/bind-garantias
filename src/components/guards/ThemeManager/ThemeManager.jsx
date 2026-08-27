import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useThemeStore } from "../../../store/useThemeStore";

// El modo claro es solo para la zona cliente (ver Navbar.jsx, donde vive el
// toggle) - el panel admin (/admin/*, /login) mantiene siempre su tema azul
// actual, sin importar la preferencia guardada. Se aplica vía atributo
// data-theme en <html> para que lo lean las variables de index.css
// (:root[data-theme="light"] {...}), sin tocar cada .module.css.
const ThemeManager = () => {
  const location = useLocation();
  const theme = useThemeStore((state) => state.theme);

  const esRutaAdmin =
    location.pathname.startsWith("/admin") || location.pathname === "/login";

  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      !esRutaAdmin && theme === "light" ? "light" : "dark",
    );
  }, [theme, esRutaAdmin]);

  return null;
};

export default ThemeManager;
