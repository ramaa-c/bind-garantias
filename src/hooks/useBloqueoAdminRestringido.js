import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAdminRestrictions } from "./useAdminRestrictions";

// Defensa en profundidad: AdminGuard.jsx ya redirige a un usuario restringido
// (vinculado solo por UsuarioCadenaValor, sin EsAdministrador=1) de vuelta a
// /admin apenas intenta entrar a cualquier otra ruta admin — pero eso corre
// una sola vez, centralizado ahí. Este hook repite el mismo chequeo DENTRO de
// cada página individual, para que no dependan únicamente de ese guard: si el
// día de mañana se agrega una ruta nueva sin envolverla bien, o la lógica de
// AdminGuard cambia sin querer, estas páginas igual se protegen solas.
// Devuelve `bloqueado` (ya confirmado que está restringido: el caller corta
// con `if (bloqueado) return null;`) y `verificando` (el chequeo todavía no
// terminó: el caller se dibuja en modo carga, con su skeleton, sin mostrar
// datos reales). Antes las dos cosas cortaban el render y el admin general
// veía la pantalla vacía hasta que terminaba el chequeo.
export const useBloqueoAdminRestringido = () => {
  const navigate = useNavigate();
  const { isRestricted, isPending } = useAdminRestrictions();

  useEffect(() => {
    if (!isPending && isRestricted) {
      navigate("/admin", { replace: true });
    }
  }, [isPending, isRestricted, navigate]);

  return { bloqueado: !isPending && isRestricted, verificando: isPending };
};

export default useBloqueoAdminRestringido;
