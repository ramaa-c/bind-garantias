// Pantallas web fijas donde se evalúan CDAs agrupados. Centralizado acá para
// no repetir el literal en cada pantalla de configuración (CadenasCda,
// CdaConfigModal, ActivarCadenaModal). Los usos de ejecución (cda/execute en
// Paso1Cuit, RepresentanteModal, SocioAccionistaModal) no dependen de esta lista.
export const PANTALLAS_CDA = [
  { value: "PANTALLA_INGRESO_CUIT", label: "Validación inicial de CUIT" },
  { value: "PANTALLA_SOCIOS", label: "Validación de Socios y Representantes" },
];
