import { useParams } from "react-router-dom";
import { useChannel } from "../context/ChannelContext";

// Única fuente de verdad de "en qué cadena de valor estamos parados",
// independientemente de cómo se haya resuelto:
//
//   - Modo por host: el ID lo puso el hostname vía /tenants.json (o el
//     override ?cadena=X de desarrollo). No hay ID en la URL.
//   - Modo legacy: el ID sigue viniendo del path (/:cadenaSlug/...), tal
//     cual venía funcionando hasta ahora.
//
// Reemplaza al patrón `const { cadenaSlug } = useParams(); Number(cadenaSlug)`
// que estaba repetido por toda la app: ese, en modo por host, no encuentra
// ningún parámetro y termina cayendo a un ID inventado.
export const useCadenaActiva = () => {
  const { cadenaSlug } = useParams();
  const { cadenaIdDeHost } = useChannel();

  const cadenaId = cadenaIdDeHost ?? (Number(cadenaSlug) || null);

  return {
    cadenaId,
    // Versión string, para las claves de storage y demás lugares que hoy
    // usan el slug crudo (ver altaEmpresaPendiente.js).
    cadenaSlug: cadenaId != null ? String(cadenaId) : cadenaSlug,
  };
};
