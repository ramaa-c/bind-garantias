// Una vez que Paso1Cuit cruza el "umbral" (POST /Socio + CDA evaluado), el
// CUIT queda comprometido para siempre en ese intento — pero la transición
// de Paso1 a Paso2 dentro de AltaDatosEmpresa.jsx es un cambio de estado
// local (setPasoActual), no una navegación real: no hay ningún
// location.state que sobreviva a un F5. Sin esto, recargar la página en
// Paso2 remonta el componente con pasoActual=1 y un CUIT editable, aunque
// el socio ya exista y ya haya pasado el CDA en el backend.
//
// Guardamos acá (sessionStorage, no localStorage: se pierde solo si se
// cierra la pestaña, que es aceptable — en ese caso OnboardingGuard igual
// vuelve a resolver todo desde el servidor en el próximo ingreso) una copia
// de los datos ya conocidos del socio, con la misma forma que espera
// mapearSocioAValoresFormulario en AltaDatosEmpresa.jsx. Así, ante un
// reload, no hace falta ninguna consulta adicional al backend para volver a
// mostrar el Paso 2 bloqueado: el dato ya está en memoria local.
const clave = (cadenaSlug, email) =>
  `bind:altaEmpresaPendiente:${cadenaSlug || ""}:${email || ""}`;

export const guardarSocioPendiente = (cadenaSlug, email, socio) => {
  try {
    sessionStorage.setItem(clave(cadenaSlug, email), JSON.stringify(socio));
  } catch {
    // sessionStorage puede fallar (modo privado, cuota agotada, etc.) — no
    // es crítico, solo se pierde el blindaje extra contra un reload.
  }
};

export const leerSocioPendiente = (cadenaSlug, email) => {
  try {
    const raw = sessionStorage.getItem(clave(cadenaSlug, email));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const limpiarSocioPendiente = (cadenaSlug, email) => {
  try {
    sessionStorage.removeItem(clave(cadenaSlug, email));
  } catch {
    // no-op
  }
};
