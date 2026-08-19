// Pantallas web fijas donde se evalúan CDAs agrupados. Centralizado acá para
// no repetir el literal en cada pantalla de configuración (CadenasCda,
// CdaConfigModal, ActivarCadenaModal). Los usos de ejecución (cda/execute en
// Paso1Cuit, RepresentanteModal, SocioAccionistaModal) no dependen de esta lista.
export const PANTALLAS_CDA = [
  { value: "PANTALLA_INGRESO_CUIT", label: "Validación inicial de CUIT" },
  { value: "PANTALLA_SOCIOS", label: "Validación de Socios y Representantes" },
];

// Las Líneas de crédito no tienen "pantallas" elegibles como el onboarding
// (Paso1Cuit, modales de socios): se evalúan en un único punto, al enviar la
// solicitud de alta. Por eso no está en PANTALLAS_CDA (no es una opción para
// el selector admin) - es un literal fijo, usado tanto por la config
// (LineasCda.jsx, con el mismo CdaPanel.jsx que usa CadenasCda.jsx: los CDAs
// de línea se vinculan por cadena entera, no existe un "GrupoCda por línea"
// en el backend) como por la ejecución (AltaOperacion.jsx).
export const PANTALLA_LINEA = "PANTALLA_LINEA";
