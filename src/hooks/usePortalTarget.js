import { useEffect, useState } from "react";

// Busca el nodo del portal en un efecto (después del commit), no en el
// initializer de useState (durante el render): el div destino se monta en el
// mismo commit que el componente que llama a este hook - son hermanos dentro
// del mismo {isActive && (...)} de SociosLegajo.jsx - así que buscarlo
// durante el render de este componente casi siempre llega antes de que React
// lo haya confirmado en el DOM real, y devuelve null para siempre (el
// initializer de useState solo corre una vez). Confirmado en vivo:
// "Agregar X" no aparecía en ninguna sección la primera vez que se abría esa
// pestaña.
export function usePortalTarget(elementId) {
  const [portalTarget, setPortalTarget] = useState(null);

  useEffect(() => {
    setPortalTarget(document.getElementById(elementId));
  }, [elementId]);

  return portalTarget;
}
