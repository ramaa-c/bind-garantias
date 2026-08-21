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
// Devuelve `true` mientras haya que bloquear el render (todavía cargando el
// chequeo, o ya confirmado que está restringido) — el caller corta con un
// `if (bloqueado) return null;` antes de renderizar contenido real.
export const useBloqueoAdminRestringido = () => {
  const navigate = useNavigate();
  const { isRestricted, isPending } = useAdminRestrictions();

  useEffect(() => {
    if (!isPending && isRestricted) {
      navigate("/admin", { replace: true });
    }
  }, [isPending, isRestricted, navigate]);

  return isPending || isRestricted;
};

export default useBloqueoAdminRestringido;
