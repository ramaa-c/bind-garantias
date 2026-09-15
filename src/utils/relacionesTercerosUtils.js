import { FiUser, FiBriefcase } from "react-icons/fi";
import {
  RELACIONES_TERCEROS_BASE,
  IDS_RELACIONES_TERCEROS_BASE,
} from "../constants/tiposRelacionSocio";

// La respuesta de api/TipoRelacionSocio (ver tipoRelacionSocioService) llega
// en distintas formas según el endpoint devuelva un array plano o uno
// envuelto - se normaliza acá una sola vez para no repetir el mismo
// `Array.isArray(...) ? ... : ...` en cada consumidor.
export const normalizarCatalogoActivo = (data) => {
  const arr = Array.isArray(data) ? data : data?.items || data?.data || [];
  return arr
    .map((item) => ({
      id: Number(item.tiporelacionsocioid ?? item.TipoRelacionSocioID),
      descripcion: item.descripcion ?? item.Descripcion ?? "",
    }))
    .filter((item) => item.id > 0);
};

// Accionista es estructuralmente distinto de los otros 3 (tiene % de
// participación, pide DNI, tiene reglas de CDA propias sobre la
// composición accionaria - es información que la SGR necesita sí o sí) -
// es el único de los 4 que no se apaga aunque el admin todavía no lo haya
// activado en /admin/tipos-relacion-socio para este ambiente. Los otros 3
// (representanteLegal/apoderados/agentesBolsa) sí dependen de estar
// activados: si no lo están, quedan afuera.
const CLAVE_SIEMPRE_ACTIVA = "accionistas";

// De los 4 tipos de terceros con flujo de carga propio (ver
// constants/tiposRelacionSocio.js), devuelve los que el admin efectivamente
// activó en /admin/tipos-relacion-socio para este ambiente (más Accionista,
// que siempre está), con la descripción viva que le hayan puesto (o
// `undefined` si ese ID no está en el catálogo - el caller cae a su propio
// título estático de respaldo). Un ambiente que todavía no cargó nada de
// esto (ej. desa recién levantado) devuelve solo Accionista - las pantallas
// que consumen esto quedan sin las otras 3 relaciones en vez de asumir que
// siempre existen.
export const resolverRelacionesBaseActivas = (catalogoActivo) => {
  const descripcionPorId = new Map(catalogoActivo.map((it) => [it.id, it.descripcion]));
  return RELACIONES_TERCEROS_BASE.filter(
    (r) => r.clave === CLAVE_SIEMPRE_ACTIVA || descripcionPorId.has(r.tipoRelacionSocioId),
  ).map((r) => ({ ...r, descripcion: descripcionPorId.get(r.tipoRelacionSocioId) }));
};

// Pestañas por tipo de persona/sociedad - la parametrización de requisitos
// (documentos y relaciones) varía por cada una, así que cualquier pantalla
// que edite esa parametrización (RequisitosConfigModal, y la mini
// parametrización de terceros en TiposRelacionSocio.jsx) las necesita.
export const TABS_TIPO_PERSONA = [
  { id: "sa", label: "S.A.", icon: FiBriefcase },
  { id: "srl", label: "S.R.L.", icon: FiBriefcase },
  { id: "sh", label: "S.H.", icon: FiBriefcase },
  { id: "otras", label: "Otras", icon: FiBriefcase },
  { id: "fisica", label: "Física", icon: FiUser },
];

// Título/descripción de arranque para los 4 tipos con flujo de carga propio
// en el legajo - se usan mientras carga el catálogo curado (ver
// construirRelationMetadata más abajo) o si por algún motivo esa relación
// todavía no está activada en /admin/tipos-relacion-socio. Una vez que el
// catálogo responde, el título real sale de ahí (renombrar una relación en
// esa pantalla se refleja acá solo).
const RELATION_METADATA_BASE = [
  { key: "accionistas", title: "Composición Accionaria", desc: "Declaración del cuadro accionario y participaciones societarias (Socio/Fiador)." },
  { key: "representanteLegal", title: "Representantes Legales", desc: "Administración de representantes legales habilitados." },
  { key: "apoderados", title: "Apoderados", desc: "Administración de apoderados habilitados para operar en nombre del titular." },
  { key: "agentesBolsa", title: "Agentes de Bolsa", desc: "Vinculación y administración de cuentas comitentes con agentes de bolsa." },
  { key: "usuarios", title: "Vincular Usuarios", desc: "Autorización y otorgamiento de accesos a otros usuarios en la plataforma." },
];

const DESC_RELACION_EXTRA =
  "Relación de terceros vinculada al socio (contacto, domicilio y CUIT).";

// Física no tiene Composición Accionaria ni Representante Legal (230) -
// solo Apoderado (210), que sí aplica a ambos tipos de persona.
export const esRelacionVisible = (key, tab) => {
  if (tab === "fisica" && key === "accionistas") return false;
  if (tab === "fisica" && key === "representanteLegal") return false;
  return true;
};

// Combina los 4 tipos "de siempre" (con su título vivo del catálogo, si ya
// está activado) con cualquier relación extra que el admin haya agregado en
// /admin/tipos-relacion-socio (ver comentario en RequisitosConfigModal.jsx
// sobre cómo se cargan esas en el legajo), más "Vincular Usuarios" siempre
// al final.
export const construirRelationMetadata = (catalogoActivo, isLoadingCatalogoActivo) => {
  const relacionesBaseActivas = resolverRelacionesBaseActivas(catalogoActivo);
  const descripcionPorClave = Object.fromEntries(
    relacionesBaseActivas.map((r) => [r.clave, r.descripcion]),
  );
  const clavesActivas = new Set(relacionesBaseActivas.map((r) => r.clave));

  const baseSinUsuarios = RELATION_METADATA_BASE.filter((meta) => meta.key !== "usuarios");
  const metaUsuarios = RELATION_METADATA_BASE.find((meta) => meta.key === "usuarios");

  const base = baseSinUsuarios
    .filter((meta) => isLoadingCatalogoActivo || clavesActivas.has(meta.key))
    .map((meta) => {
      const tituloVivo = descripcionPorClave[meta.key];
      return tituloVivo ? { ...meta, title: tituloVivo } : meta;
    });

  const extras = catalogoActivo
    .filter((item) => !IDS_RELACIONES_TERCEROS_BASE.includes(item.id))
    .map((item) => ({
      key: String(item.id),
      title: item.descripcion || `Relación #${item.id}`,
      desc: DESC_RELACION_EXTRA,
    }));

  return [...base, ...extras, ...(metaUsuarios ? [metaUsuarios] : [])];
};
