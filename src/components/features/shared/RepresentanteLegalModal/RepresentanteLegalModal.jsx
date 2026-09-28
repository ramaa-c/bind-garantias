import { RepresentanteModal } from "../RepresentanteModal/RepresentanteModal";
import { useTiposRelacionSocioActivos } from "../../../../hooks/useTipoRelacionSocio";
import { RELACION_REPRESENTANTE_LEGAL_ID } from "../../../../constants/tiposRelacionSocio";
import { normalizarCatalogoActivo } from "../../../../utils/relacionesTercerosUtils";

// Solo aplica a personas jurídicas - una persona física no tiene
// "Representante Legal" (ver ApoderadoModal para ese caso). La etiqueta
// sale de api/TipoRelacionSocio (renombrar la relación en
// /admin/tipos-relacion-socio se ve acá solo); si ese ID todavía no está
// activado para este ambiente, se usa el nombre de siempre como respaldo -
// en la práctica no debería llegar a abrirse sin estar activado, porque
// SociosLegajo ya oculta la pestaña en ese caso (ver resolverRelacionesBaseActivas).
export function RepresentanteLegalModal(props) {
  const { data } = useTiposRelacionSocioActivos();
  const catalogoActivo = normalizarCatalogoActivo(data);
  const etiquetaViva = catalogoActivo.find((it) => it.id === RELACION_REPRESENTANTE_LEGAL_ID)?.descripcion;

  return (
    <RepresentanteModal
      {...props}
      tipoRelacionSocioId={RELACION_REPRESENTANTE_LEGAL_ID}
      etiquetaRol={etiquetaViva || "Representante Legal"}
    />
  );
}
