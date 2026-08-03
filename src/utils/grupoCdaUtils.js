import { cdaService } from "../services/cdaService";

// Resuelve (y si hace falta, crea) el GrupoCda para una combinación
// Pantalla+Cadena. El sembrado con CDAs "por defecto" SOLO pasa en el flujo
// de alta de la cadena (ActivarCadenaModal); acá el fallback crea el grupo
// vacío, para no bloquear a un admin que entra a configurar una cadena que
// ya estaba activa antes de este cambio de modelo.
export const resolverGrupoCda = async (pantalla, cadenaValorId) => {
  const existing = await cdaService.obtenerGrupoCda(pantalla, cadenaValorId);
  const existingList = Array.isArray(existing) ? existing : existing?.items || existing?.data || (existing ? [existing] : []);
  const row = existingList[0];
  if (row) return row;

  const pantallaGrupoCdaId = await cdaService.obtenerOCrearPantallaGrupoCda(pantalla);
  return cdaService.crearGrupoCda({
    pantallagrupocdaid: pantallaGrupoCdaId,
    cadenavalorid: cadenaValorId,
    expresionagrupacion: "",
  });
};
