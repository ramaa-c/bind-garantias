import { RepresentanteModal } from "../RepresentanteModal/RepresentanteModal";

// Solo aplica a personas jurídicas - una persona física no tiene
// "Representante Legal" (ver ApoderadoModal para ese caso).
export function RepresentanteLegalModal(props) {
  return <RepresentanteModal {...props} rolFijo="Representante Legal" />;
}
