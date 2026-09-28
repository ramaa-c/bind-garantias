import { RepresentanteModal } from "../RepresentanteModal/RepresentanteModal";
import { useTiposRelacionSocioActivos } from "../../../../hooks/useTipoRelacionSocio";
import { RELACION_APODERADO_ID } from "../../../../constants/tiposRelacionSocio";
import { normalizarCatalogoActivo } from "../../../../utils/relacionesTercerosUtils";

// Apoderado aplica tanto a personas físicas como jurídicas (para
// jurídicas, ver también RepresentanteLegalModal). La etiqueta sale de
// api/TipoRelacionSocio, igual que RepresentanteLegalModal - ver el mismo
// comentario ahí.
export function ApoderadoModal(props) {
  const { data } = useTiposRelacionSocioActivos();
  const catalogoActivo = normalizarCatalogoActivo(data);
  const etiquetaViva = catalogoActivo.find((it) => it.id === RELACION_APODERADO_ID)?.descripcion;

  return (
    <RepresentanteModal
      {...props}
      tipoRelacionSocioId={RELACION_APODERADO_ID}
      etiquetaRol={etiquetaViva || "Apoderado"}
    />
  );
}
