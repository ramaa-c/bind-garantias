import { RepresentanteModal } from "../RepresentanteModal/RepresentanteModal";

// Apoderado aplica tanto a personas físicas como jurídicas (para
// jurídicas, ver también RepresentanteLegalModal).
export function ApoderadoModal(props) {
  return <RepresentanteModal {...props} rolFijo="Apoderado" />;
}
