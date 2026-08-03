import { useQuery } from "@tanstack/react-query";
import { cadenaValorService } from "../services/cadenaValorService";
import { useAuthStore } from "../store/useAuthStore";
import { useParams } from "react-router-dom";

export const useVendor = (skip = false) => {
  const user = useAuthStore((state) => state.user);
  const { cadenaSlug } = useParams();
  const currentCadenaId = Number(cadenaSlug);
  const email = skip ? "" : user?.email || "";

  return useQuery({
    queryKey: ["vendor", email, currentCadenaId],
    queryFn: async () => {
      if (!email) return { isVendor: false, vendorCuit: null, vendorId: null, cadenas: [] };

      try {
        const data = await cadenaValorService.obtenerCadenasPorEmail(email);

        // Asegurarse de que data sea un array
        const items = Array.isArray(data) ? data : data?.items || data?.data || [];

        if (items && items.length > 0) {
          if (!isNaN(currentCadenaId)) {
            // Buscamos si el vendor está autorizado para la cadena actual en la URL
            const matchedCadena = items.find(
              (c) => Number(c.cadenavalorid || c.CadenaValorID || c.id) === currentCadenaId
            );

            if (matchedCadena) {
              return {
                isVendor: true,
                vendorCuit: matchedCadena.cuittercero || null,
                vendorId: null, // Si necesitamos el vendorId luego, lo agregaremos
                cadenas: items
              };
            }
          }
        }
      } catch (error) {
        console.error("Error al verificar si es vendor (CadenaValor):", error);
      }

      return { isVendor: false, vendorCuit: null, vendorId: null, cadenas: [] };
    },
    enabled: !!email,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes to avoid frequent calls
  });
};
