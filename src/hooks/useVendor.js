import { useQuery } from "@tanstack/react-query";
import { tercerosService } from "../services/tercerosService";
import { useAuthStore } from "../store/useAuthStore";

export const useVendor = () => {
  const user = useAuthStore((state) => state.user);
  const email = user?.email || "";

  return useQuery({
    queryKey: ["vendor", email],
    queryFn: async () => {
      if (!email) return { isVendor: false, vendorCuit: null, vendorId: null };

      // --- MOCK PARA PRUEBAS LOCALES ---
      if (email.toLowerCase() === "vendorbind@yopmail.com") {
        return {
          isVendor: true,
          vendorCuit: "20123456789", // Un CUIT de prueba que no podrán vincular
          vendorId: 99999,
        };
      }
      // ---------------------------------

      // Consultamos el endpoint con TipoTerceroRelacionadoID = 3001 (temporalmente, luego el back agregará un filtro por email)
      const data = await tercerosService.obtenerTercerosSGRPlus({
        TipoTerceroRelacionadoID: 3001,
      });

      // Asegurarse de que data sea un array
      const items = Array.isArray(data) ? data : data?.items || data?.data || [];

      // Buscar si el email del usuario logueado coincide con algún tercero de tipo vendor
      const vendorMatch = items.find(
        (t) => (t.mail || t.Mail || "").toLowerCase() === email.toLowerCase(),
      );

      if (vendorMatch) {
        return {
          isVendor: true,
          vendorCuit: vendorMatch.cuit || vendorMatch.Cuit || vendorMatch.nrodocumento || null,
          vendorId: vendorMatch.tercerorelacionadoid || vendorMatch.TerceroRelacionadoID || vendorMatch.id || null,
        };
      }

      return { isVendor: false, vendorCuit: null, vendorId: null };
    },
    enabled: !!email,
    staleTime: 1000 * 60 * 30, // Cache for 30 minutes to avoid frequent calls
  });
};
