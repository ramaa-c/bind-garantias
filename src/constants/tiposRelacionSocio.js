// Única fuente de verdad para los 4 tipos de terceros que hoy tienen un
// flujo de carga propio en el legajo (accionista/representante
// legal/apoderado/agente de bolsa) - ver SGRPLUSPLA (parametrización de
// terceros). El ID sigue siendo el mismo del catálogo real de SGR+
// (confirmado con Victor: api/TipoRelacionSocio expone ese mismo ID, nunca
// uno propio), pero antes vivía repetido a mano en ~10 archivos distintos.
// Acá se centraliza para que cambiarlo (si algún día correspondiera) sea un
// solo lugar, y para que la parametrización por cadena (requisitosService.js)
// pueda cruzarlo contra lo que el admin activó en /admin/tipos-relacion-socio
// en vez de asumir que siempre existe.
//
// Lo que SÍ es dinámico desde acá en adelante es el NOMBRE que se muestra
// (Descripcion de api/TipoRelacionSocio) - renombrar una relación en esa
// pantalla se refleja solo, sin tocar código. Lo que sigue fijo es a qué
// ID corresponde cada flujo de carga (cada uno tiene campos propios:
// % de participación, cuenta comitente, etc. - unificar eso es la Fase 3,
// pendiente de un caso real).
export const RELACION_ACCIONISTA_ID = 25;
export const RELACION_REPRESENTANTE_LEGAL_ID = 230;
export const RELACION_APODERADO_ID = 210;
export const RELACION_AGENTE_BOLSA_ID = 21;

// Pseudo-ID interno (no existe en el catálogo real de SGR+): gobierna la
// pestaña "Vincular Usuarios" de la parametrización, que no es una relación
// de TerceroRelacionado sino de UsuarioCadenaValor.
export const RELACION_USUARIOS_ID = 999;

export const RELACIONES_TERCEROS_BASE = [
  { clave: "accionistas", tipoRelacionSocioId: RELACION_ACCIONISTA_ID },
  { clave: "representanteLegal", tipoRelacionSocioId: RELACION_REPRESENTANTE_LEGAL_ID },
  { clave: "apoderados", tipoRelacionSocioId: RELACION_APODERADO_ID },
  { clave: "agentesBolsa", tipoRelacionSocioId: RELACION_AGENTE_BOLSA_ID },
];

export const IDS_RELACIONES_TERCEROS_BASE = RELACIONES_TERCEROS_BASE.map(
  (r) => r.tipoRelacionSocioId,
);

export const CLAVE_POR_ID_RELACION = Object.fromEntries(
  RELACIONES_TERCEROS_BASE.map((r) => [r.tipoRelacionSocioId, r.clave]),
);
