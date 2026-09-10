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
// el selector paso a paso de CadenasCda.jsx) - es un literal fijo, usado
// tanto por la config (LineasCda.jsx, con el mismo CdaPanel.jsx que usa
// CadenasCda.jsx: los CDAs de línea se vinculan por cadena entera, no existe
// un "GrupoCda por línea" en el backend) como por la ejecución
// (AltaOperacion.jsx). Valor confirmado contra el catálogo real de
// PantallaGrupoCda del backend el 2026-08-18 (PantallaGrupoCdaID: 4).
export const PANTALLA_LINEAS = "PANTALLA_LINEAS";

// Las 3 pantallas reales donde se agrupan CDAs, para el filtro del listado
// global y los checkboxes de vinculación masiva (CdasGlobales.jsx /
// CdaFormPage.jsx). PANTALLAS_CDA no incluye Alta de Línea porque no es una
// opción del paso a paso de CadenasCda.jsx - acá sí es una pantalla más, al
// mismo nivel que las otras dos, ya que este catálogo es compartido por
// las 3.
export const TODAS_PANTALLAS_CDA_GLOBAL = [
  ...PANTALLAS_CDA,
  { value: PANTALLA_LINEAS, label: "Alta de Línea" },
];
