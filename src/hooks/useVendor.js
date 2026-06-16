import { useQuery } from "@tanstack/react-query";
import { cadenaValorService } from "../services/cadenaValorService";
import { useAuthStore } from "../store/useAuthStore";

export const useVendor = () => {
  const user = useAuthStore((state) => state.user);
  const email = user?.email || "";

  return useQuery({
    queryKey: ["vendor", email],
    queryFn: async () => {
      if (!email) return { isVendor: false, vendorCuit: null, vendorId: null, cadenas: [] };

      // --- MOCK PARA PRUEBAS LOCALES ---
      if (email.toLowerCase() === "vendorbind@yopmail.com") {
        return {
          isVendor: true,
          vendorCuit: "20123456789", // Un CUIT de prueba que no podrán vincular
          vendorId: 99999,
          cadenas: []
        };
      }
      // ---------------------------------

      try {
        const data = await cadenaValorService.obtenerCadenasPorEmail(email);

        // Asegurarse de que data sea un array
        const items = Array.isArray(data) ? data : data?.items || data?.data || [];

        if (items && items.length > 0) {
          // Si devuelve datos sabemos que es vendor
          const primerCadena = items[0];
          return {
            isVendor: true,
            vendorCuit: primerCadena.cuittercero || null,
            vendorId: null, // Si necesitamos el vendorId luego, lo agregaremos
            cadenas: items
          };
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
