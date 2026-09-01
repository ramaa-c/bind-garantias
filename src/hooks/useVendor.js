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

      // No atajar errores acá: si CadenaValor/RelacionesPorEmail falla
      // (red, 5xx), la query debe quedar en estado de error para que
      // OnboardingGuard lo bloquee — devolver isVendor:false en ese caso
      // hacía pasar a un vendor real como si no lo fuera (y con
      // staleTime de 30min, el falso negativo quedaba cacheado ese rato).
      const data = await cadenaValorService.obtenerCadenasPorEmail(email);

      // Asegurarse de que data sea un array
      const items = Array.isArray(data) ? data : data?.items || data?.data || [];

      if (items && items.length > 0 && !isNaN(currentCadenaId)) {
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

      return { isVendor: false, vendorCuit: null, vendorId: null, cadenas: [] };
    },
    enabled: !!email,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes to avoid frequent calls
  });
};
